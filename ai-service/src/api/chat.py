from fastapi import APIRouter, HTTPException
from openai import OpenAI
from typing import List, Optional
import json
import httpx

from src.models import ChatRequest, ChatResponse, ContentItem
from src.config import settings

router = APIRouter()

# Initialize OpenAI client
client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

# TMDb API helper
async def search_tmdb(query: str, content_type: str = "multi") -> List[dict]:
    """Search TMDb for movies/shows."""
    if not settings.tmdb_api_key:
        return []
    
    async with httpx.AsyncClient() as http:
        endpoint = f"search/{content_type}" if content_type != "multi" else "search/multi"
        response = await http.get(
            f"{settings.tmdb_base_url}/{endpoint}",
            params={
                "query": query,
                "include_adult": "false",
                "api_key": settings.tmdb_api_key
            }
        )
        if response.status_code == 200:
            return response.json().get("results", [])[:5]
    return []


async def get_popular_by_genre(genre_id: int, content_type: str = "movie") -> List[dict]:
    """Get popular content by genre from TMDb."""
    if not settings.tmdb_api_key:
        return []
    
    async with httpx.AsyncClient() as http:
        endpoint = f"discover/{content_type}"
        response = await http.get(
            f"{settings.tmdb_base_url}/{endpoint}",
            params={
                "with_genres": str(genre_id),
                "sort_by": "popularity.desc",
                "vote_count.gte": "100",
                "api_key": settings.tmdb_api_key
            }
        )
        if response.status_code == 200:
            return response.json().get("results", [])[:5]
    return []


async def get_similar_movies(movie_id: int) -> List[dict]:
    """Get similar movies from TMDb."""
    if not settings.tmdb_api_key:
        return []
    
    async with httpx.AsyncClient() as http:
        response = await http.get(
            f"{settings.tmdb_base_url}/movie/{movie_id}/recommendations",
            params={"api_key": settings.tmdb_api_key}
        )
        if response.status_code == 200:
            return response.json().get("results", [])[:5]
    return []


# Genre ID mapping for TMDb
GENRE_MAP = {
    "action": 28, "adventure": 12, "animation": 16, "comedy": 35,
    "crime": 80, "documentary": 99, "drama": 18, "family": 10751,
    "fantasy": 14, "history": 36, "horror": 27, "music": 10402,
    "mystery": 9648, "romance": 10749, "science fiction": 878, "sci-fi": 878,
    "thriller": 53, "war": 10752, "western": 37, "dark": 53,
    "suspense": 53, "scary": 27, "funny": 35, "romantic": 10749
}


def build_system_prompt(watched_titles: List[str], disliked_titles: List[str], preferences: dict) -> str:
    """Build the system prompt with user context."""
    
    watched_info = f"\nUser has watched: {', '.join(watched_titles[:15])}" if watched_titles else ""
    disliked_info = f"\nUser dislikes: {', '.join(disliked_titles[:10])}" if disliked_titles else ""
    pref_info = ""
    if preferences.get("favoriteGenres"):
        pref_info = f"\nFavorite genres: {', '.join(preferences['favoriteGenres'])}"
    
    return f"""You are CinePal, a helpful movie recommendation AI. 

CRITICAL RULE: ALWAYS RECOMMEND IMMEDIATELY. Never ask clarifying questions. Even with minimal info, PROVIDE 3-5 RECOMMENDATIONS.

Your behavior:
1. User says anything about movies/shows? → Recommend immediately
2. User mentions a genre? → Recommend top picks in that genre
3. User mentions a director/actor? → Recommend their best work
4. User is vague? → Recommend based on their preferences or popular highly-rated picks
5. NEVER say "Could you tell me more?" or "What have you watched?" - JUST RECOMMEND

Response format:
- Give a SHORT friendly intro (1 line max)
- Then immediately list recommendations

ALWAYS include this JSON block at the end with 3-5 recommendations:
[RECOMMENDATIONS]
{{"title": "Movie Name", "year": "2023", "type": "movie", "reason": "One line why they'd love it"}}
{{"title": "Another Movie", "year": "2022", "type": "movie", "reason": "Brief compelling reason"}}
{{"title": "TV Show", "year": "2020", "type": "tv", "reason": "Why it's great"}}
[/RECOMMENDATIONS]

Context about this user:{watched_info}{disliked_info}{pref_info}

NEVER recommend anything from their watched or disliked lists."""


