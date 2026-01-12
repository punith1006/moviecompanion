import inspect
from google.adk import runners
from google.adk import agents

print("--- Searching for Message Type ---")

# Check runners module
print("\nIn google.adk.runners:")
for name, obj in inspect.getmembers(runners):
    if "Message" in name:
        print(f"Found candidate: {name} -> {obj}")

# Check agents module
print("\nIn google.adk.agents:")
for name, obj in inspect.getmembers(agents):
    if "Message" in name:
        print(f"Found candidate: {name} -> {obj}")

# Try generic import that often houses types
try:
    import google.adk.types
    print("\nIn google.adk.types:")
    for name, obj in inspect.getmembers(google.adk.types):
        if "Message" in name:
            print(f"Found candidate: {name} -> {obj}")
except ImportError:
    print("\ngoogle.adk.types not found")

print("\n--- End Search ---")
