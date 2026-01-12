"""
ReelMind Agent - The AI companion for movies and TV shows
Built with Google ADK, powered by Gemini
"""
from typing import Any, Dict, List, Optional
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from config import settings
from tools import ALL_TOOLS


# System prompt defining the agent's personality and capabilities
SYSTEM_PROMPT = """You are ReelMind, a friendly movie and TV companion - like a best friend who knows everything about entertainment.

## Your Persona
- Warm, enthusiastic, and genuinely helpful
- Expert on movies and TV shows - you know hidden gems and popular favorites
- Use emojis naturally (🎬, 🍿, ✨) but don't overdo it

## 📋 RECOMMENDATIONS OUTPUT FORMAT
When recommending content, include this block at the END of your response:

[RECOMMENDATIONS]
["Title 1", "Title 2", "Title 3"]
[/RECOMMENDATIONS]

**RULES:**
1. **User mentions loving a show** (e.g., "I loved Breaking Bad"):
   → Include 3-5 SIMILAR shows: `["Better Call Saul", "Ozark", "The Wire", "Narcos"]`
   
2. **User asks about a specific title** (e.g., "What is Ted Lasso about?"):
   → Include ONLY that title: `["Ted Lasso"]`
   
3. **User wants recommendations** (e.g., "Recommend me thrillers"):
   → Include 3-6 relevant titles

4. **DO NOT include recommendations for:**
   - General greetings ("Hello", "How are you")
   - Discussing theories, plots, or characters they already know
   - Recaps or quizzes

## Guidelines
- NO SPOILERS ever
- Be concise - chat style, not essays
- End with an engaging follow-up question

You are a companion, not an assistant. Keep them engaged!"""


def create_agent(user_context: Optional[Dict[str, Any]] = None) -> Agent:
    """
    Create a ReelMind agent instance.
    
    Args:
        user_context: Optional user context (watch history, preferences, etc.)
    
    Returns:
        Configured Agent instance
    """
    # Configure LiteLLM to use OpenAI
    model = LiteLlm(
        model=f"openai/{settings.openai_model}",
        api_key=settings.openai_api_key,
    )
    
    # Build context-aware system prompt
    system_prompt = SYSTEM_PROMPT
    if user_context:
        name = user_context.get("userName", "there")
        stats = user_context.get("userStats", {})
        history = user_context.get("watchHistory", [])
        
        # Add personalized context
        context_additions = f"""

## Current User: {name}
- Level: {stats.get('level', 1)} | XP: {stats.get('totalXP', 0)}
- Shows Tracked: {stats.get('showsWatched', 0)}
- Quiz Streak: {stats.get('quizStreak', 0)} days

## Their Watch History Summary:
"""
        # Add watch history summary
        watching = [h for h in history if h.get("status") == "watching"]
        completed = [h for h in history if h.get("status") == "completed"]
        
        if watching:
            context_additions += f"Currently Watching: {', '.join([h['title'] for h in watching[:5]])}\n"
        if completed:
            context_additions += f"Recently Completed: {', '.join([h['title'] for h in completed[:5]])}\n"
        
        system_prompt += context_additions
    
    # Create the agent
    agent = Agent(
        name="ReelMind",
        model=model,
        description="Your personal AI entertainment companion for movies and TV shows",
        instruction=system_prompt,
        tools=ALL_TOOLS,
    )
    
    return agent


# Session service for conversation memory
session_service = InMemorySessionService()


