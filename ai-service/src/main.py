from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="AI-powered movie and TV show recommendation service for CinePal",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": "1.0.0",
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "docs": "/docs",
    }


# Import and include routers
from src.api import chat, recommendations, recaps, quiz

app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(recommendations.router, prefix="/api", tags=["Recommendations"])
app.include_router(recaps.router, prefix="/api", tags=["Recaps"])
app.include_router(quiz.router, prefix="/api", tags=["Quiz"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
