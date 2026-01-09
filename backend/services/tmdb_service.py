"""
TMDB Service - The Movie Database API Integration
Provides movie/TV metadata, search, and episode information
"""

import httpx
from typing import Optional, List, Dict, Any
import logging

from ..config import settings

logger = logging.getLogger(__name__)


class TMDBService:
    """Service for interacting with TMDB API"""
    
    def __init__(self):
        self.api_key = settings.tmdb_api_key
        self.base_url = settings.tmdb_base_url
        self.image_base_url = "https://image.tmdb.org/t/p"
    
    def _get_headers(self) -> dict:
        """Get API headers"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def _get_params(self, **kwargs) -> dict:
        """Get API params with API key"""
        params = {"api_key": self.api_key}
        params.update(kwargs)
        return params
    
    def _get_poster_url(self, poster_path: Optional[str], size: str = "w500") -> Optional[str]:
        """Convert poster path to full URL"""
        if poster_path:
            return f"{self.image_base_url}/{size}{poster_path}"
        return None
    
    async def search_multi(self, query: str, page: int = 1) -> List[Dict[str, Any]]:
        """Search for movies and TV shows"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/search/multi",
                    params=self._get_params(query=query, page=page, include_adult=False)
                )
                response.raise_for_status()
                data = response.json()
                
                results = []
                for item in data.get("results", []):
                    if item.get("media_type") in ["movie", "tv"]:
                        results.append(self._format_result(item))
                
                return results
                
        except Exception as e:
            logger.error(f"TMDB search error: {e}")
            return []
    
    async def search_tv(self, query: str, page: int = 1) -> List[Dict[str, Any]]:
        """Search for TV shows only"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/search/tv",
                    params=self._get_params(query=query, page=page)
                )
                response.raise_for_status()
                data = response.json()
                
                return [self._format_tv_result(item) for item in data.get("results", [])]
                
        except Exception as e:
            logger.error(f"TMDB TV search error: {e}")
            return []
    
    async def search_movie(self, query: str, page: int = 1) -> List[Dict[str, Any]]:
        """Search for movies only"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/search/movie",
                    params=self._get_params(query=query, page=page)
                )
                response.raise_for_status()
                data = response.json()
                
                return [self._format_movie_result(item) for item in data.get("results", [])]
                
        except Exception as e:
            logger.error(f"TMDB movie search error: {e}")
            return []
    
    async def discover_tv(
        self,
        genres: Optional[List[int]] = None,
        min_rating: float = 7.0,
        page: int = 1,
        sort_by: str = "popularity.desc"
    ) -> List[Dict[str, Any]]:
        """Discover TV shows with filters"""
        try:
            params = self._get_params(
                page=page,
                sort_by=sort_by,
                vote_average_gte=min_rating,
                vote_count_gte=100
            )
            
            if genres:
                params["with_genres"] = ",".join(map(str, genres))
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/discover/tv",
                    params=params
                )
                response.raise_for_status()
                data = response.json()
                
                return [self._format_tv_result(item) for item in data.get("results", [])]
                
        except Exception as e:
            logger.error(f"TMDB discover TV error: {e}")
            return []
    
    async def discover_movies(
        self,
        genres: Optional[List[int]] = None,
        min_rating: float = 7.0,
        page: int = 1,
        sort_by: str = "popularity.desc"
    ) -> List[Dict[str, Any]]:
        """Discover movies with filters"""
        try:
            params = self._get_params(
                page=page,
                sort_by=sort_by,
                vote_average_gte=min_rating,
                vote_count_gte=100
            )
            
            if genres:
                params["with_genres"] = ",".join(map(str, genres))
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/discover/movie",
                    params=params
                )
                response.raise_for_status()
                data = response.json()
                
                return [self._format_movie_result(item) for item in data.get("results", [])]
                
        except Exception as e:
            logger.error(f"TMDB discover movies error: {e}")
            return []
    
    async def get_tv_details(self, tv_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed information about a TV show"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/tv/{tv_id}",
                    params=self._get_params()
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "id": str(data.get("id")),
                    "title": data.get("name"),
                    "type": "series",
                    "overview": data.get("overview"),
                    "poster_url": self._get_poster_url(data.get("poster_path")),
                    "rating": data.get("vote_average"),
                    "first_air_date": data.get("first_air_date"),
                    "genres": [g.get("name") for g in data.get("genres", [])],
                    "number_of_seasons": data.get("number_of_seasons"),
                    "number_of_episodes": data.get("number_of_episodes"),
                    "status": data.get("status"),
                    "networks": [n.get("name") for n in data.get("networks", [])]
                }
                
        except Exception as e:
            logger.error(f"TMDB get TV details error: {e}")
            return None
    
    async def get_episode_details(self, tv_id: int, season: int, episode: int) -> Optional[Dict[str, Any]]:
        """Get details about a specific episode"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/tv/{tv_id}/season/{season}/episode/{episode}",
                    params=self._get_params()
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "season_number": data.get("season_number"),
                    "episode_number": data.get("episode_number"),
                    "name": data.get("name"),
                    "overview": data.get("overview"),
                    "air_date": data.get("air_date"),
                    "runtime": data.get("runtime"),
                    "still_path": self._get_poster_url(data.get("still_path"))
                }
                
        except Exception as e:
            logger.error(f"TMDB get episode details error: {e}")
            return None
    
    async def get_genre_list(self, media_type: str = "tv") -> Dict[int, str]:
        """Get genre ID to name mapping"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/genre/{media_type}/list",
                    params=self._get_params()
                )
                response.raise_for_status()
                data = response.json()
                
                return {g["id"]: g["name"] for g in data.get("genres", [])}
                
        except Exception as e:
            logger.error(f"TMDB get genres error: {e}")
            return {}
    
    async def get_similar_tv(self, tv_id: int, page: int = 1) -> List[Dict[str, Any]]:
        """Get similar TV shows"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/tv/{tv_id}/similar",
                    params=self._get_params(page=page)
                )
                response.raise_for_status()
                data = response.json()
                
                return [self._format_tv_result(item) for item in data.get("results", [])]
                
        except Exception as e:
            logger.error(f"TMDB get similar TV error: {e}")
            return []
    
    async def find_by_title(self, title: str) -> Optional[Dict[str, Any]]:
        """Find a show/movie by title (returns first match)"""
        results = await self.search_multi(title)
        return results[0] if results else None
    
    def _format_result(self, item: dict) -> Dict[str, Any]:
        """Format search result for unified output"""
        media_type = item.get("media_type", "tv")
        
        if media_type == "movie":
            return self._format_movie_result(item)
        else:
            return self._format_tv_result(item)
    
    def _format_tv_result(self, item: dict) -> Dict[str, Any]:
        """Format TV show result"""
        year = None
        first_air_date = item.get("first_air_date", "")
        if first_air_date:
            year = int(first_air_date[:4]) if len(first_air_date) >= 4 else None
        
        return {
            "id": str(item.get("id")),
            "title": item.get("name"),
            "type": "series",
            "year": year,
            "rating": item.get("vote_average"),
            "overview": item.get("overview"),
            "poster_url": self._get_poster_url(item.get("poster_path")),
            "genre_ids": item.get("genre_ids", []),
            "popularity": item.get("popularity", 0)
        }
    
    def _format_movie_result(self, item: dict) -> Dict[str, Any]:
        """Format movie result"""
        year = None
        release_date = item.get("release_date", "")
        if release_date:
            year = int(release_date[:4]) if len(release_date) >= 4 else None
        
        return {
            "id": str(item.get("id")),
            "title": item.get("title"),
            "type": "movie",
            "year": year,
            "rating": item.get("vote_average"),
            "overview": item.get("overview"),
            "poster_url": self._get_poster_url(item.get("poster_path")),
            "genre_ids": item.get("genre_ids", []),
            "popularity": item.get("popularity", 0)
        }


# Genre ID mappings (TMDB standard IDs)
TV_GENRE_MAP = {
    "action": 10759,
    "adventure": 10759,
    "animation": 16,
    "comedy": 35,
    "crime": 80,
    "documentary": 99,
    "drama": 18,
    "family": 10751,
    "fantasy": 10765,
    "kids": 10762,
    "mystery": 9648,
    "news": 10763,
    "reality": 10764,
    "romance": 10766,
    "sci-fi": 10765,
    "science fiction": 10765,
    "soap": 10766,
    "talk": 10767,
    "thriller": 10765,
    "war": 10768,
    "western": 37
}

MOVIE_GENRE_MAP = {
    "action": 28,
    "adventure": 12,
    "animation": 16,
    "comedy": 35,
    "crime": 80,
    "documentary": 99,
    "drama": 18,
    "family": 10751,
    "fantasy": 14,
    "history": 36,
    "horror": 27,
    "music": 10402,
    "mystery": 9648,
    "romance": 10749,
    "sci-fi": 878,
    "science fiction": 878,
    "thriller": 53,
    "tv movie": 10770,
    "war": 10752,
    "western": 37
}


# Singleton instance
tmdb_service = TMDBService()
