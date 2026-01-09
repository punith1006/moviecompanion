"""
Companion Agent - Google ADK Agent with LiteLLM Integration
Main agent definition with all tools for the Movie & Series Companion
"""

import json
import uuid
import random
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

from google.adk.agents import LlmAgent
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.genai import types

from ..config import settings
from ..database.repositories.user_repo import user_repository
from ..database.models import WatchedShow, LastWatched
from ..services.tmdb_service import tmdb_service
from ..services.recommendation_engine import recommendation_engine
from .prompts import SYSTEM_INSTRUCTION

logger = logging.getLogger(__name__)

# ===== Tool Functions =====

async def add_to_history(
    title: str,
    content_type: str = "series",
    status: str = "ongoing",
    rating: Optional[int] = None,
    season: Optional[int] = None,
    episode: Optional[int] = None,
    user_id: str = "default_user"
) -> Dict[str, Any]:
    """
    Add a movie or TV show to the user's watch history.
    
    Args:
        title: Name of the movie or TV show
        content_type: Either "movie" or "series"
        status: Watch status - "completed", "ongoing", "dropped", or "watchlist"
        rating: User's rating from 1-5 (optional)
        season: Current season number for series (optional)
        episode: Current episode number for series (optional)
        user_id: User identifier
        
    Returns:
        Confirmation of the addition with show details
    """
    try:
        # Ensure user exists
        await user_repository.get_or_create_user(user_id)
        
        # Search for show info from TMDB
        show_info = await tmdb_service.find_by_title(title)
        
        # Create watch entry
        last_watched = None
        if content_type == "series" and (season or episode):
            last_watched = LastWatched(
                season=season or 1,
                episode=episode or 1
            )
        
        watched_show = WatchedShow(
            show_id=show_info.get("id") if show_info else None,
            title=title,
            type=content_type,
            status=status,
            rating=rating,
            last_watched=last_watched,
            poster_url=show_info.get("poster_url") if show_info else None,
            year=show_info.get("year") if show_info else None,
            genres=[]  # Could be populated from TMDB
        )
        
        # Add to database
        await user_repository.add_watched_show(user_id, watched_show)
        
        # Infer and add liked genres
        if show_info and rating and rating >= 4:
            # If user rated highly, they probably like the genres
            for genre_id in show_info.get("genre_ids", []):
                pass  # Could add to liked genres
        
        return {
            "status": "success",
            "message": f"Added '{title}' to your watch history",
            "details": {
                "title": title,
                "type": content_type,
                "status": status,
                "rating": rating,
                "year": show_info.get("year") if show_info else None
            }
        }
        
    except Exception as e:
        logger.error(f"Error adding to history: {e}")
        return {"status": "error", "message": str(e)}


