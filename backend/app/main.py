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
# In Vercel multi-service deployments, both frontend and backend share the same domain.
# Requests come from the same origin via the /_/backend route prefix, so wildcard is safe here.
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,   # Must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the FastAPI Backend!",
        "status": "online"
    }

@app.get("/debug")
def debug_endpoint():
    """Temporary debug endpoint to diagnose backend startup and env issues."""
    import sys
    import traceback
    results = {
        "python_version": sys.version,
        "sys_path": sys.path[:5],
        "env_vars": {
            "GROQ_API_KEY": "set" if os.getenv("GROQ_API_KEY") else "MISSING",
            "QDRANT_URL": os.getenv("QDRANT_URL", "MISSING"),
            "QDRANT_API_KEY": "set" if os.getenv("QDRANT_API_KEY") else "MISSING",
            "HF_TOKEN": "set" if os.getenv("HF_TOKEN") else "MISSING",
        },
        "import_tests": {}
    }
    for mod_name, mod_import in [
        ("groq", "from groq import Groq"),
        ("qdrant_client", "from qdrant_client import QdrantClient"),
        ("app.agents", "from app.agents import generate_response_with_sources"),
        ("app.rag", "from app.rag import retrieve"),
        ("app.calendar", "from app.calendar import get_available_slots"),
    ]:
        try:
            exec(mod_import)
            results["import_tests"][mod_name] = "OK"
        except Exception as e:
            results["import_tests"][mod_name] = f"ERROR: {type(e).__name__}: {str(e)}"
    return results

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    try:
        history_dicts = [{"role": msg.role, "text": msg.text} for msg in request.history]
        res = generate_response_with_sources(request.message, history=history_dicts, voice=request.voice)
        return ChatResponse(answer=res["answer"], sources=res["sources"])
    except Exception as e:
        import traceback
        err = f"[Backend Error] {type(e).__name__}: {str(e)}\n\n{traceback.format_exc()}"
        return ChatResponse(answer=err, sources=["debug"])

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
