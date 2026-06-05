import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from app.rag.embeddings import embed

load_dotenv()

def get_all_repositories(client, collection_name):
    """Retrieve all unique repository names and resume file names from Qdrant via scrolling."""
    repos = set()
    resumes = set()
    try:
        offset = None
        while True:
            scroll_res = client.scroll(
                collection_name=collection_name,
                limit=100,
                with_payload=True,
                with_vectors=False,
                offset=offset
            )
            points, next_offset = scroll_res
            for p in points:
                payload = p.payload or {}
                if payload.get("source") == "repo" and payload.get("repo"):
                    repos.add(payload.get("repo"))
                elif payload.get("source") == "resume" and payload.get("file"):
                    resumes.add(payload.get("file"))
            if not next_offset:
                break
            offset = next_offset
    except Exception as e:
        print(f"Error fetching all repositories: {e}")
    return sorted(list(repos)), sorted(list(resumes))

def retrieve(query: str, top_k: int = 5):
    """Retrieve top_k most relevant chunks for a given query from Qdrant, using separate pools for docs and commits."""
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    collection_name = "documents"
    
    # Initialize client
    client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
    
    # Check if collection exists
    if not client.collection_exists(collection_name):
        print(f"Collection '{collection_name}' does not exist. Returning empty results.")
        return []
        
    # Generate embedding for the query
    query_vectors = embed([query])
    query_vector = query_vectors[0]
    
    # Convert numpy array to list if needed
    vector = query_vector.tolist() if hasattr(query_vector, "tolist") else query_vector
    
    # Check if user query is targeting git commits/logs/history/updates (using whole-word matching)
    import re
    query_lower = query.lower()
    query_words = set(re.findall(r'\b\w+\b', query_lower))
    commit_keywords = {
        "commit", "commits", "history", "change", "changes", "log", "logs", 
        "git", "author", "authors", "merged", "push", "branch", "branches", 
        "update", "updates", "pr", "prs", "release", "released"
    }
    has_commit_keyword = any(kw in query_words for kw in commit_keywords) or "pull request" in query_lower
    
    # 1. Fetch documentation chunks (READMEs and Resumes)
    doc_filter = Filter(
        must_not=[
            FieldCondition(key="type", match=MatchValue(value="commit"))
        ]
    )
    doc_results = client.query_points(
        collection_name=collection_name,
        query=vector,
        query_filter=doc_filter,
        limit=top_k
    )
    
    # 2. Fetch commit chunks
    commit_filter = Filter(
        must=[
            FieldCondition(key="type", match=MatchValue(value="commit"))
        ]
    )
    commit_results = client.query_points(
        collection_name=collection_name,
        query=vector,
        query_filter=commit_filter,
        limit=top_k
    )
    
    # Format the results
    doc_chunks = []
    for point in doc_results.points:
        payload = point.payload or {}
        text = payload.get("text", "")
        # Filter out "text" key to keep only metadata
        metadata = {k: v for k, v in payload.items() if k != "text"}
        doc_chunks.append({
            "text": text,
            "metadata": metadata,
            "score": point.score
        })
        
    commit_chunks = []
    for point in commit_results.points:
        payload = point.payload or {}
        text = payload.get("text", "")
        # Filter out "text" key to keep only metadata
        metadata = {k: v for k, v in payload.items() if k != "text"}
        commit_chunks.append({
            "text": text,
            "metadata": metadata,
            "score": point.score
        })
        
    # Sort and combine based on intent
    if has_commit_keyword:
        combined_results = commit_chunks + doc_chunks
    else:
        combined_results = doc_chunks + commit_chunks
        
    # Limit to top_k requested
    final_search_results = combined_results[:top_k]
    
    # Get all unique repositories and resumes to construct a summary chunk
    repos, resumes = get_all_repositories(client, collection_name)
    
    # Format results
    formatted_results = []
    
    # Inject summary as the first result chunk
    if repos or resumes:
        summary_text = (
            f"Here is a summary of all items indexed in the database:\n"
            f"- Repositories/Projects: {', '.join(repos)}\n"
            f"- Resume Files: {', '.join(resumes)}"
        )
        formatted_results.append({
            "text": summary_text,
            "metadata": {"source": "summary", "type": "system_summary"},
            "score": 1.0
        })
    
    formatted_results.extend(final_search_results)
    return formatted_results
