from .entertainment_tools import TOOLS as ENTERTAINMENT_TOOLS
from .quiz_tools import QUIZ_TOOLS, generate_quiz_questions, calculate_quiz_results
from .recap_tools import RECAP_TOOLS, generate_recap, generate_quick_reminder

# All available tools for the agent
ALL_TOOLS = ENTERTAINMENT_TOOLS + QUIZ_TOOLS + RECAP_TOOLS

__all__ = [
    "ALL_TOOLS",
    "ENTERTAINMENT_TOOLS",
    "QUIZ_TOOLS",
    "RECAP_TOOLS",
    "generate_quiz_questions",
    "calculate_quiz_results",
    "generate_recap",
    "generate_quick_reminder",
]
