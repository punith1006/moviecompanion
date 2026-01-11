"""
Tavily Search Service - Web search optimized for AI agents
"""
from typing import List, Dict, Any, Optional
from tavily import TavilyClient
from config import settings


class TavilyService:
    """Service for web search using Tavily API."""
    
    def __init__(self):
        self.client = TavilyClient(api_key=settings.tavily_api_key) if settings.tavily_api_key else None
    
    async def search(
        self,
        query: str,
        search_depth: str = "basic",
        max_results: int = 5,
        include_domains: Optional[List[str]] = None,
        exclude_domains: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Search the web using Tavily.
        
        Args:
            query: Search query
            search_depth: "basic" or "advanced"
            max_results: Number of results (1-10)
            include_domains: Optional list of domains to prioritize
            exclude_domains: Optional list of domains to exclude
        
        Returns:
            Dict with 'results' and 'answer' (AI-generated summary)
        """
        if not self.client:
            return {
                "results": [],
                "answer": "Web search is not configured. Please add TAVILY_API_KEY.",
                "error": "Missing API key",
            }
        
        try:
            # Tavily search is synchronous, but we keep async signature for consistency
            response = self.client.search(
                query=query,
                search_depth=search_depth,
                max_results=max_results,
                include_domains=include_domains or [],
                exclude_domains=exclude_domains or [],
                include_answer=True,
            )
            
            return {
                "results": [
                    {
                        "title": r.get("title", ""),
                        "url": r.get("url", ""),
                        "content": r.get("content", ""),
                        "score": r.get("score", 0),
                    }
                    for r in response.get("results", [])
                ],
                "answer": response.get("answer", ""),
                "query": query,
            }
        except Exception as e:
            return {
                "results": [],
                "answer": f"Search failed: {str(e)}",
                "error": str(e),
            }
    
    async def search_entertainment(
        self,
        query: str,
        content_type: str = "general",
    ) -> Dict[str, Any]:
        """
        Search for entertainment-related content.
        
        Args:
            query: Search query about movies/TV shows
            content_type: "recap", "news", "reviews", "cast", "general"
        """
        # Prioritize entertainment sites
        entertainment_domains = [
            "imdb.com",
            "rottentomatoes.com",
            "metacritic.com",
            "tvguide.com",
            "deadline.com",
            "variety.com",
            "hollywoodreporter.com",
            "entertainment.ie",
        ]
        
        # Add context to query based on content type
        enhanced_query = query
        if content_type == "recap":
            enhanced_query = f"{query} episode recap summary plot spoiler-free"
        elif content_type == "news":
            enhanced_query = f"{query} latest news updates 2024 2025"
        elif content_type == "reviews":
            enhanced_query = f"{query} review rating critic"
        elif content_type == "cast":
            enhanced_query = f"{query} cast actors characters"
        
        return await self.search(
            query=enhanced_query,
            search_depth="advanced",
            max_results=5,
            include_domains=entertainment_domains,
        )
    
    async def get_latest_episode_info(
        self, show_title: str
    ) -> Dict[str, Any]:
        """Search for latest episode information for a show."""
        query = f"{show_title} new episode release date when next episode"
        
        return await self.search(
            query=query,
            search_depth="advanced",
            max_results=3,
            include_domains=["tvguide.com", "imdb.com", "tvline.com"],
        )


# Singleton instance
tavily_service = TavilyService()
