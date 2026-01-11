"""
TMDB Service - Fetches movie/series data from The Movie Database API
"""
import httpx
from typing import Optional, Dict, Any, List
from config import settings


class TMDBService:
    """Service for interacting with TMDB API."""
    
    def __init__(self):
        self.api_key = settings.tmdb_api_key
        self.base_url = settings.tmdb_base_url
        self.image_base = "https://image.tmdb.org/t/p"
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
        }

    async def _request(self, method: str, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make a request to TMDB API."""
        if params is None:
            params = {}
        # Inject API Key
        params["api_key"] = self.api_key
        
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method,
                f"{self.base_url}/{endpoint}",
                params=params,
                headers=self._get_headers(),
                timeout=10.0,
            )
            response.raise_for_status()
            return response.json()
    
    async def search_multi(self, query: str, page: int = 1) -> Dict[str, Any]:
        """Search for movies and TV shows."""
        return await self._request("GET", "search/multi", {
            "query": query, "page": page, "include_adult": False
        })
    
    async def get_movie_details(self, movie_id: int) -> Dict[str, Any]:
        """Get detailed movie information."""
        return await self._request("GET", f"movie/{movie_id}", {
            "append_to_response": "credits,recommendations,keywords"
        })
    
    async def get_tv_details(self, tv_id: int) -> Dict[str, Any]:
        """Get detailed TV show information."""
        return await self._request("GET", f"tv/{tv_id}", {
            "append_to_response": "credits,recommendations,keywords"
        })
    
    async def get_tv_season(self, tv_id: int, season: int) -> Dict[str, Any]:
        """Get TV season details including episode air dates."""
        return await self._request("GET", f"tv/{tv_id}/season/{season}")
    
    async def get_episode_details(
        self, tv_id: int, season: int, episode: int
    ) -> Dict[str, Any]:
        """Get specific episode details."""
        return await self._request("GET", f"tv/{tv_id}/season/{season}/episode/{episode}")
    
    async def get_recommendations(
        self, media_type: str, media_id: int
    ) -> List[Dict[str, Any]]:
        """Get recommendations based on a movie/show."""
        endpoint = "movie" if media_type == "movie" else "tv"
        data = await self._request("GET", f"{endpoint}/{media_id}/recommendations")
        return data.get("results", [])[:10]
    
    async def discover(
        self,
        media_type: str = "tv",
        genres: Optional[List[int]] = None,
        exclude_genres: Optional[List[int]] = None,
        min_rating: float = 7.0,
        sort_by: str = "popularity.desc",
        page: int = 1,
    ) -> List[Dict[str, Any]]:
        """Discover content with filters."""
        endpoint = "movie" if media_type == "movie" else "tv"
        params: Dict[str, Any] = {
            "page": page,
            "sort_by": sort_by,
            "vote_average.gte": min_rating,
            "vote_count.gte": 100,
        }
        
        if genres:
            params["with_genres"] = ",".join(map(str, genres))
        if exclude_genres:
            params["without_genres"] = ",".join(map(str, exclude_genres))
        
        data = await self._request("GET", f"discover/{endpoint}", params)
        return data.get("results", [])[:10]
    
    async def get_genres(self, media_type: str = "tv") -> Dict[int, str]:
        """Get genre ID to name mapping."""
        endpoint = "movie" if media_type == "movie" else "tv"
        data = await self._request("GET", f"genre/{endpoint}/list")
        return {g["id"]: g["name"] for g in data.get("genres", [])}
    
    def get_poster_url(self, path: Optional[str], size: str = "w500") -> Optional[str]:
        """Get full poster URL."""
        if not path:
            return None
        return f"{self.image_base}/{size}{path}"
    
    def get_backdrop_url(
        self, path: Optional[str], size: str = "w1280"
    ) -> Optional[str]:
        """Get full backdrop URL."""
        if not path:
            return None
        return f"{self.image_base}/{size}{path}"


# Singleton instance
tmdb_service = TMDBService()
