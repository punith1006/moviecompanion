# Movie & Series Companion Agent

> 🎬 A personalized AI companion that remembers your viewing history, provides contextual recaps, delivers non-repetitive recommendations, and engages you through interactive quizzes.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green?logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb)
![Google ADK](https://img.shields.io/badge/Google-ADK-red?logo=google)

## ✨ Features

- **📚 Viewing History Management** - Never forget what you've watched
- **🎯 Smart Recommendations** - Get personalized suggestions without repetition
- **📖 Contextual Recaps** - Quick episode summaries to jump back in
- **🎮 Interactive Quizzes** - Test your knowledge of your favorite shows
- **💬 Natural Conversations** - Multi-turn context-aware dialogue

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- MongoDB Atlas account (free tier)
- OpenAI API key
- TMDB API key

### Installation

1. **Clone and navigate to the project:**
   ```powershell
   cd c:\Users\Punith\Final_year_projects\Movie_Series_Companion
   ```

2. **Create virtual environment:**
   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

3. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```powershell
   Copy-Item .env.example .env
   # Edit .env with your API keys
   ```

5. **Run the application:**
   ```powershell
   python -m uvicorn backend.main:app --reload --port 8080
   ```

6. **Open the UI:**
   - Navigate to `http://localhost:8080` in your browser
   - Or use the API docs at `http://localhost:8080/docs`

## 🏗️ Project Structure

```
Movie_Series_Companion/
├── backend/
│   ├── agent/              # Google ADK agent definition
│   │   ├── companion_agent.py
│   │   ├── prompts.py
│   │   └── tools/          # Agent tools
│   ├── database/           # MongoDB integration
│   ├── services/           # External API services
│   └── main.py             # FastAPI entry point
├── frontend/               # Web UI
│   ├── index.html
│   ├── index.css
│   └── app.js
├── docs/                   # Documentation
├── requirements.txt
└── .env.example
```

## 🎮 Usage Examples

```
You: I just finished watching Breaking Bad
Agent: Great choice! Breaking Bad is an intense crime drama. 
       I've added it to your history. Want similar recommendations?

You: Yes, recommend something similar
Agent: Based on your love for Breaking Bad, try:
       1. Better Call Saul - Same universe, legal drama
       2. Ozark - Money laundering crime thriller
       3. The Wire - Gritty crime drama classic

You: What happened in Ozark?
Agent: Last time on Ozark (S4E10): Marty and Wendy faced the 
       cartel's ultimatum while Ruth made a devastating discovery...

You: Let's play a quiz!
Agent: 🎮 "I am the one who knocks." Who said this famous line?
```

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat` | POST | Send message to agent |
| `/history` | GET | Get user's watch history |
| `/recommendations` | GET | Get personalized recommendations |
| `/recap/{show_id}` | GET | Get show recap |
| `/quiz/start` | POST | Start a new quiz |

## 📄 License

MIT License - Built for educational purposes.

## 👨‍💻 Author

Final Year Capstone Project 2025-26
