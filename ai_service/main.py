"""
ReelMind AI Service - FastAPI Server
Entry point for the Python AI service
"""
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

from config import settings
from agent import chat_with_agent
from tools import generate_quiz_questions, calculate_quiz_results, generate_recap
from agent.semantic_search import get_semantic_recommendations_impl


# FastAPI app
app = FastAPI(
    title="ReelMind AI Service",
    description="AI-powered entertainment companion backend",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Request/Response Models
# ============================================

class ChatRequest(BaseModel):
    message: str
    userId: str
    conversationId: str
    context: Optional[Dict[str, Any]] = None
    conversationHistory: Optional[List[Dict[str, str]]] = None


class ChatResponse(BaseModel):
    response: str
    type: str
    toolsUsed: List[str] = []
    metadata: Dict[str, Any] = {}


class QuizRequest(BaseModel):
    showTitle: str
    showId: int
    numQuestions: int = 5
    difficulty: str = "medium"
    userProgress: Optional[Dict[str, Any]] = None
    savedQuotes: Optional[List[Dict[str, str]]] = None


class QuizAnswerRequest(BaseModel):
    questions: List[Dict[str, Any]]
    userAnswers: List[int]
    difficulty: str = "medium"


class RecapRequest(BaseModel):
    showTitle: str
    tmdbId: int
    currentSeason: int
    currentEpisode: int
    contentType: str = "series"


class RecommendRequest(BaseModel):
    description: str
    userId: Optional[str] = None


# ============================================
# API Endpoints
# ============================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "ReelMind AI Service",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "openai_configured": bool(settings.openai_api_key),
        "tavily_configured": bool(settings.tavily_api_key),
        "tmdb_configured": bool(settings.tmdb_api_key),
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint - sends messages to the ReelMind agent.
    Called by the Node.js backend.
    """
    try:
        result = await chat_with_agent(
            message=request.message,
            user_id=request.userId,
            conversation_id=request.conversationId,
            user_context=request.context,
            conversation_history=request.conversationHistory,
        )
        
        return ChatResponse(
            response=result.get("response", ""),
            type=result.get("type", "text"),
            toolsUsed=result.get("toolsUsed", []),
            metadata=result.get("metadata", {}),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/quiz/generate")
async def generate_quiz(request: QuizRequest):
    """Generate quiz questions for a show."""
    try:
        result = await generate_quiz_questions(
            show_title=request.showTitle,
            show_id=request.showId,
            num_questions=request.numQuestions,
            difficulty=request.difficulty,
            user_progress=request.userProgress,
            saved_quotes=request.savedQuotes,
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to generate quiz"))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/quiz/score")
async def score_quiz(request: QuizAnswerRequest):
    """Calculate quiz score and XP earned."""
    try:
        result = await calculate_quiz_results(
            questions=request.questions,
            user_answers=request.userAnswers,
            difficulty=request.difficulty,
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recap")
async def get_recap(request: RecapRequest):
    """Generate a spoiler-free recap for a show."""
    try:
        result = await generate_recap(
            show_title=request.showTitle,
            tmdb_id=request.tmdbId,
            current_season=request.currentSeason,
            current_episode=request.currentEpisode,
            content_type=request.contentType,
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to generate recap"))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
@app.post("/recommend")
async def recommend(request: RecommendRequest):
    """Get semantic recommendations from abstract description."""
    return await get_semantic_recommendations_impl(request.description)


# ============================================
# Direct Tool Endpoints (for testing/debugging)
# ============================================

@app.get("/tmdb/search")
async def search_tmdb(query: str):
    """Search TMDB for movies/shows."""
    from tools.entertainment_tools import search_show
    return await search_show(query)


@app.get("/tmdb/details/{tmdb_id}")
async def get_tmdb_details(tmdb_id: int, content_type: str = "series"):
    """Get details for a movie/show."""
    from tools.entertainment_tools import get_show_details
    return await get_show_details(tmdb_id, content_type)


@app.get("/web/search")
async def search_web(query: str, search_type: str = "general"):
    """Search the web for entertainment info."""
    from tools.entertainment_tools import web_search
    return await web_search(query, search_type)


# ============================================
# Server Entry Point
# ============================================

if __name__ == "__main__":
    print(f"""
🎬 ReelMind AI Service
━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Environment: {settings.environment}
🚀 Server:      http://{settings.host}:{settings.port}
📚 Docs:        http://{settings.host}:{settings.port}/docs
━━━━━━━━━━━━━━━━━━━━━━━━━━
    """)
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
    )
