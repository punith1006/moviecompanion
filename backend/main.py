"""
Movie & Series Companion Agent - FastAPI Application
Main entry point with API endpoints and static file serving
"""

import logging
import uuid
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel

from .config import settings
from .database.mongodb_client import connect_to_mongodb, close_mongodb_connection
from .database.models import ChatRequest, ChatResponse
from .agent import create_agent

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Store active agents per user session
agents: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("Starting Movie & Series Companion Agent...")
    await connect_to_mongodb()
    logger.info("Application started successfully!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await close_mongodb_connection()
    agents.clear()
    logger.info("Shutdown complete.")


# Create FastAPI app
app = FastAPI(
    title="Movie & Series Companion Agent",
    description="A personalized AI companion for discovering, tracking, and enjoying movies & TV shows",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== API Models =====

class ChatMessage(BaseModel):
    """Chat message request"""
    message: str
    user_id: Optional[str] = "default_user"
    session_id: Optional[str] = None


class ChatMessageResponse(BaseModel):
    """Chat message response"""
    response: str
    session_id: str
    user_id: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str


# ===== API Endpoints =====

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return HealthResponse(status="healthy", version="1.0.0")


@app.post("/api/chat", response_model=ChatMessageResponse, tags=["Chat"])
async def chat(request: ChatMessage):
    """
    Send a message to the companion agent and get a response
    
    The agent can:
    - Track your watch history
    - Recommend new shows (never repeating watched content)
    - Provide recaps of where you left off
    - Run interactive quizzes
    """
    try:
        user_id = request.user_id or "default_user"
        session_id = request.session_id or str(uuid.uuid4())
        
        # Get or create agent for this user
        if user_id not in agents:
            agents[user_id] = create_agent(user_id)
        
        agent = agents[user_id]
        
        # Get response from agent
        response = await agent.chat(request.message, session_id)
        
        return ChatMessageResponse(
            response=response,
            session_id=session_id,
            user_id=user_id
        )
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history/{user_id}", tags=["History"])
async def get_history(user_id: str, status: Optional[str] = None):
    """Get user's watch history"""
    from .database.repositories.user_repo import user_repository
    
    try:
        user = await user_repository.get_user(user_id)
        if not user:
            return {"history": [], "total": 0}
        
        shows = user.watched_shows
        if status:
            shows = [s for s in shows if s.status == status]
        
        return {
            "history": [s.model_dump() for s in shows],
            "total": len(shows)
        }
        
    except Exception as e:
        logger.error(f"History error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/recommendations/{user_id}", tags=["Recommendations"])
async def get_recommendations(
    user_id: str,
    genre: Optional[str] = None,
    mood: Optional[str] = None,
    content_type: Optional[str] = None,
    count: int = 5
):
    """Get personalized recommendations"""
    from .services.recommendation_engine import recommendation_engine
    
    try:
        recommendations = await recommendation_engine.get_recommendations(
            user_id=user_id,
            genre=genre,
            mood=mood,
            content_type=content_type,
            count=count
        )
        
        return {"recommendations": recommendations}
        
    except Exception as e:
        logger.error(f"Recommendations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/history/{user_id}/add", tags=["History"])
async def add_to_history(user_id: str, show: dict):
    """Add a show to watch history"""
    from .database.repositories.user_repo import user_repository
    from .database.models import WatchedShow
    
    try:
        await user_repository.get_or_create_user(user_id)
        watched_show = WatchedShow(**show)
        await user_repository.add_watched_show(user_id, watched_show)
        
        return {"status": "success", "message": f"Added '{show.get('title')}' to history"}
        
    except Exception as e:
        logger.error(f"Add history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== Static File Serving =====

# Get the frontend directory path
frontend_dir = Path(__file__).parent.parent / "frontend"


@app.get("/", response_class=HTMLResponse, tags=["Frontend"])
async def serve_frontend():
    """Serve the main frontend page"""
    index_path = frontend_dir / "index.html"
    if index_path.exists():
        return FileResponse(index_path, media_type="text/html")
    else:
        return HTMLResponse(
            content="<h1>Frontend not found</h1><p>Run from the project root or check frontend directory.</p>",
            status_code=404
        )


# Mount static files if frontend directory exists
if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")


# ===== Error Handlers =====

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return {"error": str(exc), "status": "error"}


# ===== Run Configuration =====

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.app_env == "development"
    )
