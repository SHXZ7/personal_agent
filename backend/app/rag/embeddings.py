from sentence_transformers import SentenceTransformer

model = SentenceTransformer(
    "BAAI/bge-large-en-v1.5"
)

def embed(texts):
    return model.encode(texts)