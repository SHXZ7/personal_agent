import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Optional local fallback (used for local scripts like ingestion)
try:
    from sentence_transformers import SentenceTransformer
    LOCAL_MODEL = SentenceTransformer("BAAI/bge-large-en-v1.5")
except ImportError:
    LOCAL_MODEL = None

def embed(texts):
    """Generate embeddings for a list of texts using Hugging Face Inference API or local fallback."""
    if isinstance(texts, str):
        texts = [texts]
        
    hf_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_API_KEY")
    api_url = "https://api-inference.huggingface.co/models/BAAI/bge-large-en-v1.5"
    
    headers = {}
    if hf_token:
        headers["Authorization"] = f"Bearer {hf_token}"
        
    try:
        response = requests.post(
            api_url,
            headers=headers,
            json={"inputs": texts, "options": {"wait_for_model": True}},
            timeout=15
        )
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                # If it's a flat list of floats, wrap it in a list to keep [vectors] shape
                if isinstance(result[0], float):
                    return [result]
                return result
            else:
                raise ValueError(f"Unexpected response format from Hugging Face: {result}")
        else:
            raise RuntimeError(f"Hugging Face API returned status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Hugging Face Inference API failed: {e}.")
        if LOCAL_MODEL:
            print("Falling back to local SentenceTransformer.")
            return LOCAL_MODEL.encode(texts)
        raise e