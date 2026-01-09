from fastapi import APIRouter, HTTPException
from src.models import RecapRequest, RecapResponse

router = APIRouter()


@router.post("/recap", response_model=RecapResponse)
async def get_recap(request: RecapRequest):
    """Generate an episode recap for a TV show up to the user's current progress."""
    try:
        # For MVP, return a sample recap
        # In production, this would fetch from TMDb and generate via LLM
        
        return RecapResponse(
            showTitle="Sample Show",
            tldr=f"You're on Season {request.currentSeason}, Episode {request.currentEpisode}. The story so far involves major character developments and plot twists that set the stage for what's to come.",
            fullRecap=f"""**Season 1 - Season {request.currentSeason} Episode {request.currentEpisode - 1} Recap**

The series begins with our protagonist facing an unexpected challenge that changes everything. Through the seasons, we've witnessed:

• Character growth and transformation
• Major plot revelations
• Relationship dynamics evolving
• The central mystery deepening

Key characters have faced moral dilemmas, and alliances have shifted. The last episode ended on a cliffhanger that promises more excitement ahead.

*Note: This is a placeholder recap. Full AI-generated recaps coming soon!*"""
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
