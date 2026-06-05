import os
import uuid
import git
from dotenv import load_dotenv
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Ensure embeddings import works
from app.rag.embeddings import embed

load_dotenv()

def parse_pdf(pdf_path):
    """Extract text from a PDF file using pypdf."""
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error parsing PDF {pdf_path}: {e}")
        return ""

def load_git_commits(repo_path, repo_name):
    """Extract commits from a git repository using GitPython."""
    commits_data = []
    try:
        if os.path.exists(os.path.join(repo_path, ".git")):
            repo = git.Repo(repo_path)
            if not repo.bare:
                # Load last 100 commits
                for commit in repo.iter_commits(max_count=100):
                    commit_text = (
                        f"Repo: {repo_name}\n"
                        f"Commit: {commit.hexsha}\n"
                        f"Author: {commit.author.name} <{commit.author.email}>\n"
                        f"Date: {commit.authored_datetime}\n"
                        f"Message: {commit.message.strip()}"
                    )
                    metadata = {
                        "source": "repo",
                        "repo": repo_name,
                        "commit_sha": commit.hexsha,
                        "author": commit.author.name,
                        "date": str(commit.authored_datetime),
                        "type": "commit"
                    }
                    commits_data.append((commit_text, metadata))
        else:
            print(f"Directory {repo_path} is not a Git repository.")
    except Exception as e:
        print(f"Error reading git commits for {repo_name}: {e}")
    return commits_data

def ingest_all():
    """Main function to run the RAG ingestion pipeline."""
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    collection_name = "documents"

    print(f"Connecting to Qdrant at: {qdrant_url}")
    client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)

    # Recreate or ensure collection exists
    print(f"Setting up collection: {collection_name}")
    if not client.collection_exists(collection_name):
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE)
        )
        print(f"Created collection {collection_name}")
    else:
        print(f"Collection {collection_name} already exists.")

    # Get paths relative to this script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
    data_dir = os.path.join(backend_dir, "data")
    repos_dir = os.path.join(data_dir, "repos")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    all_texts = []
    all_metadatas = []

    # 1. Load Resumes (PDFs directly in data_dir)
    print("Loading resumes from data directory...")
    if os.path.exists(data_dir):
        for file in os.listdir(data_dir):
            file_path = os.path.join(data_dir, file)
            if os.path.isfile(file_path) and file.lower().endswith(".pdf"):
                print(f"Parsing resume: {file}")
                pdf_text = parse_pdf(file_path)
                if pdf_text:
                    chunks = text_splitter.split_text(pdf_text)
                    for chunk in chunks:
                        all_texts.append(chunk)
                        all_metadatas.append({
                            "source": "resume",
                            "file": file
                        })
                    print(f"Loaded {len(chunks)} chunks from {file}")

    # 2. Load Repositories (README and Commits)
    print("Loading repositories...")
    if os.path.exists(repos_dir):
        for repo_name in os.listdir(repos_dir):
            repo_path = os.path.join(repos_dir, repo_name)
            if os.path.isdir(repo_path):
                print(f"Processing repository: {repo_name}")
                
                # A. Read README file
                readme_path = None
                readme_name = None
                for file in os.listdir(repo_path):
                    if file.lower() in ("readme.md", "readme.txt", "readme"):
                        readme_path = os.path.join(repo_path, file)
                        readme_name = file
                        break
                
                if readme_path:
                    try:
                        print(f"  Found README: {readme_name}")
                        with open(readme_path, "r", encoding="utf-8") as f:
                            readme_content = f.read()
                        
                        readme_chunks = text_splitter.split_text(readme_content)
                        for chunk in readme_chunks:
                            all_texts.append(chunk)
                            all_metadatas.append({
                                "source": "repo",
                                "repo": repo_name,
                                "file": readme_name,
                                "type": "readme"
                            })
                        print(f"  Loaded {len(readme_chunks)} README chunks")
                    except Exception as e:
                        print(f"  Error reading README for {repo_name}: {e}")
                else:
                    print("  No README found.")

                # B. Read Git Commits
                print("  Reading git commits...")
                commits = load_git_commits(repo_path, repo_name)
                for commit_text, metadata in commits:
                    all_texts.append(commit_text)
                    all_metadatas.append(metadata)
                print(f"  Loaded {len(commits)} commits")

    print(f"Total documents/chunks gathered: {len(all_texts)}")
    if not all_texts:
        print("No documents found to ingest.")
        return

    # 3. Generate embeddings and upsert to Qdrant
    print("Generating embeddings and indexing into Qdrant...")
    batch_size = 32
    points = []
    
    for i in range(0, len(all_texts), batch_size):
        batch_texts = all_texts[i:i+batch_size]
        batch_metadatas = all_metadatas[i:i+batch_size]
        
        # Generate embeddings using our model
        batch_embeddings = embed(batch_texts)
        
        for j, (text, emb, meta) in enumerate(zip(batch_texts, batch_embeddings, batch_metadatas)):
            point_id = str(uuid.uuid4())
            vector = emb.tolist() if hasattr(emb, "tolist") else emb
            
            # Payload schema
            payload = {
                "text": text,
                **meta
            }
            
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload
                )
            )
        
        print(f"Generated embeddings for batch {i//batch_size + 1}/{(len(all_texts)-1)//batch_size + 1}")

    # Upsert to Qdrant
    print(f"Upserting {len(points)} points to Qdrant collection '{collection_name}'...")
    
    # We can upsert in batches of 100 to avoid request size issues
    upsert_batch_size = 100
    for i in range(0, len(points), upsert_batch_size):
        client.upsert(
            collection_name=collection_name,
            points=points[i:i+upsert_batch_size]
        )
        print(f"Upserted points {i} to {min(i+upsert_batch_size, len(points))}")

    print("Ingestion complete!")

if __name__ == "__main__":
    ingest_all()
