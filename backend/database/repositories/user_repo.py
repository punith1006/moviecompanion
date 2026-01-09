"""
User Repository - Database Operations for User Data
"""

from typing import Optional, List
from datetime import datetime
import logging

from ..mongodb_client import get_database
from ..models import User, WatchedShow, RejectedSuggestion, Preferences

logger = logging.getLogger(__name__)


class UserRepository:
    """Repository for user-related database operations"""
    
    def __init__(self):
        self.collection_name = "users"
    
    @property
    def collection(self):
        return get_database()[self.collection_name]
    
    async def get_or_create_user(self, user_id: str) -> User:
        """Get existing user or create new one"""
        user_doc = await self.collection.find_one({"user_id": user_id})
        
        if user_doc:
            return User(**user_doc)
        
        # Create new user
        new_user = User(user_id=user_id)
        result = await self.collection.insert_one(new_user.model_dump(by_alias=True, exclude={"id"}))
        new_user.id = str(result.inserted_id)
        
        logger.info(f"Created new user: {user_id}")
        return new_user
    
    async def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        user_doc = await self.collection.find_one({"user_id": user_id})
        return User(**user_doc) if user_doc else None
    
    async def add_watched_show(self, user_id: str, show: WatchedShow) -> bool:
        """Add a show to user's watch history"""
        result = await self.collection.update_one(
            {"user_id": user_id},
            {
                "$push": {"watched_shows": show.model_dump()},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        if result.modified_count > 0:
            logger.info(f"Added show '{show.title}' to user {user_id}'s history")
            return True
        return False
    
    async def update_watched_show(self, user_id: str, title: str, updates: dict) -> bool:
        """Update a show in user's watch history"""
        result = await self.collection.update_one(
            {"user_id": user_id, "watched_shows.title": title},
            {"$set": {f"watched_shows.$.{k}": v for k, v in updates.items()}}
        )
        return result.modified_count > 0
    
    async def get_watched_titles(self, user_id: str) -> List[str]:
        """Get list of watched show titles for filtering"""
        user = await self.get_user(user_id)
        if not user:
            return []
        return [show.title.lower() for show in user.watched_shows]
    
    async def get_rejected_titles(self, user_id: str) -> List[str]:
        """Get list of rejected suggestion titles"""
        user = await self.get_user(user_id)
        if not user:
            return []
        return [r.title.lower() for r in user.rejected_suggestions]
    
    async def add_rejected_suggestion(self, user_id: str, title: str, reason: Optional[str] = None) -> bool:
        """Add a rejected suggestion"""
        rejection = RejectedSuggestion(title=title, reason=reason)
        result = await self.collection.update_one(
            {"user_id": user_id},
            {"$push": {"rejected_suggestions": rejection.model_dump()}}
        )
        return result.modified_count > 0
    
    async def update_preferences(self, user_id: str, preferences: dict) -> bool:
        """Update user preferences"""
        result = await self.collection.update_one(
            {"user_id": user_id},
            {"$set": {"preferences": preferences}}
        )
        return result.modified_count > 0
    
    async def add_liked_genre(self, user_id: str, genre: str) -> bool:
        """Add a liked genre"""
        result = await self.collection.update_one(
            {"user_id": user_id},
            {"$addToSet": {"preferences.liked_genres": genre}}
        )
        return result.modified_count > 0
    
    async def get_user_preferences(self, user_id: str) -> Optional[Preferences]:
        """Get user preferences"""
        user = await self.get_user(user_id)
        return user.preferences if user else None
    
    async def update_quiz_stats(self, user_id: str, correct: bool) -> bool:
        """Update quiz statistics"""
        update_ops = {
            "$inc": {"quiz_stats.total_questions": 1}
        }
        if correct:
            update_ops["$inc"]["quiz_stats.correct_answers"] = 1
        
        result = await self.collection.update_one(
            {"user_id": user_id},
            update_ops
        )
        return result.modified_count > 0
    
    async def get_shows_by_status(self, user_id: str, status: str) -> List[WatchedShow]:
        """Get shows by status (e.g., 'ongoing', 'completed')"""
        user = await self.get_user(user_id)
        if not user:
            return []
        return [show for show in user.watched_shows if show.status == status]
    
    async def find_show_in_history(self, user_id: str, title: str) -> Optional[WatchedShow]:
        """Find a specific show in user's history by title"""
        user = await self.get_user(user_id)
        if not user:
            return None
        
        title_lower = title.lower()
        for show in user.watched_shows:
            if show.title.lower() == title_lower or title_lower in show.title.lower():
                return show
        return None


# Singleton instance
user_repository = UserRepository()
