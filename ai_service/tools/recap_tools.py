"""
Recap Tools - Generate spoiler-free episode recaps
"""
from typing import Any, Dict, Optional
from openai import AsyncOpenAI
from config import settings
from services import tavily_service, tmdb_service


async def generate_recap(
    show_title: str,
    tmdb_id: int,
    current_season: int,
    current_episode: int,
    content_type: str = "series",
) -> Dict[str, Any]:
    """
    Generate a spoiler-free recap of a TV show up to the user's current progress.
    
    Args:
        show_title: Name of the show
        tmdb_id: TMDB ID
        current_season: User's current season
        current_episode: User's current episode
        content_type: "series" or "movie"
    
    Returns:
        Recap text with key plot points and character highlights
    """
    try:
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        
        # Get show details for context
        if content_type == "movie":
            show_data = await tmdb_service.get_movie_details(tmdb_id)
        else:
            show_data = await tmdb_service.get_tv_details(tmdb_id)
        
        overview = show_data.get("overview", "")
        genres = [g["name"] for g in show_data.get("genres", [])]
        
        # Search for recap information
        search_query = f"{show_title} season {current_season} episode {current_episode} recap summary"
        web_results = await tavily_service.search_entertainment(search_query, "recap")
        
        # Build context from web search
        web_context = ""
        if web_results.get("answer"):
            web_context = f"\nWeb search context:\n{web_results['answer'][:1000]}"
        
        prompt = f"""Generate a helpful recap for someone who has watched "{show_title}" up to Season {current_season}, Episode {current_episode}.

Show Overview: {overview}
Genres: {', '.join(genres)}
{web_context}

Instructions:
1. Summarize the major plot points UP TO Season {current_season}, Episode {current_episode} ONLY
2. DO NOT reveal anything that happens AFTER this point - this is CRITICAL
3. Highlight 2-3 key characters and their current situations
4. Mention any unresolved storylines the viewer should remember
5. Keep the tone engaging and helpful, like a friend reminding them

Format your response as:
## 📺 Where You Left Off
[Brief summary of the current situation at S{current_season}E{current_episode}]

## 🎭 Key Characters
[2-3 character summaries with their current arcs]

## 📌 Remember These Plot Points
[3-4 bullet points of important ongoing storylines]

## 🛡️ Spoiler Shield
This recap covers content up to S{current_season}E{current_episode} only.

Keep the total length around 300-400 words."""

        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an entertainment expert who helps viewers remember where they left off in TV shows. You NEVER spoil future episodes. You write engaging, friendly recaps.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=1000,
        )
        
        recap_text = response.choices[0].message.content
        
        return {
            "success": True,
            "show_title": show_title,
            "season": current_season,
            "episode": current_episode,
            "recap": recap_text,
            "sources": [s.get("url") for s in web_results.get("sources", [])][:3],
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "recap": f"I couldn't generate a recap for {show_title} right now. Please try again.",
        }


async def generate_quick_reminder(
    show_title: str,
    last_watched_date: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate a quick one-paragraph reminder about a show.
    
    Args:
        show_title: Name of the show
        last_watched_date: Optional date string for context
    
    Returns:
        Quick reminder text
    """
    try:
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        
        time_context = ""
        if last_watched_date:
            time_context = f" They last watched it on {last_watched_date}."
        
        prompt = f"""Generate a quick 2-3 sentence reminder about the TV show/movie "{show_title}".{time_context}

Include:
- What the show is about (genre, premise)
- Why it's popular or notable
- A hook to encourage them to continue

Keep it casual and friendly, like a friend reminding them about a great show."""

        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a friendly entertainment companion. Keep responses brief and engaging.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=200,
        )
        
        return {
            "success": True,
            "reminder": response.choices[0].message.content,
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "reminder": f"You were watching {show_title}!",
        }


RECAP_TOOLS = [
    generate_recap,
    generate_quick_reminder,
]
