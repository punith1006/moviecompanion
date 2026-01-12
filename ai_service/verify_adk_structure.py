import inspect
import google.adk.core
import google.adk.runners
import google.adk.models
import google.adk.types

def print_info(obj, name):
    print(f"\n--- {name} ---")
    try:
        print(f"Type: {type(obj)}")
        print(f"Doc: {obj.__doc__}")
        if inspect.isclass(obj):
             print(f"Init: {inspect.signature(obj.__init__)}")
        elif inspect.isfunction(obj) or inspect.ismethod(obj):
             print(f"Signature: {inspect.signature(obj)}")
    except Exception as e:
        print(f"Error inspecting {name}: {e}")

try:
    print_info(google.adk.core.Agent, "google.adk.core.Agent")
    print_info(google.adk.runners.Runner, "google.adk.runners.Runner")
    print_info(google.adk.runners.Runner.run_async, "google.adk.runners.Runner.run_async")
    
    # Check for Message type
    if hasattr(google.adk.types, "Message"):
        print_info(google.adk.types.Message, "google.adk.types.Message")
    else:
        print("google.adk.types.Message not found. Listing types:")
        print(dir(google.adk.types))

    # Check for ChatMessage or similar
    if hasattr(google.adk.types, "ChatMessage"):
        print_info(google.adk.types.ChatMessage, "google.adk.types.ChatMessage")

except Exception as e:
    print(f"General Error: {e}")
