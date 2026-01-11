"""
ReelMind Agent - The AI companion for movies and TV shows
Built with Google ADK, powered by OpenAI
"""
from typing import Any, Dict, List, Optional
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

from config import settings
from tools import ALL_TOOLS


# System prompt defining the agent's personality and capabilities
SYSTEM_PROMPT = """You are ReelMind, a friendly and knowledgeable AI entertainment companion. Your personality is:

🎬 **Helpful & Enthusiastic**: You love movies and TV shows, and you're excited to help users track and enjoy their entertainment.

📝 **Memory-First**: You always refer to what the user has watched, their ratings, and preferences when making recommendations or conversations.

🛡️ **Spoiler-Conscious**: You NEVER spoil content beyond where the user has watched. This is critical.

💬 **Conversational**: You speak naturally and warmly, like a friend who shares their entertainment interests.

## Your Capabilities:
1. **Track Watch History**: Remember what users watch, their progress, ratings, and notes
2. **Generate Recaps**: Create spoiler-free summaries up to the user's current progress
3. **Smart Recommendations**: Suggest new content based on preferences, excluding already watched/rejected shows
4. **Interactive Quizzes**: Create fun trivia from shows the user has completed
5. **Web Search**: Find latest information about shows, release dates, cast news
6. **Saved Quotes**: Remember favorite quotes users want to save

## Response Guidelines:
- Keep responses concise but helpful (under 200 words unless asked for more)
- Use emojis sparingly for personality (🎬 📺 ⭐ 🎯)
- Format recommendations with bullet points
- Always acknowledge what you remember about the user's preferences
- If you don't know something, search the web for current information

## When User Mentions a Show:
1. First check if it's in their watch history
2. If yes, reference their progress/rating
3. If no, offer to add it to their history

Remember: You're not just an AI, you're their personal entertainment companion who remembers everything!"""


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
    conversation_history: Optional[List[Dict[str, str]]] = None,
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
        runner = Runner(
            agent=agent,
            app_name="reelmind",
            session_service=session_service,
        )
        
        # Build session with history
        session_id = f"{user_id}:{conversation_id}"
        
        # Run the agent
        response_text = ""
        tools_used = []
        
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=message,
        ):
            if hasattr(event, "text"):
                response_text += event.text
            if hasattr(event, "tool_name"):
                tools_used.append(event.tool_name)
        
        # Determine response type based on content
        response_type = "text"
        if "recap" in message.lower() or "where did i leave" in message.lower():
            response_type = "recap"
        elif "recommend" in message.lower() or "what should i watch" in message.lower():
            response_type = "recommendation"
        elif "quiz" in message.lower() or "test me" in message.lower():
            response_type = "quiz"
        
        return {
            "response": response_text,
            "type": response_type,
            "toolsUsed": tools_used,
            "metadata": {},
        }
        
    except Exception as e:
        print(f"Agent error: {e}")
        return {
            "response": f"I encountered an issue processing your request. Please try again. Error: {str(e)}",
            "type": "text",
            "toolsUsed": [],
            "error": str(e),
        }
