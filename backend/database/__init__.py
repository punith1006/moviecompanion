"""
Database Package - MongoDB Integration
"""
from .mongodb_client import get_database, get_client
from .models import User, WatchedShow, Preferences, QuizStats, ConversationSession

__all__ = [
    "get_database",
    "get_client", 
    "User",
    "WatchedShow",
    "Preferences",
    "QuizStats",
    "ConversationSession"
]
