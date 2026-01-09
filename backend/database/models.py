"""
Pydantic Models for MongoDB Documents
Defines the data structures for users, watch history, and sessions
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from bson import ObjectId


class PyObjectId(str):
    """Custom type for MongoDB ObjectId"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str):
            return v
        raise TypeError("ObjectId required")


class LastWatched(BaseModel):
    """Tracks the last watched episode for series"""
    season: int = 1
    episode: int = 1
    date: datetime = Field(default_factory=datetime.utcnow)


class WatchedShow(BaseModel):
    """Individual show/movie in user's watch history"""
    show_id: Optional[str] = None  # TMDB ID
    title: str
    type: Literal["movie", "series"] = "series"
    status: Literal["completed", "ongoing", "dropped", "watchlist"] = "ongoing"
    last_watched: Optional[LastWatched] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    genres: List[str] = Field(default_factory=list)
    added_date: datetime = Field(default_factory=datetime.utcnow)
    poster_url: Optional[str] = None
    year: Optional[int] = None


class ContentPreferences(BaseModel):
    """User content preferences"""
    max_runtime: Optional[int] = None  # minutes
    subtitle_tolerance: bool = True
    language_preferences: List[str] = Field(default_factory=lambda: ["en"])
    avoid_keywords: List[str] = Field(default_factory=list)


class Preferences(BaseModel):
    """User preferences for recommendations"""
    liked_genres: List[str] = Field(default_factory=list)
    disliked_genres: List[str] = Field(default_factory=list)
    favorite_actors: List[str] = Field(default_factory=list)
    content_preferences: ContentPreferences = Field(default_factory=ContentPreferences)


class RejectedSuggestion(BaseModel):
    """Track rejected recommendations"""
    title: str
    show_id: Optional[str] = None
    reason: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)


class QuizStats(BaseModel):
    """User quiz statistics"""
    total_questions: int = 0
    correct_answers: int = 0
    favorite_quiz_type: Optional[str] = None


class User(BaseModel):
    """Complete user profile document"""
    id: Optional[PyObjectId] = Field(None, alias="_id")
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    watched_shows: List[WatchedShow] = Field(default_factory=list)
    preferences: Preferences = Field(default_factory=Preferences)
    rejected_suggestions: List[RejectedSuggestion] = Field(default_factory=list)
    quiz_stats: QuizStats = Field(default_factory=QuizStats)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}


class Message(BaseModel):
    """Single message in a conversation"""
    role: Literal["user", "agent"] = "user"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict = Field(default_factory=dict)


class ConversationContext(BaseModel):
    """Current conversation context"""
    current_topic: Optional[str] = None  # "recommendation", "recap", "quiz", "history"
    mentioned_shows: List[str] = Field(default_factory=list)
    active_quiz: Optional[dict] = None
    last_recommendations: List[str] = Field(default_factory=list)


class ConversationSession(BaseModel):
    """Conversation session for multi-turn context"""
    id: Optional[PyObjectId] = Field(None, alias="_id")
    user_id: str
    session_id: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    messages: List[Message] = Field(default_factory=list)
    context: ConversationContext = Field(default_factory=ConversationContext)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}


# Request/Response Models for API
class ChatRequest(BaseModel):
    """Chat request from frontend"""
    message: str
    user_id: str = "default_user"
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat response to frontend"""
    response: str
    session_id: str
    context: Optional[dict] = None
    recommendations: Optional[List[dict]] = None
    quiz_data: Optional[dict] = None


class ShowInfo(BaseModel):
    """Show information for recommendations"""
    id: str
    title: str
    type: str = "series"
    year: Optional[int] = None
    rating: Optional[float] = None
    genres: List[str] = Field(default_factory=list)
    overview: Optional[str] = None
    poster_url: Optional[str] = None
