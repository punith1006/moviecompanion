from google.adk.sessions import InMemorySessionService
import inspect

service = InMemorySessionService()
print("Attributes/Methods of InMemorySessionService:")
for name in dir(service):
    if not name.startswith("_"):
        print(name)

print("\nMethod details:")
try:
    if hasattr(service, 'create'):
        print("create:", inspect.signature(service.create))
    if hasattr(service, 'create_session'):
        print("create_session:", inspect.signature(service.create_session))
    if hasattr(service, 'get'):
        print("get:", inspect.signature(service.get))
except Exception as e:
    print(f"Error inspecting signatures: {e}")