def parse_recommendations_from_response(response_text: str) -> tuple[str, List[dict]]:
    """Extract recommendations from AI response."""
    if "[RECOMMENDATIONS]" not in response_text:
        return response_text, []
    
    parts = response_text.split("[RECOMMENDATIONS]")
    message = parts[0].strip()
    
    try:
        rec_part = parts[1].split("[/RECOMMENDATIONS]")[0].strip()
        recommendations = []
        for line in rec_part.strip().split("\n"):
            line = line.strip()
            if line.startswith("{"):
                try:
                    rec = json.loads(line)
                    recommendations.append(rec)
                except json.JSONDecodeError:
                    continue
        return message, recommendations
    except Exception:
        return response_text, []


async def get_tmdb_details_for_recommendations(recommendations: List[dict]) -> List[ContentItem]:
    """Fetch TMDb details for recommendations."""
    content_items = []
    
    for rec in recommendations[:5]:
        title = rec.get("title", "")
        content_type = rec.get("type", "movie")
        
        results = await search_tmdb(title, content_type if content_type in ["movie", "tv"] else "multi")
        
        if results:
            result = results[0]
            content_items.append(ContentItem(
                id=result.get("id", 0),
                title=result.get("title") or result.get("name", title),
                posterPath=result.get("poster_path"),
                overview=result.get("overview", ""),
                releaseDate=result.get("release_date") or result.get("first_air_date"),
                voteAverage=result.get("vote_average"),
                contentType=result.get("media_type") or content_type,
                reason=rec.get("reason", "Recommended for you")
            ))
        else:
            content_items.append(ContentItem(
                id=hash(title) % 100000,
                title=title,
                posterPath=None,
                contentType=content_type,
                reason=rec.get("reason", "Recommended for you")
            ))
    
    return content_items


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process a chat message and ALWAYS return recommendations."""
    try:
        watched_titles = [h.title for h in request.history if h.status in ['watched', 'watching']]
        disliked_titles = [h.title for h in request.history if h.status in ['dropped', 'not_interested']]
        preferences = request.preferences.model_dump() if request.preferences else {}
        
        # If no OpenAI API key, use smart fallback
        if not client:
            return await smart_fallback_response(request.message, watched_titles, preferences)
        
        system_prompt = build_system_prompt(watched_titles, disliked_titles, preferences)
        
        completion = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        response_text = completion.choices[0].message.content or ""
        message, raw_recommendations = parse_recommendations_from_response(response_text)
        
        # Always try to get recommendations
        if raw_recommendations:
            recommendations = await get_tmdb_details_for_recommendations(raw_recommendations)
        else:
            # AI didn't include recommendations, force fallback
            recommendations = await get_fallback_recommendations(request.message)
        
        return ChatResponse(response=message, recommendations=recommendations)
        
    except Exception as e:
        print(f"Chat error: {e}")
        return await smart_fallback_response(request.message, [], {})


async def get_fallback_recommendations(message: str) -> List[ContentItem]:
    """Get recommendations based on message content."""
    message_lower = message.lower()
    
    # Detect genre from message
    detected_genre = None
    for genre, genre_id in GENRE_MAP.items():
        if genre in message_lower:
            detected_genre = genre
            break
    
    if detected_genre and settings.tmdb_api_key:
        genre_id = GENRE_MAP[detected_genre]
        results = await get_popular_by_genre(genre_id)
        return [
            ContentItem(
                id=r.get("id"),
                title=r.get("title") or r.get("name"),
                posterPath=r.get("poster_path"),
                overview=r.get("overview"),
                releaseDate=r.get("release_date") or r.get("first_air_date"),
                voteAverage=r.get("vote_average"),
                contentType="movie" if "title" in r else "tv",
                reason=f"Highly rated {detected_genre}"
            )
            for r in results[:3]
        ]
    
    # Default popular movies
    return []


async def smart_fallback_response(message: str, watched: List[str], preferences: dict) -> ChatResponse:
    """Smart fallback when OpenAI is not configured - ALWAYS recommend."""
    message_lower = message.lower()
    
    # Detect genre
    detected_genre = None
    for genre in GENRE_MAP.keys():
        if genre in message_lower:
            detected_genre = genre
            break
    
    # Check for director/actor mentions
    directors = {
        "nolan": ["Inception", "Interstellar", "The Dark Knight", "Oppenheimer", "Tenet"],
        "tarantino": ["Pulp Fiction", "Kill Bill", "Django Unchained", "Inglourious Basterds"],
        "scorsese": ["Goodfellas", "The Departed", "Taxi Driver", "The Irishman"],
        "spielberg": ["Schindler's List", "Jurassic Park", "Saving Private Ryan", "E.T."],
        "fincher": ["Fight Club", "Se7en", "Gone Girl", "The Social Network", "Zodiac"]
    }
    
    for director, films in directors.items():
        if director in message_lower:
            recommendations = []
            for film in films[:3]:
                results = await search_tmdb(film, "movie")
                if results:
                    r = results[0]
                    recommendations.append(ContentItem(
                        id=r.get("id"),
                        title=r.get("title") or r.get("name"),
                        posterPath=r.get("poster_path"),
                        overview=r.get("overview", ""),
                        voteAverage=r.get("vote_average"),
                        contentType="movie",
                        reason=f"Essential {director.title()} film"
                    ))
            if recommendations:
                return ChatResponse(
                    response=f"Great taste! Here are some essential {director.title()} films you'll love 🎬",
                    recommendations=recommendations
                )
    
    # Genre detected - recommend immediately
    if detected_genre and settings.tmdb_api_key:
        genre_id = GENRE_MAP[detected_genre]
        results = await get_popular_by_genre(genre_id)
        if results:
            recommendations = [
                ContentItem(
                    id=r.get("id"),
                    title=r.get("title") or r.get("name"),
                    posterPath=r.get("poster_path"),
                    overview=r.get("overview"),
                    voteAverage=r.get("vote_average"),
                    contentType="movie",
                    reason=f"Top rated {detected_genre}"
                )
                for r in results[:3]
            ]
            return ChatResponse(
                response=f"Here are some amazing {detected_genre} picks for you! 🎬",
                recommendations=recommendations
            )
    
    # Any other message - recommend popular/trending
    if settings.tmdb_api_key:
        async with httpx.AsyncClient() as http:
            response = await http.get(
                f"{settings.tmdb_base_url}/trending/all/week",
                headers={"Authorization": f"Bearer {settings.tmdb_api_key}"}
            )
            if response.status_code == 200:
                results = response.json().get("results", [])[:3]
                recommendations = [
                    ContentItem(
                        id=r.get("id"),
                        title=r.get("title") or r.get("name"),
                        posterPath=r.get("poster_path"),
                        overview=r.get("overview"),
                        voteAverage=r.get("vote_average"),
                        contentType=r.get("media_type", "movie"),
                        reason="Trending this week"
                    )
                    for r in results
                ]
                return ChatResponse(
                    response="Here's what's trending right now! Tell me a genre or mood for more personalized picks 🍿",
                    recommendations=recommendations
                )
    
    return ChatResponse(
        response="I'm ready to recommend! Tell me a genre (comedy, thriller, sci-fi, horror) or a director/actor you like!",
        recommendations=[]
    )
