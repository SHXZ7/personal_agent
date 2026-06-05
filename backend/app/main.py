import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from app.agents import generate_response, generate_response_with_sources
from app.rag.retriever import get_all_repositories
from qdrant_client import QdrantClient

from app.calendar import get_available_slots, create_event

# Load environment variables
load_dotenv()

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    voice: bool = False

class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []

class BookRequest(BaseModel):
    title: str = "Briefing with Mohammed Shaaz"
    start: str  # Format: YYYY-MM-DD HH:MM or ISO
    end: str = None  # Format: YYYY-MM-DD HH:MM or ISO
    email: str

app = FastAPI(
    title="FastAPI Backend",
    description="A FastAPI backend API for Next.js frontend",
    version="1.0.0"
)

# Configure CORS to allow frontend origin
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Accept additional origins if specified in environment
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    origins.extend([o.strip() for o in env_origins.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the FastAPI Backend!",
        "status": "online"
    }

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    history_dicts = [{"role": msg.role, "text": msg.text} for msg in request.history]
    res = generate_response_with_sources(request.message, history=history_dicts, voice=request.voice)
    return ChatResponse(answer=res["answer"], sources=res["sources"])

@app.get("/available-slots")
def get_available_slots_endpoint():
    slots = get_available_slots()
    return {"slots": slots}

@app.post("/book")
def book_endpoint(request: BookRequest):
    import datetime
    start = request.start
    end = request.end
    
    if not end:
        # Default end time to start time + 1 hour
        try:
            if "T" in start:
                start_dt = datetime.datetime.fromisoformat(start.replace("Z", ""))
                end_dt = start_dt + datetime.timedelta(hours=1)
                end = end_dt.isoformat()
            else:
                start_dt = datetime.datetime.strptime(start, "%Y-%m-%d %H:%M")
                end_dt = start_dt + datetime.timedelta(hours=1)
                end = end_dt.strftime("%Y-%m-%d %H:%M")
        except Exception:
            end = start
            
    res = create_event(request.title, start, end, request.email)
    return res

@app.get("/projects")
def get_projects_endpoint():
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
    repos, resumes = get_all_repositories(client, "documents")
    return {"projects": repos, "resumes": resumes}

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "api": "FastAPI Backend",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn 
    port = int(os.getenv("PORT", 8000))
    # Run the application
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
