import sys
try:
    from google.adk import types
    print("Types module contents:", dir(types))
except ImportError as e:
    print("Could not import google.adk.types:", e)

try:
    import google.adk
    print("Top level contents:", dir(google.adk))
except ImportError as e:
    print("Could not import google.adk:", e)
    
try:
    from google.adk.core import Message
    print("Found Message in core")
except ImportError:
    print("Message not in core")
    
try:
    from google.adk.types import Message
    print("Found Message in types")
except ImportError:
    print("Message not in types")
