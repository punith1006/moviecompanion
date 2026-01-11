"""
Agent Tools - Functions that the ReelMind agent can use
These are decorated for use with Google ADK
"""
from typing import Any, Dict, List, Optional
from services import tmdb_service, tavily_service


async def search_show(query: str) -> Dict[str, Any]:
    """
    Search for a movie or TV show by name.
    
    Args:
        query: The name of the movie or TV show to search for
    
    Returns:
        Search results with title, ID, type, overview, and poster
    """
    try:
        results = await tmdb_service.search_multi(query)
        
        items = []
        for r in results.get("results", [])[:5]:
            media_type = r.get("media_type", "unknown")
            if media_type not in ["movie", "tv"]:
                continue
            
            items.append({
                "id": r.get("id"),
                "title": r.get("title") or r.get("name"),
                "type": "movie" if media_type == "movie" else "series",
                "overview": r.get("overview", "")[:200],
                "rating": r.get("vote_average", 0),
                "year": (r.get("release_date") or r.get("first_air_date") or "")[:4],
                "poster_url": tmdb_service.get_poster_url(r.get("poster_path")),
            })
        
        return {
            "success": True,
            "results": items,
            "count": len(items),
        }
    except Exception as e:
        return {"success": False, "error": str(e), "results": []}


async def get_show_details(tmdb_id: int, content_type: str = "series") -> Dict[str, Any]:
    """
    Get detailed information about a movie or TV show.
    
    Args:
        tmdb_id: The TMDB ID of the content
        content_type: Either "movie" or "series"
    
    Returns:
        Detailed information including genres, cast, overview, ratings
    """
    try:
        if content_type == "movie":
            data = await tmdb_service.get_movie_details(tmdb_id)
        else:
            data = await tmdb_service.get_tv_details(tmdb_id)
        
        cast = []
        if "credits" in data:
            for c in data["credits"].get("cast", [])[:10]:
                cast.append({
                    "name": c.get("name"),
                    "character": c.get("character"),
                })
        
        return {
            "success": True,
            "details": {
                "id": data.get("id"),
                "title": data.get("title") or data.get("name"),
                "overview": data.get("overview"),
                "genres": [g["name"] for g in data.get("genres", [])],
                "rating": data.get("vote_average"),
                "status": data.get("status"),
                "tagline": data.get("tagline"),
                "seasons": data.get("number_of_seasons"),
                "episodes": data.get("number_of_episodes"),
                "runtime": data.get("runtime") or data.get("episode_run_time", [None])[0] if data.get("episode_run_time") else None,
                "cast": cast,
                "poster_url": tmdb_service.get_poster_url(data.get("poster_path")),
                "backdrop_url": tmdb_service.get_backdrop_url(data.get("backdrop_path")),
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


async def get_episode_info(
    tmdb_id: int, season: int, episode: int
) -> Dict[str, Any]:
    """
    Get information about a specific episode.
    
    Args:
        tmdb_id: The TMDB ID of the TV show
        season: Season number
        episode: Episode number
    
    Returns:
        Episode details including name, overview, air date
    """
    try:
        data = await tmdb_service.get_episode_details(tmdb_id, season, episode)
        
        return {
            "success": True,
            "episode": {
                "name": data.get("name"),
                "episode_number": data.get("episode_number"),
                "season_number": data.get("season_number"),
                "overview": data.get("overview"),
                "air_date": data.get("air_date"),
                "runtime": data.get("runtime"),
                "rating": data.get("vote_average"),
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


async def get_recommendations(
    tmdb_id: int,
    content_type: str = "series",
    exclude_ids: Optional[List[int]] = None,
) -> Dict[str, Any]:
    """
    Get personalized recommendations based on a movie or show.
    
    Args:
        tmdb_id: The TMDB ID to base recommendations on
        content_type: Either "movie" or "series"
        exclude_ids: List of TMDB IDs to exclude (already watched/rejected)
    
    Returns:
        List of recommended shows/movies
    """
    try:
        media_type = "movie" if content_type == "movie" else "tv"
        results = await tmdb_service.get_recommendations(media_type, tmdb_id)
        
        exclude_set = set(exclude_ids or [])
        
        recommendations = []
        for r in results:
            if r.get("id") in exclude_set:
                continue
            
            recommendations.append({
                "id": r.get("id"),
                "title": r.get("title") or r.get("name"),
                "overview": r.get("overview", "")[:200],
                "rating": r.get("vote_average", 0),
                "poster_url": tmdb_service.get_poster_url(r.get("poster_path")),
            })
        
        return {
            "success": True,
            "recommendations": recommendations[:5],
        }
    except Exception as e:
        return {"success": False, "error": str(e), "recommendations": []}


async def discover_content(
    genres: Optional[List[str]] = None,
    exclude_genres: Optional[List[str]] = None,
    content_type: str = "series",
    min_rating: float = 7.0,
) -> Dict[str, Any]:
    """
    Discover new content based on genre preferences.
    
    Args:
        genres: List of genre names to include
        exclude_genres: List of genre names to exclude
        content_type: Either "movie" or "series"
        min_rating: Minimum rating threshold
    
    Returns:
        List of discovered content matching criteria
    """
    try:
        # Get genre mappings
        media_type = "movie" if content_type == "movie" else "tv"
        genre_map = await tmdb_service.get_genres(media_type)
        reverse_map = {v.lower(): k for k, v in genre_map.items()}
        
        # Convert genre names to IDs
        genre_ids = [reverse_map.get(g.lower()) for g in (genres or []) if g.lower() in reverse_map]
        exclude_ids = [reverse_map.get(g.lower()) for g in (exclude_genres or []) if g.lower() in reverse_map]
        
        results = await tmdb_service.discover(
            media_type=media_type,
            genres=genre_ids if genre_ids else None,
            exclude_genres=exclude_ids if exclude_ids else None,
            min_rating=min_rating,
        )
        
        items = []
        for r in results[:5]:
            genre_names = [genre_map.get(gid, "") for gid in r.get("genre_ids", [])]
            items.append({
                "id": r.get("id"),
                "title": r.get("title") or r.get("name"),
                "overview": r.get("overview", "")[:200],
                "rating": r.get("vote_average", 0),
                "genres": genre_names,
                "poster_url": tmdb_service.get_poster_url(r.get("poster_path")),
            })
        
        return {
            "success": True,
            "results": items,
        }
    except Exception as e:
        return {"success": False, "error": str(e), "results": []}


async def web_search(
    query: str,
    search_type: str = "general",
) -> Dict[str, Any]:
    """
    Search the web for entertainment information.
    Use this for latest news, release dates, or information not in TMDB.
    
    Args:
        query: Search query
        search_type: One of "general", "recap", "news", "reviews", "cast"
    
    Returns:
        Search results with AI-generated summary and sources
    """
    try:
        result = await tavily_service.search_entertainment(query, search_type)
        return {
            "success": True,
            "answer": result.get("answer", ""),
            "sources": [
                {
                    "title": r.get("title"),
                    "url": r.get("url"),
                    "snippet": r.get("content", "")[:200],
                }
                for r in result.get("results", [])
            ],
        }
    except Exception as e:
        return {"success": False, "error": str(e), "answer": "", "sources": []}


async def get_upcoming_episodes(tmdb_id: int, season: int) -> Dict[str, Any]:
    """
    Get upcoming episode air dates for a TV show.
    
    Args:
        tmdb_id: The TMDB ID of the TV show
        season: Current or next season number
    
    Returns:
        List of upcoming episodes with air dates
    """
    try:
        data = await tmdb_service.get_tv_season(tmdb_id, season)
        
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        
        upcoming = []
        for ep in data.get("episodes", []):
            air_date = ep.get("air_date")
            if air_date and air_date >= today:
                upcoming.append({
                    "episode_number": ep.get("episode_number"),
                    "name": ep.get("name"),
                    "air_date": air_date,
                    "overview": ep.get("overview", "")[:150] if ep.get("overview") else None,
                })
        
        return {
            "success": True,
            "season": season,
            "upcoming_episodes": upcoming[:5],
        }
    except Exception as e:
        return {"success": False, "error": str(e), "upcoming_episodes": []}


# Tool definitions for ADK
TOOLS = [
    search_show,
    get_show_details,
    get_episode_info,
    get_recommendations,
    discover_content,
    web_search,
    get_upcoming_episodes,
]