async def chat_with_agent(
    message: str,
    user_id: str,
    conversation_id: str,
    user_context: Optional[Dict[str, Any]] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Send a message to the ReelMind agent and get a response.
    
    Args:
        message: User's message
        user_id: User identifier
        conversation_id: Conversation/session identifier
        user_context: User's watch history, preferences, stats
        conversation_history: Previous messages for context
    
    Returns:
        Agent response with metadata
    """
    try:

        # Create agent with user context
        agent = create_agent(user_context)
        
        # Create runner
        # Use a fresh session service for this request to ensure sync with backend history
        # (Ideal state, but for now we use global to test connectivity)
        # Build session ID
        session_id = f"{user_id}:{conversation_id}"
        app_name = "reelmind"
        
        # Ensure session exists - get_session returns None if not found
        session = await session_service.get_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id
        )
        
        if session is None:
            # Session doesn't exist, create it
            await session_service.create_session(
                app_name=app_name,
                user_id=user_id,
                session_id=session_id
            )
        
        # Create runner
        runner = Runner(
            agent=agent,
            app_name=app_name,
            session_service=session_service,
        )
        
        # Run the agent
        response_text = ""
        tools_used = []
        
        # Create correctly formatted message using google.genai types
        user_message = types.Content(
            role='user',
            parts=[types.Part(text=message)]
        )
        
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=user_message,
        ):
            # Extract text from ADK Event structure: event.content.parts[i].text
            if hasattr(event, 'content') and event.content:
                if hasattr(event.content, 'parts') and event.content.parts:
                    for part in event.content.parts:
                        if hasattr(part, 'text') and part.text:
                            response_text += part.text
            # Fallback: check if event has direct text attribute
            elif hasattr(event, 'text') and event.text:
                response_text += event.text
            
            # Track tool usage
            if hasattr(event, 'get_function_calls'):
                for fc in event.get_function_calls():
                    if hasattr(fc, 'name'):
                        tools_used.append(fc.name)
        
        # CONTEXTUAL APPROACH: Extract titles from AI response first
        # If the AI mentioned movies/series titles, show cards for them
        # This is true contextual understanding - no keyword matching needed
        import re
        msg_lower = message.lower()
        
        # Determine basic response type for metadata badge
        response_type = "text"
        if "recap" in msg_lower or "where did i leave" in msg_lower:
            response_type = "recap"
        elif "quiz" in msg_lower or "test me" in msg_lower:
            response_type = "quiz"
        
        # Build metadata with contentCards and suggestedReplies
        metadata: Dict[str, Any] = {}
        
        # ALWAYS try to extract titles from the AI response
        # If titles are found, we show cards (contextual detection)
        if response_text:
            try:
                from services import tmdb_service
                
                content_cards = []
                seen_ids = set()
                completed_titles = set()
                
                # Get user's completed shows to exclude them
                if user_context:
                    watch_history = user_context.get("watchHistory", [])
                    for item in watch_history:
                        if item.get("status") == "completed":
                            # Track by TMDB ID if available
                            if item.get("tmdbId"):
                                seen_ids.add(item["tmdbId"])
                            # Also track by title for fuzzy matching
                            if item.get("title"):
                                completed_titles.add(item["title"].lower().strip())
                
                # Parse [RECOMMENDATIONS] block from AI response
                # This is a structured JSON list of titles that the LLM outputs
                import json
                
                recommendations_pattern = r'\[RECOMMENDATIONS\]\s*(\[.*?\])\s*\[/RECOMMENDATIONS\]'
                rec_match = re.search(recommendations_pattern, response_text, re.DOTALL)
                
                extracted_titles = []
                
                if rec_match:
                    try:
                        # Parse the JSON array of titles
                        titles_json = rec_match.group(1)
                        extracted_titles = json.loads(titles_json)
                        print(f"[DEBUG] Parsed recommendations: {extracted_titles}")
                        
                        # Remove the [RECOMMENDATIONS] block from the displayed response
                        response_text = re.sub(recommendations_pattern, '', response_text).strip()
                    except json.JSONDecodeError as e:
                        print(f"[DEBUG] Failed to parse recommendations JSON: {e}")
                else:
                    print(f"[DEBUG] No [RECOMMENDATIONS] block found in response")
                
                # Search TMDB for each extracted title
                for title in extracted_titles[:6]:  # Limit to 6 for 3x2 grid
                    try:
                        results = await tmdb_service.search_multi(title)
                        if results.get("results"):
                            # Get the first matching result
                            for item in results["results"]:
                                if item.get("media_type") not in ["movie", "tv"]:
                                    continue
                                item_id = item.get("id")
                                if item_id in seen_ids:
                                    continue
                                
                                # Check if title matches a completed show
                                item_title = (item.get("title") or item.get("name") or "").lower().strip()
                                if item_title in completed_titles:
                                    continue
                                    
                                seen_ids.add(item_id)
                                
                                media_type = item.get("media_type", "movie")
                                content_cards.append({
                                    "id": item_id,
                                    "title": item.get("title") or item.get("name"),
                                    "overview": item.get("overview", "")[:200],
                                    "posterUrl": tmdb_service.get_poster_url(item.get("poster_path")),
                                    "backdropUrl": tmdb_service.get_backdrop_url(item.get("backdrop_path")),
                                    "rating": item.get("vote_average", 0),
                                    "year": (item.get("release_date") or item.get("first_air_date") or "")[:4],
                                    "type": "movie" if media_type == "movie" else "series",
                                    "genres": item.get("genre_ids", []),
                                })
                                break  # Take first match for this title
                    except Exception as search_err:
                        print(f"Failed to search for '{title}': {search_err}")
                        continue
                
                # Only show cards if we found recommendations - no fallback to trending
                print(f"[DEBUG] Found {len(content_cards)} content cards")
                
                metadata["contentCards"] = content_cards
                
                # CONTEXTUAL: If we found cards, this is a recommendation
                if content_cards:
                    response_type = "recommendation"
                    
            except Exception as e:
                print(f"Failed to fetch content cards: {e}")
        
        # Generate suggested replies based on whether we have content
        suggested_replies = []
        if metadata.get("contentCards"):
            suggested_replies = [
                {"label": "Show more", "icon": "plus"},
                {"label": "Something different", "icon": "shuffle"},
                {"label": "Tell me more", "icon": "info"},
            ]
        elif response_type == "recap":
            suggested_replies = [
                {"label": "Continue watching", "icon": "play"},
                {"label": "Similar shows", "icon": "grid"},
            ]
        elif response_type == "text":
            # Default chips for general conversation
            suggested_replies = [
                {"label": "Recommend something", "icon": "sparkles"},
                {"label": "What's trending?", "icon": "trending"},
            ]
        
        if suggested_replies:
            metadata["suggestedReplies"] = suggested_replies
        
        return {
            "response": response_text,
            "type": response_type,
            "toolsUsed": tools_used,
            "metadata": metadata,
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Agent error: {e}")
        return {
            "response": f"I encountered an issue processing your request. Please try again. Error: {str(e)}",
            "type": "text",
            "toolsUsed": [],
            "error": str(e),
        }
