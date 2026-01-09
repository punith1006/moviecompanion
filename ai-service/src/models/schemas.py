from pydantic import BaseModel
from typing import Optional, List


class WatchHistoryItem(BaseModel):
    """Watch history item from user context."""
    contentId: str
    contentType: str  # 'movie' or 'tv'
    title: str
    status: str  # 'watched', 'watching', 'dropped', 'not_interested'
    rating: Optional[int] = None


class UserPreferences(BaseModel):
    """User preferences for recommendations."""
    favoriteGenres: List[str] = []
    streamingServices: List[str] = []
    contentRatings: List[str] = []


class ChatRequest(BaseModel):
    """Chat request from the backend."""
    message: str
    history: List[WatchHistoryItem] = []
    preferences: UserPreferences = UserPreferences()


class ContentItem(BaseModel):
    """Recommended content item."""
    id: int
    title: str
    posterPath: Optional[str] = None
    overview: Optional[str] = None
    releaseDate: Optional[str] = None
    voteAverage: Optional[float] = None
    contentType: str  # 'movie' or 'tv'
    reason: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat response with AI message and recommendations."""
    response: str
    recommendations: List[ContentItem] = []


class RecapRequest(BaseModel):
    """Recap request for a TV show."""
    showId: str
    currentSeason: int
    currentEpisode: int


class RecapResponse(BaseModel):
    """Recap response with TL;DR and full recap."""
    tldr: str
    fullRecap: str
    showTitle: str


class QuizQuestion(BaseModel):
    """Quiz question with options."""
    question: str
    options: List[str]
    correctIndex: int
    funFact: str


class QuizRequest(BaseModel):
    """Quiz request for a content item."""
    contentId: str
    contentType: str  # 'movie' or 'tv'


class QuizResponse(BaseModel):
    """Quiz response with questions."""
    title: str
    questions: List[QuizQuestion]
