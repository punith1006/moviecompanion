"""
Semantic Search Module
Uses LLM to interpret abstract descriptions and find matching content.
"""
import json
from typing import List, Dict, Any
from google.adk.models.lite_llm import LiteLlm
from config import settings
from tools import entertainment_tools

async def get_semantic_recommendations(description: str) -> Dict[str, Any]:
    """
    Get recommendations based on an abstract description.
    
    Args:
        description: User's abstract description (e.g. "movies about time travel")
        
    Returns:
        List of resolved content items
    """
    try:
        # Initialize LLM
        model = LiteLlm(
            model=f"openai/{settings.openai_model}",
            api_key=settings.openai_api_key,
        )
        
        # Construct Prompt
        prompt = f"""You are a movie and TV expert. The user is asking for recommendations based on this description:
"{description}"

Analyze the intent, mood, and specific elements.
Generate a list of 10 relevant Movies or TV Shows that best match this description.
Prioritize variety and high relevance.

Return ONLY a valid JSON array of objects. No markdown formatting.
Format:
[
  {{ "title": "Title Name", "year": "YYYY", "type": "movie|series", "reason": "Short reason why" }}
]
"""
        
        # generate() is async or sync? In ADK LiteLlm, generate is usually...
        # Let's check reelmind_agent.py usage. It uses it via Agent/Runner.
        # But LiteLlm class likely has generate method.
        # Assuming model.generate(prompts=[prompt])
        
        # Wait, ADK's LiteLlm wrapper might behave differently.
        # Let's assume standard behavior or use the chat interface if needed.
        # ADK Model interface usually has `predict` or `generate`.
        
        # Since I can't easily verify the ADK library internals without reading them, 
        # I'll try to use the `ask` or `generate` method.
        # If I look at `agent/reelmind_agent.py`, it passes usage to Agent.
        
        # Alternative: Use OpenAI directly if ADK is complex?
        # But I should stick to ADK structure.
        # Let's assume `model_response = await model.ask(prompt)` or similar.
        # Actually, I'll use a simple `chat` completion call logic if I can.
        
        # Let's look at `reelmind_agent.py` imports again.
        # `from google.adk.models.lite_llm import LiteLlm`
        # It doesn't show method usage.
        
        # Safest bet: Use `openai` library directly since `settings.openai_api_key` exists?
        # But `lite_llm` is installed.
        # I'll use `litellm` library directly for this helper to be safe and simple.
        # `import litellm`
        # `response = await litellm.acompletion(...)`
        
        pass

    except Exception as e:
        print(f"Semantic Search Error: {e}")
        return {"success": False, "error": str(e), "results": []}

# Re-writing the function to use litellm directly for simplicity
import litellm

async def get_semantic_recommendations_impl(description: str) -> Dict[str, Any]:
    try:
        completion = await litellm.acompletion(
            model=f"openai/{settings.openai_model}",
            api_key=settings.openai_api_key,
            messages=[
                {"role": "system", "content": "You are a movie expert. Output JSON only."},
                {"role": "user", "content": f"""Recommend 10 movies/series for: "{description}". 
Return ONLY a JSON array: [{{ "title": "Str", "type": "movie|series" }}]"""}
            ]
        )
        
        content = completion.choices[0].message.content
        print(f"DEBUG LLM CONTENT: {content}")

        # Clean markdown if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
            
        recommendations = json.loads(content.strip())
        
        results = []
        for item in recommendations:
            # Search TMDB for each
            rec_title = item.get("title")
            print(f"DEBUG SEARCHING: {rec_title}")
            search_res = await entertainment_tools.search_show(rec_title)
            print(f"DEBUG SEARCH RESULT: {search_res}")
            
            if search_res.get("success") and search_res.get("results"):
                # Find best match (matching type if possible)
                matches = search_res["results"]
                best_match = matches[0] # Default to first
                
                # Try to filter by type if specified
                req_type = item.get("type", "").lower()
                if req_type:
                    type_matches = [m for m in matches if m["type"] == req_type]
                    if type_matches:
                        best_match = type_matches[0]
                
                # Check for duplicates
                if not any(r["id"] == best_match["id"] for r in results):
                    results.append(best_match)
        
        return {
            "success": True,
            "results": results
        }
        
    except Exception as e:
        print(f"Semantic search error: {e}")
        return {"success": False, "error": str(e), "results": []}
