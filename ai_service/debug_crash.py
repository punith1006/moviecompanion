import asyncio
import os
import sys

# Ensure we can import from local modules
sys.path.append(os.getcwd())

from agent.reelmind_agent import chat_with_agent

async def test_crash():
    print("--- Starting Crash Test ---")
    
    user_id = "test_user_123"
    conversation_id = "test_conv_456"
    message = "I watched The Bear S3"
    
    # Mock context based on debug logs
    user_context = {} 
    
    # Mock history (though function ignores it currently)
    history = [
        {
            'role': 'user', 
            'content': 'I watched The Bear S3',
            'timestamp': '2026-01-12T10:11:33.188Z',
            'metadata': {'type': 'text'}
        }
    ]

    print(f"Sending message: {message}")
    result = await chat_with_agent(
        message=message,
        user_id=user_id,
        conversation_id=conversation_id,
        user_context=user_context,
        conversation_history=history
    )
    
    print("--- Result ---")
    print(result)

if __name__ == "__main__":
    asyncio.run(test_crash())
