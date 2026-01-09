"""
Recommendation Engine - Smart Content Recommendations
Filters out watched/rejected shows and ranks by user preferences
"""

from typing import Optional, List, Dict, Any
import logging
import random

from .tmdb_service import tmdb_service, TV_GENRE_MAP, MOVIE_GENRE_MAP
from ..database.repositories.user_repo import user_repository

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """Engine for generating personalized, non-repetitive recommendations"""
    
    async def get_recommendations(
        self,
        user_id: str,
        genre: Optional[str] = None,
        mood: Optional[str] = None,
        content_type: Optional[str] = None,  # "movie", "series", or None for both
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get personalized recommendations filtered by user history
        
        Args:
            user_id: User identifier
            genre: Preferred genre (e.g., "comedy", "thriller")
            mood: Mood-based preference (e.g., "light", "intense", "thought-provoking")
            content_type: Filter by type ("movie" or "series")
            count: Number of recommendations to return
            
        Returns:
            List of recommended shows/movies
        """
        
        # Get user's watched and rejected titles for filtering
        watched_titles = await user_repository.get_watched_titles(user_id)
        rejected_titles = await user_repository.get_rejected_titles(user_id)
        excluded_titles = set(watched_titles + rejected_titles)
        
        # Get user preferences for ranking
        user = await user_repository.get_user(user_id)
        preferences = user.preferences if user else None
        
        # Map mood to genre if provided
        if mood and not genre:
            genre = self._mood_to_genre(mood)
        
        # Get genre IDs for API queries
        genre_ids = self._get_genre_ids(genre, content_type)
        
        # Fetch candidates from TMDB
        candidates = []
        
        if content_type in [None, "series"]:
            tv_results = await tmdb_service.discover_tv(
                genres=genre_ids.get("tv"),
                min_rating=6.5,
                page=random.randint(1, 3)  # Add variety
            )
            candidates.extend(tv_results)
        
        if content_type in [None, "movie"]:
            movie_results = await tmdb_service.discover_movies(
                genres=genre_ids.get("movie"),
                min_rating=6.5,
                page=random.randint(1, 3)
            )
            candidates.extend(movie_results)
        
        # Filter out watched/rejected shows
        filtered = [
            item for item in candidates
            if item.get("title", "").lower() not in excluded_titles
        ]
        
        # Rank by preferences and variety
        ranked = self._rank_by_preferences(filtered, preferences)
        
        # Return top N results
        return ranked[:count]
    
    async def get_similar_recommendations(
        self,
        user_id: str,
        show_title: str,
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """Get recommendations similar to a specific show"""
        
        # Find the show in TMDB
        show_info = await tmdb_service.find_by_title(show_title)
        if not show_info:
            logger.warning(f"Could not find show: {show_title}")
            return await self.get_recommendations(user_id, count=count)
        
        show_id = int(show_info.get("id"))
        show_type = show_info.get("type", "series")
        
        # Get similar shows from TMDB
        if show_type == "series":
            similar = await tmdb_service.get_similar_tv(show_id)
        else:
            similar = await tmdb_service.get_similar_tv(show_id)  # TMDB has similar for movies too
        
        # Filter out watched/rejected
        watched = await user_repository.get_watched_titles(user_id)
        rejected = await user_repository.get_rejected_titles(user_id)
        excluded = set(watched + rejected)
        
        filtered = [
            item for item in similar
            if item.get("title", "").lower() not in excluded
        ]
        
        return filtered[:count]
    
    async def get_genre_based_recommendations(
        self,
        user_id: str,
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """Get recommendations based on user's liked genres"""
        
        user = await user_repository.get_user(user_id)
        if not user or not user.preferences.liked_genres:
            # Fallback to popular content
            return await self.get_recommendations(user_id, count=count)
        
        # Pick a random liked genre
        genre = random.choice(user.preferences.liked_genres)
        
        return await self.get_recommendations(
            user_id=user_id,
            genre=genre,
            count=count
        )
    
    def _mood_to_genre(self, mood: str) -> Optional[str]:
        """Map mood descriptions to genres"""
        mood_map = {
            # Light/Fun moods
            "light": "comedy",
            "fun": "comedy",
            "funny": "comedy",
            "happy": "comedy",
            "uplifting": "comedy",
            "feel-good": "comedy",
            "cozy": "comedy",
            "relaxing": "comedy",
            
            # Intense/Dark moods
            "intense": "thriller",
            "dark": "thriller",
            "suspenseful": "thriller",
            "edge-of-seat": "thriller",
            "tense": "thriller",
            "gripping": "thriller",
            
            # Dramatic moods
            "emotional": "drama",
            "moving": "drama",
            "thought-provoking": "drama",
            "deep": "drama",
            "serious": "drama",
            
            # Action moods
            "exciting": "action",
            "thrilling": "action",
            "adventurous": "adventure",
            "epic": "action",
            
            # Romance moods
            "romantic": "romance",
            "love": "romance",
            "sweet": "romance",
            
            # Scary moods
            "scary": "horror",
            "spooky": "horror",
            "creepy": "horror",
            
            # Fantasy/Sci-Fi moods
            "imaginative": "fantasy",
            "magical": "fantasy",
            "futuristic": "sci-fi"
        }
        
        mood_lower = mood.lower()
        return mood_map.get(mood_lower)
    
    def _get_genre_ids(self, genre: Optional[str], content_type: Optional[str]) -> Dict[str, List[int]]:
        """Get TMDB genre IDs for content types"""
        result = {"tv": [], "movie": []}
        
        if not genre:
            return result
        
        genre_lower = genre.lower()
        
        if content_type in [None, "series"]:
            if genre_lower in TV_GENRE_MAP:
                result["tv"].append(TV_GENRE_MAP[genre_lower])
        
        if content_type in [None, "movie"]:
            if genre_lower in MOVIE_GENRE_MAP:
                result["movie"].append(MOVIE_GENRE_MAP[genre_lower])
        
        return result
    
    def _rank_by_preferences(
        self,
        candidates: List[Dict[str, Any]],
        preferences: Optional[Any]
    ) -> List[Dict[str, Any]]:
        """Rank candidates by user preferences and diversity"""
        
        if not candidates:
            return []
        
        # Calculate scores for each candidate
        scored = []
        for item in candidates:
            score = 0
            
            # Base score from rating
            rating = item.get("rating", 0) or 0
            score += rating * 10
            
            # Popularity bonus (but not too much - we want variety)
            popularity = item.get("popularity", 0) or 0
            score += min(popularity / 10, 20)
            
            # Preference matching
            if preferences:
                # Boost for liked genres (would need to resolve genre IDs to names)
                genre_ids = item.get("genre_ids", [])
                for liked in preferences.liked_genres:
                    genre_id = TV_GENRE_MAP.get(liked.lower()) or MOVIE_GENRE_MAP.get(liked.lower())
                    if genre_id in genre_ids:
                        score += 15
                
                # Penalty for disliked genres
                for disliked in preferences.disliked_genres:
                    genre_id = TV_GENRE_MAP.get(disliked.lower()) or MOVIE_GENRE_MAP.get(disliked.lower())
                    if genre_id in genre_ids:
                        score -= 20
            
            # Small random factor for variety
            score += random.uniform(0, 10)
            
            scored.append((score, item))
        
        # Sort by score descending
        scored.sort(key=lambda x: x[0], reverse=True)
        
        return [item for _, item in scored]
    
    def format_recommendation_response(self, recommendations: List[Dict[str, Any]]) -> str:
        """Format recommendations as a conversational response"""
        if not recommendations:
            return "I couldn't find any new recommendations right now. Try asking for a specific genre!"
        
        response_parts = ["Here are some recommendations for you:\n"]
        
        for i, rec in enumerate(recommendations, 1):
            title = rec.get("title", "Unknown")
            year = rec.get("year", "")
            rating = rec.get("rating", 0)
            overview = rec.get("overview", "")
            rec_type = rec.get("type", "series")
            
            # Truncate overview
            if overview and len(overview) > 150:
                overview = overview[:147] + "..."
            
            type_indicator = "📺" if rec_type == "series" else "🎬"
            rating_str = f"⭐ {rating:.1f}" if rating else ""
            year_str = f"({year})" if year else ""
            
            response_parts.append(
                f"{i}. {type_indicator} **{title}** {year_str} {rating_str}\n"
                f"   {overview}\n"
            )
        
        response_parts.append("\nWant more details about any of these? Just ask!")
        
        return "\n".join(response_parts)


# Singleton instance
recommendation_engine = RecommendationEngine()
