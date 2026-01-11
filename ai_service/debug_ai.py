import asyncio
import sys
import os

# Add current directory to path so imports work
sys.path.append(os.getcwd())

from agent.semantic_search import get_semantic_recommendations_impl

async def main():
    print("Running semantic search test...")
    try:
        result = await get_semantic_recommendations_impl("time travel")
        print("RESULT:", result)
    except Exception as e:
        print("CRITICAL ERROR:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
