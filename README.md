# ReelMind - AI Entertainment Companion

A personalized companion agent that helps users track watched content, remember details, get recommendations, and engage with interactive activities.

## Project Structure

```
Series_Companion/
├── frontend/           # Next.js React frontend (port 3000)
├── backend/            # Node.js Express API (port 8000)
├── ai_service/         # Python FastAPI AI service (port 5000)
├── PRD.txt             # Product Requirements Document
├── DEVELOPMENT_PLAN.txt # 24-hour development plan
└── CRITICAL_ANALYSIS.txt # Gap analysis
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)
- API Keys: OpenAI, TMDB, Tavily (optional)

### 1. Setup Environment Files

**Backend (.env)**:
```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

**AI Service (.env)**:
```bash
cd ai_service
cp .env.example .env
# Add your OPENAI_API_KEY, TMDB_API_KEY, TAVILY_API_KEY
```

### 2. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend  
cd backend
npm install

# AI Service
cd ai_service
pip install -r requirements.txt
```

### 3. Start Services

**Terminal 1 - MongoDB** (if local):
```bash
mongod
```

**Terminal 2 - Backend**:
```bash
cd backend
npm run dev
# Runs on http://localhost:8000
```

**Terminal 3 - AI Service**:
```bash
cd ai_service
python main.py
# Runs on http://localhost:5000
```

**Terminal 4 - Frontend**:
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

## API Endpoints

### Backend (Node.js - Port 8000)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/history` - Get watch history
- `POST /api/history` - Add/update watch entry
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/conversations` - Get conversations

### AI Service (Python - Port 5000)
- `POST /chat` - Chat with ReelMind agent
- `POST /quiz/generate` - Generate quiz questions
- `POST /quiz/score` - Calculate quiz results
- `POST /recap` - Generate episode recap
- `GET /health` - Health check

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, shadcn/ui, Zustand, Framer Motion
- **Backend**: Node.js, Express, TypeScript, MongoDB, Socket.IO, JWT
- **AI Service**: Python, FastAPI, Google ADK, OpenAI, Tavily, TMDB API

## Features

1. **Watch History Memory** - Track shows, movies, progress, ratings
2. **AI-Powered Recaps** - Spoiler-free summaries up to your progress
3. **Smart Recommendations** - Personalized suggestions with negative filtering
4. **Conversational Interface** - Natural language chat with your companion
5. **Interactive Quizzes** - Trivia from completed shows with XP rewards
6. **Saved Quotes** - Remember favorite moments from shows
7. **Web Search** - Latest news, episode dates via Tavily