async def get_watch_history(
    user_id: str = "default_user",
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get the user's watch history.
    
    Args:
        user_id: User identifier
        status_filter: Optional filter by status (completed, ongoing, dropped, watchlist)
        
    Returns:
        List of watched shows with details
    """
    try:
        user = await user_repository.get_user(user_id)
        if not user:
            return {"status": "success", "history": [], "message": "No watch history yet!"}
        
        shows = user.watched_shows
        
        if status_filter:
            shows = [s for s in shows if s.status == status_filter]
        
        history = []
        for show in shows:
            entry = {
                "title": show.title,
                "type": show.type,
                "status": show.status,
                "rating": show.rating,
                "added": show.added_date.isoformat() if show.added_date else None
            }
            if show.last_watched:
                entry["progress"] = f"S{show.last_watched.season}E{show.last_watched.episode}"
            history.append(entry)
        
        return {
            "status": "success",
            "history": history,
            "total": len(history)
        }
        
    except Exception as e:
        logger.error(f"Error getting history: {e}")
        return {"status": "error", "message": str(e)}


async def get_recommendations(
    user_id: str = "default_user",
    genre: Optional[str] = None,
    mood: Optional[str] = None,
    content_type: Optional[str] = None,
    count: int = 5
) -> Dict[str, Any]:
    """
    Get personalized recommendations filtered by watch history.
    
    Args:
        user_id: User identifier
        genre: Preferred genre (e.g., "comedy", "thriller", "sci-fi")
        mood: Mood-based preference (e.g., "light", "intense", "feel-good")
        content_type: Filter by "movie" or "series"
        count: Number of recommendations to return
        
    Returns:
        List of recommended shows/movies that the user hasn't seen
    """
    try:
        recommendations = await recommendation_engine.get_recommendations(
            user_id=user_id,
            genre=genre,
            mood=mood,
            content_type=content_type,
            count=count
        )
        
        formatted = []
        for rec in recommendations:
            formatted.append({
                "title": rec.get("title"),
                "type": rec.get("type"),
                "year": rec.get("year"),
                "rating": round(rec.get("rating", 0), 1) if rec.get("rating") else None,
                "overview": rec.get("overview"),
                "poster_url": rec.get("poster_url")
            })
        
        return {
            "status": "success",
            "recommendations": formatted,
            "filters_applied": {
                "genre": genre,
                "mood": mood,
                "type": content_type
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        return {"status": "error", "message": str(e)}


async def mark_rejected(
    title: str,
    reason: Optional[str] = None,
    user_id: str = "default_user"
) -> Dict[str, Any]:
    """
    Mark a suggestion as rejected so it won't be recommended again.
    
    Args:
        title: Name of the show/movie to reject
        reason: Optional reason (e.g., "not interested", "already watched elsewhere")
        user_id: User identifier
        
    Returns:
        Confirmation of the rejection
    """
    try:
        await user_repository.add_rejected_suggestion(user_id, title, reason)
        
        return {
            "status": "success",
            "message": f"Got it! I won't suggest '{title}' again.",
            "title": title
        }
        
    except Exception as e:
        logger.error(f"Error marking rejection: {e}")
        return {"status": "error", "message": str(e)}


async def get_recap(
    title: str,
    user_id: str = "default_user"
) -> Dict[str, Any]:
    """
    Get a recap of where the user left off in a series.
    
    Args:
        title: Name of the TV series
        user_id: User identifier
        
    Returns:
        Recap information including last watched episode and summary
    """
    try:
        # Find show in user's history
        show = await user_repository.find_show_in_history(user_id, title)
        
        if not show:
            return {
                "status": "not_found",
                "message": f"I don't have '{title}' in your watch history. Did you want to add it?"
            }
        
        if show.type == "movie":
            return {
                "status": "success",
                "message": f"**{show.title}** is a movie you've watched. Want me to find similar movies?",
                "is_movie": True
            }
        
        # Get episode details from TMDB if we have the ID
        episode_info = None
        if show.show_id and show.last_watched:
            episode_info = await tmdb_service.get_episode_details(
                int(show.show_id),
                show.last_watched.season,
                show.last_watched.episode
            )
        
        recap_data = {
            "title": show.title,
            "last_watched": {
                "season": show.last_watched.season if show.last_watched else 1,
                "episode": show.last_watched.episode if show.last_watched else 1
            },
            "status": show.status,
            "episode_info": episode_info
        }
        
        return {
            "status": "success",
            "recap": recap_data,
            "message": f"Last watched: S{recap_data['last_watched']['season']}E{recap_data['last_watched']['episode']}"
        }
        
    except Exception as e:
        logger.error(f"Error getting recap: {e}")
        return {"status": "error", "message": str(e)}


async def search_show(
    query: str,
    content_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search for a movie or TV show to get information about it.
    
    Args:
        query: Search term (show/movie title)
        content_type: Optional filter by "movie" or "series"
        
    Returns:
        Search results with show/movie details
    """
    try:
        if content_type == "movie":
            results = await tmdb_service.search_movie(query)
        elif content_type == "series":
            results = await tmdb_service.search_tv(query)
        else:
            results = await tmdb_service.search_multi(query)
        
        formatted = []
        for item in results[:5]:  # Top 5 results
            formatted.append({
                "title": item.get("title"),
                "type": item.get("type"),
                "year": item.get("year"),
                "rating": round(item.get("rating", 0), 1) if item.get("rating") else None,
                "overview": item.get("overview")
            })
        
        return {
            "status": "success",
            "results": formatted,
            "count": len(formatted)
        }
        
    except Exception as e:
        logger.error(f"Error searching: {e}")
        return {"status": "error", "message": str(e)}


# Sample quiz data (in production, would be generated from user's history + LLM)
SAMPLE_QUIZ_QUESTIONS = [
    {
        "question": "Who said: 'I am the one who knocks'?",
        "answer": "Walter White",
        "show": "Breaking Bad",
        "hint": "The main character from a show about a chemistry teacher",
        "type": "quote"
    },
    {
        "question": "In which show does a group of kids encounter a girl with psychic powers named Eleven?",
        "answer": "Stranger Things",
        "show": "Stranger Things",
        "hint": "Set in the 1980s in Hawkins, Indiana",
        "type": "plot"
    },
    {
        "question": "Which office comedy features the quote 'That's what she said'?",
        "answer": "The Office",
        "show": "The Office",
        "hint": "Takes place at Dunder Mifflin Paper Company",
        "type": "quote"
    },
    {
        "question": "In Game of Thrones, which house's motto is 'Winter is Coming'?",
        "answer": "House Stark",
        "show": "Game of Thrones",
        "hint": "They rule from Winterfell in the North",
        "type": "trivia"
    }
]


async def start_quiz(
    user_id: str = "default_user"
) -> Dict[str, Any]:
    """
    Start an interactive quiz based on the user's watch history.
    
    Args:
        user_id: User identifier
        
    Returns:
        A quiz question about one of their watched shows
    """
    try:
        # Get user's watched shows
        user = await user_repository.get_user(user_id)
        watched_titles = []
        if user:
            watched_titles = [s.title.lower() for s in user.watched_shows]
        
        # Filter questions to shows they've watched, or use any if none match
        relevant_questions = [
            q for q in SAMPLE_QUIZ_QUESTIONS
            if q["show"].lower() in watched_titles
        ]
        
        if not relevant_questions:
            relevant_questions = SAMPLE_QUIZ_QUESTIONS
        
        # Pick a random question
        question = random.choice(relevant_questions)
        
        # Generate a unique quiz ID
        quiz_id = str(uuid.uuid4())[:8]
        
        return {
            "status": "success",
            "quiz_id": quiz_id,
            "question": question["question"],
            "show": question["show"],
            "type": question["type"],
            "hint": question["hint"],
            "_answer": question["answer"]  # For validation
        }
        
    except Exception as e:
        logger.error(f"Error starting quiz: {e}")
        return {"status": "error", "message": str(e)}


async def answer_quiz(
    answer: str,
    correct_answer: str,
    user_id: str = "default_user"
) -> Dict[str, Any]:
    """
    Check a quiz answer and update statistics.
    
    Args:
        answer: The user's answer
        correct_answer: The correct answer to check against
        user_id: User identifier
        
    Returns:
        Whether the answer was correct and updated stats
    """
    try:
        is_correct = answer.lower().strip() in correct_answer.lower()
        
        await user_repository.update_quiz_stats(user_id, is_correct)
        
        user = await user_repository.get_user(user_id)
        stats = user.quiz_stats if user else None
        
        return {
            "status": "success",
            "correct": is_correct,
            "correct_answer": correct_answer,
            "message": "🎉 Correct!" if is_correct else f"Not quite! The answer was: {correct_answer}",
            "stats": {
                "total": stats.total_questions if stats else 0,
                "correct": stats.correct_answers if stats else 0
            } if stats else None
        }
        
    except Exception as e:
        logger.error(f"Error checking answer: {e}")
        return {"status": "error", "message": str(e)}


async def update_watch_progress(
    title: str,
    season: int,
    episode: int,
    user_id: str = "default_user"
) -> Dict[str, Any]:
    """
    Update the watched progress for a series.
    
    Args:
        title: Name of the TV series
        season: Current season number
        episode: Current episode number
        user_id: User identifier
        
    Returns:
        Confirmation of the update
    """
    try:
        updates = {
            "last_watched": LastWatched(season=season, episode=episode).model_dump(),
            "status": "ongoing"
        }
        
        success = await user_repository.update_watched_show(user_id, title, updates)
        
        if success:
            return {
                "status": "success",
                "message": f"Updated progress for '{title}' to S{season}E{episode}"
            }
        else:
            return {
                "status": "not_found",
                "message": f"Couldn't find '{title}' in your history. Want me to add it?"
            }
        
    except Exception as e:
        logger.error(f"Error updating progress: {e}")
        return {"status": "error", "message": str(e)}


class CompanionAgent:
    """Wrapper class for the Movie & Series Companion Agent"""
    
    def __init__(self, user_id: str = "default_user"):
        self.user_id = user_id
        self.agent = self._create_agent()
        self.runner = Runner(agent=self.agent, app_name="movie_companion")
    
    def _create_agent(self) -> LlmAgent:
        """Create the LLM agent with all tools"""
        
        # Wrap tools to inject user_id
        async def _add_to_history(title: str, content_type: str = "series", status: str = "ongoing", 
                                   rating: int = None, season: int = None, episode: int = None) -> dict:
            return await add_to_history(title, content_type, status, rating, season, episode, self.user_id)
        
        async def _get_watch_history(status_filter: str = None) -> dict:
            return await get_watch_history(self.user_id, status_filter)
        
        async def _get_recommendations(genre: str = None, mood: str = None, 
                                        content_type: str = None, count: int = 5) -> dict:
            return await get_recommendations(self.user_id, genre, mood, content_type, count)
        
        async def _mark_rejected(title: str, reason: str = None) -> dict:
            return await mark_rejected(title, reason, self.user_id)
        
        async def _get_recap(title: str) -> dict:
            return await get_recap(title, self.user_id)
        
        async def _start_quiz() -> dict:
            return await start_quiz(self.user_id)
        
        async def _answer_quiz(answer: str, correct_answer: str) -> dict:
            return await answer_quiz(answer, correct_answer, self.user_id)
        
        async def _update_progress(title: str, season: int, episode: int) -> dict:
            return await update_watch_progress(title, season, episode, self.user_id)
        
        return LlmAgent(
            name="movie_series_companion",
            model=LiteLlm(model=settings.llm_model),
            description="A personalized entertainment companion that helps you discover, track, and enjoy movies and TV shows.",
            instruction=SYSTEM_INSTRUCTION,
            tools=[
                _add_to_history,
                _get_watch_history,
                _get_recommendations,
                _mark_rejected,
                _get_recap,
                search_show,
                _start_quiz,
                _answer_quiz,
                _update_progress
            ]
        )
    
    async def chat(self, message: str, session_id: Optional[str] = None) -> str:
        """Send a message to the agent and get a response"""
        try:
            session_id = session_id or str(uuid.uuid4())
            
            # Run the agent
            response_parts = []
            async for event in self.runner.run_async(
                user_id=self.user_id,
                session_id=session_id,
                new_message=types.Content(
                    role="user",
                    parts=[types.Part(text=message)]
                )
            ):
                if hasattr(event, 'content') and event.content:
                    for part in event.content.parts:
                        if hasattr(part, 'text') and part.text:
                            response_parts.append(part.text)
            
            return "".join(response_parts) if response_parts else "I'm having trouble responding right now. Please try again!"
            
        except Exception as e:
            logger.error(f"Chat error: {e}")
            return f"Sorry, I encountered an error: {str(e)}"


def create_agent(user_id: str = "default_user") -> CompanionAgent:
    """Factory function to create a companion agent"""
    return CompanionAgent(user_id=user_id)
