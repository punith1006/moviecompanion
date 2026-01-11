"""
Quiz Tools - Generate trivia questions for shows/movies
"""
from typing import Any, Dict, List, Optional
import random
from openai import AsyncOpenAI
from config import settings


async def generate_quiz_questions(
    show_title: str,
    show_id: int,
    num_questions: int = 5,
    difficulty: str = "medium",
    user_progress: Optional[Dict[str, Any]] = None,
    saved_quotes: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """
    Generate trivia questions about a TV show or movie.
    
    Args:
        show_title: Name of the show/movie
        show_id: TMDB ID
        num_questions: Number of questions (1-10)
        difficulty: "easy", "medium", or "hard"
        user_progress: User's watch progress to avoid spoilers
        saved_quotes: User's saved quotes to include in quiz
    
    Returns:
        List of multiple choice questions with answers
    """
    try:
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        
        # Build context about progress to avoid spoilers
        progress_context = ""
        if user_progress:
            season = user_progress.get("season")
            episode = user_progress.get("episode")
            if season and episode:
                progress_context = f"\nIMPORTANT: The user has only watched up to Season {season}, Episode {episode}. Do NOT include any questions about events after this point."
        
        # Include quote-based questions if available
        quote_instruction = ""
        if saved_quotes and len(saved_quotes) > 0:
            quote_examples = random.sample(saved_quotes, min(2, len(saved_quotes)))
            quote_instruction = f"""
Include 1-2 "Who said this?" questions using these quotes the user saved:
{[f'"{q["quote"]}" - {q["character"]}' for q in quote_examples]}
"""
        
        difficulty_guidance = {
            "easy": "Questions should be about main characters, basic plot points, and well-known facts.",
            "medium": "Questions should cover supporting characters, specific plot details, and memorable moments.",
            "hard": "Questions should be challenging, covering minor details, production facts, and subtle references.",
        }
        
        prompt = f"""Generate {num_questions} trivia questions about "{show_title}" for a fan quiz.

Difficulty: {difficulty.upper()}
{difficulty_guidance.get(difficulty, "")}
{progress_context}
{quote_instruction}

Return a JSON array of questions. Each question should have:
- "question": The question text
- "options": Array of 4 possible answers
- "correct_index": Index of the correct answer (0-3)
- "fun_fact": A brief interesting fact related to the question

Example format:
[
  {{
    "question": "What is the name of the main character?",
    "options": ["John", "Mike", "Steve", "Tom"],
    "correct_index": 0,
    "fun_fact": "The character was originally going to be named something else."
  }}
]

Generate diverse question types: character names, plot events, quotes, locations, relationships.
Make options plausible - avoid obviously wrong answers.
Return ONLY valid JSON, no markdown or explanation."""

        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a TV/movie trivia expert. Generate engaging, accurate quiz questions. Always return valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=2000,
        )
        
        content = response.choices[0].message.content
        
        # Parse JSON from response
        import json
        
        # Clean potential markdown
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        questions = json.loads(content)
        
        # Calculate XP based on difficulty
        xp_per_question = {"easy": 10, "medium": 20, "hard": 30}
        
        return {
            "success": True,
            "show_title": show_title,
            "show_id": show_id,
            "difficulty": difficulty,
            "questions": questions,
            "xp_per_correct": xp_per_question.get(difficulty, 20),
            "total_possible_xp": xp_per_question.get(difficulty, 20) * len(questions),
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "questions": [],
        }


async def calculate_quiz_results(
    questions: List[Dict[str, Any]],
    user_answers: List[int],
    difficulty: str = "medium",
) -> Dict[str, Any]:
    """
    Calculate quiz results and XP earned.
    
    Args:
        questions: The quiz questions
        user_answers: User's selected answer indices
        difficulty: Quiz difficulty level
    
    Returns:
        Score, XP earned, and detailed results
    """
    xp_per_question = {"easy": 10, "medium": 20, "hard": 30}
    base_xp = xp_per_question.get(difficulty, 20)
    
    correct = 0
    results = []
    
    for i, (q, answer) in enumerate(zip(questions, user_answers)):
        is_correct = answer == q.get("correct_index")
        if is_correct:
            correct += 1
        
        results.append({
            "question": q.get("question"),
            "user_answer": q["options"][answer] if 0 <= answer < len(q["options"]) else "No answer",
            "correct_answer": q["options"][q.get("correct_index", 0)],
            "is_correct": is_correct,
            "fun_fact": q.get("fun_fact", ""),
        })
    
    score_pct = (correct / len(questions)) * 100 if questions else 0
    xp_earned = correct * base_xp
    
    # Bonus XP for perfect score
    if correct == len(questions) and len(questions) >= 5:
        xp_earned += 50  # Perfect score bonus
    
    return {
        "score": correct,
        "total": len(questions),
        "percentage": round(score_pct, 1),
        "xp_earned": xp_earned,
        "perfect_score": correct == len(questions),
        "results": results,
    }


QUIZ_TOOLS = [
    generate_quiz_questions,
    calculate_quiz_results,
]
