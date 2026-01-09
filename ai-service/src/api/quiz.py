from fastapi import APIRouter, HTTPException
from src.models import QuizRequest, QuizResponse, QuizQuestion

router = APIRouter()


@router.post("/quiz", response_model=QuizResponse)
async def get_quiz(request: QuizRequest):
    """Generate a quiz for a movie or TV show."""
    try:
        # For MVP, return sample quiz questions
        # In production, this would generate via LLM based on content
        
        sample_questions = [
            QuizQuestion(
                question="Who directed this production?",
                options=["Christopher Nolan", "Steven Spielberg", "Martin Scorsese", "Quentin Tarantino"],
                correctIndex=0,
                funFact="Christopher Nolan is known for his complex narratives and practical effects!"
            ),
            QuizQuestion(
                question="In what year was this released?",
                options=["2008", "2010", "2012", "2014"],
                correctIndex=2,
                funFact="2012 was a great year for cinema with many blockbusters released!"
            ),
            QuizQuestion(
                question="What is the main character's profession?",
                options=["Detective", "Teacher", "Doctor", "Architect"],
                correctIndex=3,
                funFact="The architectural themes play a significant role in the visual storytelling."
            ),
            QuizQuestion(
                question="Which actor plays the lead role?",
                options=["Tom Hanks", "Leonardo DiCaprio", "Brad Pitt", "Matt Damon"],
                correctIndex=1,
                funFact="This was one of the highest-grossing films of the actor's career!"
            ),
            QuizQuestion(
                question="What is the famous line from this production?",
                options=[
                    "I'll be back",
                    "May the force be with you",
                    "You need to wake up",
                    "Here's looking at you, kid"
                ],
                correctIndex=2,
                funFact="This line became iconic and is often referenced in pop culture."
            ),
        ]
        
        return QuizResponse(
            title=f"Quiz for Content #{request.contentId}",
            questions=sample_questions
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
