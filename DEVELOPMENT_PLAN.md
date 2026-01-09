# CINEPAL - 24-HOUR DEVELOPMENT PLAN

**Generated**: January 9, 2026, 13:00 IST  
**Delivery Deadline**: January 10, 2026, 13:00 IST  
**Total Available Hours**: 24  
**Team Composition**: 3 AI Development Agents (Frontend, Backend, AI/ML)  
**Architecture Pattern**: Microservices (Next.js Frontend, Node.js Backend, Python AI Service)

---

## SECTION 1: EXECUTIVE SUMMARY

### 1.1 Project Scope

CinePal is a conversational AI entertainment companion that helps users discover movies/shows, track their watch history, receive personalized recommendations, and get AI-generated episode recaps. Built for college students and entertainment enthusiasts, it differentiates from competitors like Trakt/Letterboxd through its chat-first interface, persistent memory layer, and gamified quiz features.

### 1.2 Critical Success Path

**Primary Demo Flow: First-Time User Experience (FTUE)**
1. User lands on landing page → clicks "Start Chatting Free"
2. Quick conversational onboarding (3 favorite shows)
3. AI responds with personalized recommendations in <3 seconds
4. User adds item to watchlist or marks as watched
5. System confirms with personality ("I'll never recommend this again!")

This flow must work flawlessly as it demonstrates all core differentiators: conversational AI, memory, and personalized recommendations.

### 1.3 Development Philosophy

**Vertical Slice First**: Build the complete chat-to-recommendation flow through all layers (UI → Backend → AI → Database) before expanding to other features. This ensures core value is demonstrable early.

**API-First Development**: Define API contracts before implementation to enable parallel frontend/backend work.

**Stub External Dependencies**: TMDb and OpenAI integrations use stubs initially, replaced with real APIs once core flow works.

### 1.4 Phase-Gate Checkpoints

| Hour | Checkpoint | Validation |
|------|------------|------------|
| 2 | Foundation Complete | All projects scaffold, DB connected, auth skeleton |
| 6 | Backend APIs Ready | Auth + History + Watchlist CRUD working |
| 10 | AI Service Functional | Chat endpoint returns recommendations |
| 16 | Core UI Complete | Chat interface integrated with AI |
| 20 | Full Feature Parity | History, Watchlist, Quiz all functional |
| 24 | Demo Ready | Polished, tested, rehearsed |

### 1.5 Highest Risk Factors

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OpenAI API latency/failures | Medium | Critical | Pre-cached responses, streaming UI, fallback static recommendations |
| TMDb rate limiting | Medium | High | Aggressive caching, batch prefetch popular content |
| Chat flow integration complexity | High | Critical | Build simplest version first, enhance incrementally |
| MongoDB connection issues | Low | Critical | Use MongoDB Atlas, have local fallback |
| Frontend state management | Medium | Medium | Keep state simple, Zustand for minimal global state |

### 1.6 Scope Management Strategy

**Protected (Must Ship)**:
- Auth (login/register)
- Chat interface with AI recommendations
- Watch history (mark as watched)
- Content search via TMDb

**Flexible (Can Simplify)**:
- Watchlist → reduce to simple list without priorities
- Recaps → use pre-written summaries, not generated
- Quiz → 3 questions instead of 5

**Cuttable (If Behind)**:
- Episode progress tracking
- Streaming availability
- Quiz feature entirely
- Animations beyond basics

---

## SECTION 2: PHASE-BASED DEVELOPMENT PLAN

---

### PHASE 1: PROJECT FOUNDATION

**Timeframe**: Hour 0 to Hour 2  
**Duration**: 2 hours  
**Phase Objective**: Establish all project scaffolding, database connections, and authentication skeleton  
**Success Checkpoint**: All three services running, MongoDB connected, register/login endpoints return tokens

---

#### Phase 1 Task Breakdown

---

**TASK P1-01: Initialize Next.js Frontend Project**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P0: Blocking  
**Estimated Duration**: 30 minutes  
**Dependencies**: None

**Task Objective**: Create Next.js 14 project with App Router, Tailwind CSS, and core dependencies.

**Technical Specifications**:
```bash
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --no-eslint
cd frontend
npm install zustand @tanstack/react-query zod react-hook-form framer-motion lucide-react next-auth
npm install -D @types/node
npx shadcn@latest init
# Select: Default, Slate, CSS variables: Yes
npx shadcn@latest add button input card dialog
```

**File Structure**:
```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/register/page.tsx
│   │   ├── (dashboard)/layout.tsx
│   │   ├── (dashboard)/chat/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/ui/
│   ├── lib/api.ts
│   └── styles/globals.css
├── tailwind.config.ts
└── .env.local
```

**Acceptance Criteria**:
- [ ] `npm run dev` starts without errors on port 3000
- [ ] Tailwind CSS working (test with bg-violet-500 class)
- [ ] App router structure created
- [ ] Environment variables file created

---

**TASK P1-02: Configure Tailwind Design System**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P1: Critical  
**Estimated Duration**: 20 minutes  
**Dependencies**: P1-01

**Task Objective**: Implement PRD design system (colors, typography, spacing) in Tailwind config.

**Technical Specifications** (tailwind.config.ts):
```typescript
export default {
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f0d17',
          secondary: '#1a1625',
          tertiary: '#252033',
        },
        accent: {
          violet: '#8b5cf6',
          'violet-hover': '#a78bfa',
          rose: '#f43f5e',
        },
        text: {
          heading: '#ffffff',
          body: '#e2e1e7',
          muted: '#a09dab',
          disabled: '#6b6873',
        }
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
}
```

**Acceptance Criteria**:
- [ ] Custom colors accessible via `bg-bg-primary`, `text-accent-violet`, etc.
- [ ] Google Fonts (Outfit, Inter) loaded in layout.tsx
- [ ] globals.css has base dark background

---

**TASK P1-03: Initialize Node.js Backend Project**

**Assigned To**: Backend Engineer  
**Service**: Backend  
**Priority**: P0: Blocking  
**Estimated Duration**: 30 minutes  
**Dependencies**: None

**Task Objective**: Create Express.js TypeScript project with core middleware and structure.

**Technical Specifications**:
```bash
mkdir backend && cd backend
npm init -y
npm install express mongoose bcryptjs jsonwebtoken zod cors dotenv
npm install -D typescript @types/node @types/express @types/bcryptjs @types/jsonwebtoken ts-node-dev
npx tsc --init
```

**File Structure**:
```
backend/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   │   ├── database.ts
│   │   └── env.ts
│   └── index.ts
├── tsconfig.json
└── .env
```

**Acceptance Criteria**:
- [ ] `npm run dev` starts server on port 8000
- [ ] Health endpoint `GET /health` returns `{ status: 'ok' }`
- [ ] CORS configured for localhost:3000
- [ ] TypeScript compiles without errors

---

**TASK P1-04: Setup MongoDB Connection**

**Assigned To**: Backend Engineer  
**Service**: Backend  
**Priority**: P0: Blocking  
**Estimated Duration**: 20 minutes  
**Dependencies**: P1-03

**Task Objective**: Configure MongoDB connection using Mongoose with error handling.

**Technical Specifications** (src/config/database.ts):
```typescript
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};
```

**Acceptance Criteria**:
- [ ] Connection established to MongoDB Atlas
- [ ] Connection string in .env file
- [ ] Server logs "MongoDB connected" on startup
- [ ] Graceful error handling if connection fails

---

**TASK P1-05: Implement User Model**

**Assigned To**: Backend Engineer  
**Service**: Backend  
**Priority**: P0: Blocking  
**Estimated Duration**: 20 minutes  
**Dependencies**: P1-04

**Task Objective**: Create Mongoose User model with password hashing.

**Technical Specifications** (src/models/user.model.ts):
```typescript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  avatarUrl: { type: String }, // Profile avatar URL
  preferences: {
    favoriteGenres: [String],
    streamingServices: [String],
    contentRatings: [String], // e.g., ['PG-13', 'R']
  },
  quizStats: {
    totalCorrect: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastPlayed: { type: Date },
  },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('passwordHash')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
  next();
});

userSchema.methods.comparePassword = function(password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
```

**Acceptance Criteria**:
- [ ] User model compiles without errors
- [ ] Password automatically hashed on save
- [ ] Email field indexed for fast queries
- [ ] Timestamps (createdAt, updatedAt) auto-generated

---

**TASK P1-06: Implement Auth Endpoints**

**Assigned To**: Backend Engineer  
**Service**: Backend  
**Priority**: P0: Blocking  
**Estimated Duration**: 40 minutes  
**Dependencies**: P1-05

**Task Objective**: Create register, login, and token refresh endpoints.

**API Contracts**:

`POST /api/auth/register`
- Request: `{ email: string, password: string, name: string }`
- Response 201: `{ user: { id, email, name }, accessToken, refreshToken }`
- Errors: 400 (validation), 409 (email exists)

`POST /api/auth/login`
- Request: `{ email: string, password: string }`
- Response 200: `{ user: { id, email, name }, accessToken, refreshToken }`
- Errors: 401 (invalid credentials)

**Technical Specifications**:
- JWT access token: 15 minute expiry
- Refresh token: 7 day expiry
- Refresh token sent as httpOnly cookie
- Access token returned in response body

**Acceptance Criteria**:
- [ ] Register creates user and returns tokens
- [ ] Login validates password and returns tokens
- [ ] Duplicate email returns 409
- [ ] Invalid credentials return 401
- [ ] Zod validation on request bodies

---

**TASK P1-06B: Google OAuth Integration**

**Assigned To**: Backend Engineer  
**Service**: Backend  
**Priority**: P1: Critical  
**Estimated Duration**: 45 minutes  
**Dependencies**: P1-06

**Task Objective**: Implement Google OAuth 2.0 login as specified in PRD Feature 6.

**Technical Specifications**:
- Install: `npm install passport passport-google-oauth20 @types/passport @types/passport-google-oauth20`
- Configure Google Cloud Console OAuth credentials
- Create OAuth callback endpoint

**API Contracts**:

`GET /api/auth/google`
- Redirects to Google OAuth consent screen

`GET /api/auth/google/callback`
- Handles OAuth callback
- Creates/updates user with Google profile
- Returns tokens same as regular login

**Implementation** (src/config/passport.ts):
```typescript
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    let user = await User.findOne({ email: profile.emails?.[0].value });
    if (!user) {
      user = await User.create({
        email: profile.emails?.[0].value,
        name: profile.displayName,
        avatarUrl: profile.photos?.[0].value,
        passwordHash: 'OAUTH_USER', // Placeholder for OAuth users
      });
    }
    done(null, user);
  }
));
```

**Acceptance Criteria**:
- [ ] Google login button on frontend redirects to Google
- [ ] OAuth callback creates new user if not exists
- [ ] OAuth callback logs in existing user
- [ ] Returns same token format as email/password login
- [ ] User avatarUrl populated from Google profile

---

**TASK P1-07: Initialize Python AI Service**

**Assigned To**: AI/ML Engineer  
**Service**: AI Service  
**Priority**: P0: Blocking  
**Estimated Duration**: 30 minutes  
**Dependencies**: None

**Task Objective**: Create FastAPI project with basic structure and health endpoint.

**Technical Specifications**:
```bash
mkdir ai-service && cd ai-service
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install fastapi uvicorn python-dotenv httpx openai pydantic
```

**File Structure**:
```
ai-service/
├── src/
│   ├── api/
│   │   ├── chat.py
│   │   ├── recommendations.py
│   │   └── recaps.py
│   ├── services/
│   │   ├── llm_service.py
│   │   └── tmdb_service.py
│   ├── config/
│   │   └── settings.py
│   └── main.py
├── requirements.txt
└── .env
```

**Acceptance Criteria**:
- [ ] `uvicorn src.main:app --reload` starts on port 5000
- [ ] Health endpoint `GET /health` returns `{ status: 'ok' }`
- [ ] OpenAPI docs available at /docs
- [ ] Environment variables loaded

---

#### Phase 1 Exit Criteria

- [ ] All 3 services running simultaneously (ports 3000, 8000, 5000)
- [ ] MongoDB connection established
- [ ] Register/Login endpoints functional
- [ ] All projects compile without errors

---

### PHASE 2: CORE BACKEND APIS

**Timeframe**: Hour 2 to Hour 6  
**Duration**: 4 hours  
**Phase Objective**: Complete all backend CRUD endpoints for history, watchlist, and content proxy  
**Success Checkpoint**: All API endpoints testable via curl/Postman, auth middleware protecting routes

---

#### Phase 2 Task Breakdown

---

**TASK P2-01: Auth Middleware**

**Assigned To**: Backend Engineer  
**Service**: Backend  
**Priority**: P0: Blocking  
**Estimated Duration**: 30 minutes  
**Dependencies**: P1-06

**Task Objective**: Create JWT verification middleware for protected routes.

**Technical Specifications** (src/middleware/auth.middleware.ts):
```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Acceptance Criteria**:
- [ ] Valid token allows request to proceed
- [ ] Missing token returns 401
- [ ] Expired/invalid token returns 401
- [ ] User ID attached to request object

---

**TASK P2-02: WatchHistory Model**

**Assigned To**: Backend Engineer  
**Service**: Backend  
**Priority**: P0: Blocking  
**Estimated Duration**: 20 minutes  
**Dependencies**: P1-04

**Task Objective**: Create Mongoose model for watch history with proper indexing.

**Technical Specifications** (src/models/watchHistory.model.ts):
```typescript
const watchHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contentId: { type: String, required: true }, // TMDb ID
  contentType: { type: String, enum: ['movie', 'tv'], required: true },
  status: { type: String, enum: ['watched', 'watching', 'dropped', 'not_interested'], required: true },
  rating: { type: Number, min: 1, max: 10 },
  episodeProgress: {
    season: Number,
    episode: Number,
  },
  title: String, // Cached from TMDb
  posterPath: String, // Cached from TMDb
}, { timestamps: true });

watchHistorySchema.index({ userId: 1, contentId: 1 }, { unique: true });
```

**Acceptance Criteria**:
- [ ] Compound index on userId + contentId prevents duplicates
- [ ] All enum values enforced
- [ ] Timestamps auto-generated

---

**TASK P2-03: WatchHistory CRUD Endpoints**

**Assigned To**: Backend Engineer  
**Service**: Backend  
**Priority**: P0: Blocking  
**Estimated Duration**: 60 minutes  
**Dependencies**: P2-01, P2-02

**Task Objective**: Implement full CRUD for watch history.

**API Contracts**:

`GET /api/history` (authenticated)
- Query: `?status=watched&page=1&limit=20`
- Response: `{ items: WatchHistory[], total: number, page: number }`

`POST /api/history` (authenticated)
- Request: `{ contentId, contentType, status, title?, posterPath? }`
- Response 201: Created item

`PUT /api/history/:id` (authenticated)
- Request: Partial fields
- Response 200: Updated item

`DELETE /api/history/:id` (authenticated)
- Response 204: No content

**Acceptance Criteria**:
- [ ] Pagination working with default 20 items per page
- [ ] Filter by status functional
- [ ] Can't modify another user's history items
- [ ] Upsert behavior if contentId already exists for user

---

**TASK P2-04: Watchlist Model & Endpoints**

**Assigned To**: Backend Engineer  
**Service**: Backend  
**Priority**: P1: Critical  
**Estimated Duration**: 45 minutes  
**Dependencies**: P2-01

**Task Objective**: Implement watchlist with priority levels.

**API Contracts**:

`GET /api/watchlist` (authenticated)
- Response: `{ items: Watchlist[] }`

`POST /api/watchlist` (authenticated)
- Request: `{ contentId, contentType, priority, title?, posterPath? }`
- Response 201: Created item

`DELETE /api/watchlist/:id` (authenticated)
- Response 204: No content

**Acceptance Criteria**:
- [ ] Priority field with enum values
- [ ] User can only access own watchlist
- [ ] Duplicate prevention

---

**TASK P2-05: TMDb Proxy Service**

**Assigned To**: Backend Engineer  
**Service**: Backend  
**Priority**: P1: Critical  
**Estimated Duration**: 45 minutes  
**Dependencies**: P1-03

**Task Objective**: Create proxy endpoints for TMDb API to hide API key and add caching.

**API Contracts**:

`GET /api/content/search?q=query&type=movie|tv`
- Response: `{ results: ContentItem[] }`

`GET /api/content/:type/:id`
- Response: Full content details

**Technical Specifications**:
- Fetch from TMDb API with Bearer token
- Transform response to match our ContentItem interface
- Cache popular content in memory (simple Map for MVP)

**Acceptance Criteria**:
- [ ] TMDb API key not exposed to frontend
- [ ] Search returns movies/shows with poster, title, year
- [ ] Detail endpoint returns full info
- [ ] Fallback response if TMDb unavailable

---

**TASK P2-06: AI Service Proxy Route**

**Assigned To**: Backend Engineer  
**Service**: Backend  
**Priority**: P0: Blocking  
**Estimated Duration**: 30 minutes  
**Dependencies**: P2-01

**Task Objective**: Create proxy endpoint that forwards chat requests to AI service with user context.

**API Contract**:

`POST /api/ai/chat` (authenticated)
- Request: `{ message: string }`
- Response: `{ response: string, recommendations?: ContentItem[] }`

**Technical Specifications**:
- Fetch user's watch history from DB
- Attach to request body sent to Python AI service
- Forward response back to client

**Acceptance Criteria**:
- [ ] User history included in AI request
- [ ] Properly forwards streaming responses (if implemented)
- [ ] Error handling if AI service down

---

#### Phase 2 Exit Criteria

- [ ] All CRUD endpoints tested via Postman/curl
- [ ] Auth middleware protecting all routes
- [ ] TMDb search returning results
- [ ] AI proxy route created (even if AI service not complete)

---

### PHASE 3: AI SERVICE IMPLEMENTATION

**Timeframe**: Hour 6 to Hour 10  
**Duration**: 4 hours  
**Phase Objective**: Implement conversational AI chat, recommendations, and recap generation  
**Success Checkpoint**: Chat endpoint returns contextual recommendations based on user history

---

#### Phase 3 Task Breakdown

---

**TASK P3-01: TMDb Service Client**

**Assigned To**: AI/ML Engineer  
**Service**: AI Service  
**Priority**: P1: Critical  
**Estimated Duration**: 45 minutes  
**Dependencies**: P1-07

**Task Objective**: Create async TMDb API client for fetching content data.

**Technical Specifications** (src/services/tmdb_service.py):
```python
import httpx
from config.settings import settings

class TMDbService:
    BASE_URL = "https://api.themoviedb.org/3"
    
    async def search(self, query: str, content_type: str = "multi"):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/search/{content_type}",
                params={"query": query},
                headers={"Authorization": f"Bearer {settings.TMDB_API_KEY}"}
            )
            return response.json()["results"][:10]
    
    async def get_details(self, content_id: int, content_type: str):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/{content_type}/{content_id}",
                headers={"Authorization": f"Bearer {settings.TMDB_API_KEY}"}
            )
            return response.json()
```

**Acceptance Criteria**:
- [ ] Search returns up to 10 results
- [ ] Details returns full movie/show info
- [ ] Error handling for API failures

---

**TASK P3-02: LLM Service Client**

**Assigned To**: AI/ML Engineer  
**Service**: AI Service  
**Priority**: P0: Blocking  
**Estimated Duration**: 45 minutes  
**Dependencies**: P1-07

**Task Objective**: Create OpenAI/Claude API client with structured prompts.

**Technical Specifications** (src/services/llm_service.py):
```python
from openai import AsyncOpenAI
from config.settings import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def get_recommendations(user_message: str, watch_history: list, preferences: dict):
    system_prompt = f"""You are CinePal, a friendly AI movie/TV companion.
    
User's watch history: {[h['title'] for h in watch_history]}
User's preferences: {preferences}

Based on this context, recommend 3-5 movies/TV shows the user would enjoy.
Avoid recommending anything they've already watched.
Format: For each recommendation, provide title, year, and a brief personalized reason.
Be conversational and warm."""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        max_tokens=500,
        temperature=0.7
    )
    return response.choices[0].message.content
```

**Acceptance Criteria**:
- [ ] API call returns response within 5 seconds
- [ ] Context includes user history
- [ ] Error handling for rate limits

---

**TASK P3-03: Chat Endpoint**

**Assigned To**: AI/ML Engineer  
**Service**: AI Service  
**Priority**: P0: Blocking  
**Estimated Duration**: 60 minutes  
**Dependencies**: P3-01, P3-02

**Task Objective**: Create main chat endpoint that combines LLM response with TMDb data.

**API Contract**:

`POST /api/chat`
- Request: `{ message: string, history: WatchHistory[], preferences: dict }`
- Response: `{ response: string, recommendations: ContentItem[] }`

**Technical Specifications** (src/api/chat.py):
```python
from fastapi import APIRouter
from pydantic import BaseModel
from services.llm_service import get_recommendations
from services.tmdb_service import TMDbService

router = APIRouter()
tmdb = TMDbService()

class ChatRequest(BaseModel):
    message: str
    history: list = []
    preferences: dict = {}

@router.post("/chat")
async def chat(request: ChatRequest):
    # Get LLM response
    llm_response = await get_recommendations(
        request.message, 
        request.history, 
        request.preferences
    )
    
    # Extract movie names and fetch from TMDb
    # (Parse LLM response or use structured output)
    
    return {
        "response": llm_response,
        "recommendations": []  # Enhanced with TMDb data
    }
```

**Acceptance Criteria**:
- [ ] Returns personalized response based on history
- [ ] Recommendations include poster URLs
- [ ] Response time <5 seconds
- [ ] Graceful fallback if LLM unavailable

---

**TASK P3-04: Recap Endpoint**

**Assigned To**: AI/ML Engineer  
**Service**: AI Service  
**Priority**: P1: Critical  
**Estimated Duration**: 60 minutes  
**Dependencies**: P3-01, P3-02

**Task Objective**: Generate episode recaps using LLM and TMDb episode data.

**API Contract**:

`POST /api/recap`
- Request: `{ showId: string, currentSeason: number, currentEpisode: number }`
- Response: `{ tldr: string, fullRecap: string }`

**Technical Specifications**:
1. Fetch show info from TMDb
2. Fetch episode list up to current episode
3. Generate recap via LLM with spoiler awareness 
4. Return structured recap with TL;DR option

**Acceptance Criteria**:
- [ ] No spoilers beyond current episode
- [ ] TL;DR ≤3 sentences
- [ ] Full recap covers key plot points
- [ ] Cache recaps per show/episode combo

---

**TASK P3-05: Quiz Generation Endpoint**

**Assigned To**: AI/ML Engineer  
**Service**: AI Service  
**Priority**: P2: Important  
**Estimated Duration**: 45 minutes  
**Dependencies**: P3-02

**Task Objective**: Generate quiz questions based on watched content.

**API Contract**:

`POST /api/quiz`
- Request: `{ contentId: string, contentType: string }`
- Response: `{ questions: QuizQuestion[] }`

**Technical Specifications**:
```python
class QuizQuestion(BaseModel):
    question: str
    options: list[str]  # 4 options
    correctIndex: int
    funFact: str
```

**Acceptance Criteria**:
- [ ] 5 questions per quiz
- [ ] Mix of character, plot, quote questions
- [ ] Fun facts for wrong answers
- [ ] Pre-generate popular show quizzes

---

#### Phase 3 Exit Criteria

- [ ] Chat endpoint returns recommendations
- [ ] Recap endpoint generates summaries
- [ ]Quiz endpoint creates questions
- [ ] All endpoints documented in /docs

---

### PHASE 4: FRONTEND CORE UI

**Timeframe**: Hour 10 to Hour 16  
**Duration**: 6 hours  
**Phase Objective**: Build complete chat interface, auth flows, and integrate with backend  
**Success Checkpoint**: User can register, login, chat with AI, and receive recommendations

---

#### Phase 4 Task Breakdown

---

**TASK P4-01: Base UI Components**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P0: Blocking  
**Estimated Duration**: 60 minutes  
**Dependencies**: P1-02

**Task Objective**: Create reusable UI components following design system.

**Components to Build**:
- Button (variants: primary, secondary, ghost, destructive)
- Input (with focus states, error states)
- Card (content cards, chat bubbles)
- Modal (with animation)
- Loading spinner
- Skeleton loader
- Avatar

**Technical Specifications**:
- Use CSS modules or Tailwind classes
- All components accept className for extension
- Implement hover/focus/active states per design system

**Acceptance Criteria**:
- [ ] All components render without errors
- [ ] Violet accent color applied correctly
- [ ] Hover lift animation on cards
- [ ] Loading spinner uses violet color

---

**TASK P4-02: Auth Forms (Login/Register)**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P0: Blocking  
**Estimated Duration**: 60 minutes  
**Dependencies**: P4-01

**Task Objective**: Create login and registration forms with validation.

**Technical Specifications**:
- React Hook Form for form handling
- Zod schema for validation
- Show password strength indicator on register
- Error messages display below fields
- Success redirects to /chat

**Files**:
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/lib/validations/auth.ts`

**Acceptance Criteria**:
- [ ] Email validation (format check)
- [ ] Password minimum 8 characters
- [ ] Error from API displayed
- [ ] Loading state on submit button
- [ ] Redirect to chat on success

---

**TASK P4-03: Auth Context & API Client**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P0: Blocking  
**Estimated Duration**: 45 minutes  
**Dependencies**: P4-02

**Task Objective**: Create auth context for storing user state and API client with auth headers.

**Technical Specifications** (src/lib/auth.tsx):
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      login: async (email, password) => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        set({ user: data.user, accessToken: data.accessToken });
      },
      logout: () => set({ user: null, accessToken: null }),
    }),
    { name: 'auth-storage' }
  )
);
```

**Acceptance Criteria**:
- [ ] Auth state persisted to localStorage
- [ ] API client attaches Bearer token
- [ ] Logout clears stored state
- [ ] Protected routes redirect to login

---

**TASK P4-04: Chat Interface - Message List**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P0: Blocking  
**Estimated Duration**: 90 minutes  
**Dependencies**: P4-01, P4-03

**Task Objective**: Build the core chat UI with message bubbles and scroll behavior.

**Components**:
- ChatContainer (manages scroll, layout)
- MessageBubble (user vs AI styling)
- TypingIndicator (bouncing dots)
- RecommendationCard (poster, title, actions)

**Technical Specifications**:
- User messages: Violet background, right-aligned
- AI messages: Secondary background, left-aligned
- Auto-scroll to bottom on new messages
- Recommendation cards rendered inline in AI messages

**UI Details from PRD**:
- Chat bubbles: 12px radius
- Poster images: 100x150px in cards
- Quick action buttons: Add to Watchlist, Mark Watched, Not Interested

**Acceptance Criteria**:
- [ ] Messages display correctly styled
- [ ] New messages appear at bottom
- [ ] Typing indicator shows while waiting for AI
- [ ] Recommendation cards show poster and actions

---

**TASK P4-05: Chat Interface - Input & Send**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P0: Blocking  
**Estimated Duration**: 60 minutes  
**Dependencies**: P4-04

**Task Objective**: Build chat input with send functionality and API integration.

**Technical Specifications**:
- Fixed position at bottom
- Enter to send, Shift+Enter for newline
- Send button with airplane icon
- Loading state while waiting for response
- Example prompts shown when empty

**API Integration**:
```typescript
const sendMessage = async (message: string) => {
  setIsLoading(true);
  addMessage({ role: 'user', content: message });
  
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message }),
  });
  
  const data = await response.json();
  addMessage({ 
    role: 'assistant', 
    content: data.response,
    recommendations: data.recommendations 
  });
  setIsLoading(false);
};
```

**Acceptance Criteria**:
- [ ] Message sent on Enter key
- [ ] Input clears after send
- [ ] Loading indicator during AI response
- [ ] Error handling if API fails

---

**TASK P4-06: Dashboard Layout**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P1: Critical  
**Estimated Duration**: 45 minutes  
**Dependencies**: P4-01

**Task Objective**: Create dashboard layout with sidebar navigation.

**Components**:
- Sidebar (desktop: fixed left, mobile: slide-over)
- Header (logo, user avatar, logout)
- MainContent (children)

**Navigation Items**:
- Chat (primary)
- Watchlist
- History
- Quiz
- Settings

**Technical Specifications**:
- Sidebar: 240px fixed width on desktop
- Mobile: Hamburger menu, slide-over drawer
- Active route highlighted with violet

**Acceptance Criteria**:
- [ ] Sidebar visible on desktop
- [ ] Mobile menu functional
- [ ] Active route highlighted
- [ ] User avatar in header

---

**TASK P4-07: Landing Page**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P1: Critical  
**Estimated Duration**: 45 minutes  
**Dependencies**: P4-01

**Task Objective**: Create marketing landing page with CTA.

**Hero Section**:
- Headline: "Your AI Entertainment Companion"
- Subheadline: "Tell me what you love—I'll remember forever."
- CTA: "Start Chatting Free"
- Background: Dark gradient with floating poster mockup

**Technical Specifications**:
- Framer Motion entrance animations
- Floating movie posters (3-4 images)
- Responsive: Stack vertically on mobile

**Acceptance Criteria**:
- [ ] Hero displays with gradient background
- [ ] CTA links to /register
- [ ] Animations smooth at 60fps
- [ ] Mobile-responsive

---

**TASK P4-08: Onboarding Flow**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P0: Blocking  
**Estimated Duration**: 45 minutes  
**Dependencies**: P4-05

**Task Objective**: Create conversational onboarding as specified in PRD FTUE (Section 3.2).

**User Flow**:
1. After registration, redirect to chat with onboarding mode
2. AI asks: "Let's get to know your taste! Tell me 3 movies or shows you love."
3. User types show names (autocomplete suggestions)
4. Store favorites in user preferences
5. AI responds with first personalized recommendations

**Technical Specifications**:
- `src/app/(dashboard)/chat/page.tsx` - detect first-time user (empty history)
- Autocomplete component for show selection
- API call to update user preferences
- Transition to normal chat after 3 selections

**Acceptance Criteria**:
- [ ] First-time users see onboarding prompt
- [ ] Autocomplete helps find shows
- [ ] Preferences saved to user profile
- [ ] Personalized recommendations after onboarding
- [ ] Can skip onboarding if desired

---

**TASK P4-09: Search Component with Autocomplete**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P1: Critical  
**Estimated Duration**: 60 minutes  
**Dependencies**: P4-01

**Task Objective**: Create search component with 300ms debounced autocomplete as per PRD Feature 4.

**Technical Specifications**:
- Debounce search input (300ms delay)
- Display autocomplete dropdown with results
- Show cover art thumbnails (60x90px)
- Clear distinction between movies/TV shows via badge
- Click to open Content Detail Modal
- Empty state shows trending content

**Components**:
- `src/components/search/SearchBar.tsx`
- `src/components/search/SearchResults.tsx`
- `src/components/search/SearchResultItem.tsx`

**Implementation**:
```typescript
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 300);

const { data: results } = useQuery({
  queryKey: ['search', debouncedQuery],
  queryFn: () => searchContent(debouncedQuery),
  enabled: debouncedQuery.length > 2,
});
```

**Acceptance Criteria**:
- [ ] Search triggers after 300ms of no typing
- [ ] Results appear in dropdown
- [ ] Movies/TV shows visually distinguished
- [ ] Click opens detail modal
- [ ] Keyboard navigation (arrow keys, Enter)
- [ ] Empty query shows trending suggestions

---

**TASK P4-10: Homepage with Recommendations Carousel**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P1: Critical  
**Estimated Duration**: 60 minutes  
**Dependencies**: P4-01, P2-06

**Task Objective**: Create dashboard homepage with "Recommended for You" carousel as per PRD Feature 5.

**Technical Specifications**:
- Displayed when user navigates to /dashboard or /
- Horizontal scrollable carousel (6-10 recommendations)
- Each card shows: poster, title, year, "Why this?" tooltip
- Quick actions: Add to Watchlist, Dismiss, More Like This
- Refresh button to get new recommendations

**Components**:
- `src/app/(dashboard)/page.tsx` - Homepage
- `src/components/recommendations/RecommendationsCarousel.tsx`
- `src/components/recommendations/RecommendationCard.tsx`

**UI Specifications from PRD**:
- Large cover art (200x300px)
- "Why this?" dropdown showing reasoning
- Hover: lift animation + shadow
- Dismiss X button in corner

**Acceptance Criteria**:
- [ ] Carousel displays on homepage
- [ ] Recommendations personalized to user
- [ ] "Why this?" shows recommendation reason
- [ ] Quick actions functional
- [ ] Refresh loads new recommendations
- [ ] Excludes watched/rejected content

---

#### Phase 4 Exit Criteria

- [ ] User can register and login (including Google OAuth)
- [ ] Onboarding flow collects preferences
- [ ] Chat interface functional
- [ ] AI recommendations display with posters
- [ ] Quick actions trigger API calls
- [ ] Dashboard navigation working
- [ ] Search with autocomplete working
- [ ] Homepage recommendations carousel functional

---

### PHASE 5: REMAINING FEATURES

**Timeframe**: Hour 16 to Hour 20  
**Duration**: 4 hours  
**Phase Objective**: Complete history page, watchlist page, and quiz feature  
**Success Checkpoint**: All SHOULD-HAVE features functional

---

#### Phase 5 Task Breakdown

---

**TASK P5-01: History Page**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P1: Critical  
**Estimated Duration**: 60 minutes  
**Dependencies**: P4-06

**Task Objective**: Display user's watch history with filtering.

**Features**:
- Grid of content cards
- Filter by status (Watched, Watching, Dropped, Not Interested)
- Filter by genre (extracted from content metadata)
- Filter by date added
- Shows episode progress for TV shows
- Swipe-to-mark on mobile for quick status changes
- Click to view details or get recap

**Technical Specifications**:
- Fetch from /api/history on mount
- Use TanStack Query for caching
- Empty state with CTA to chat
- Touch gesture support via `@use-gesture/react`

**Acceptance Criteria**:
- [ ] History items display in grid
- [ ] Filter by status functional
- [ ] Filter by genre functional
- [ ] Filter by date added functional
- [ ] Episode progress shows for TV
- [ ] Swipe gestures work on mobile
- [ ] Empty state encourages discovery

---

**TASK P5-02: Watchlist Page**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P1: Critical  
**Estimated Duration**: 45 minutes  
**Dependencies**: P4-06

**Task Objective**: Display and manage watchlist.

**Features**:
- Grid of watchlist items
- Priority badges (Must Watch, Interested, Maybe)
- Remove button
- Empty state with encouragement

**Acceptance Criteria**:
- [ ] Watchlist displays correctly
- [ ] Remove button works
- [ ] Priority visually indicated
- [ ] Empty state shows

---

**TASK P5-03: Content Detail Modal**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P1: Critical  
**Estimated Duration**: 45 minutes  
**Dependencies**: P4-01

**Task Objective**: Create modal for viewing full content details.

**Content**:
- Large poster
- Title, year, rating
- Synopsis
- Cast list
- **Streaming availability (required per PRD Feature 9)**
- Action buttons (Add to Watchlist, Mark Watched)
- Get Recap button (for TV shows)

**Streaming Availability Section**:
- Show logos of available streaming platforms
- Deep links to streaming apps where possible
- Region-aware (user region from preferences or IP)
- "Where to Watch" section with platform icons

**Technical Specifications**:
- Fetch details from /api/content/:type/:id
- Fetch streaming data from /api/content/:type/:id/availability
- Framer Motion modal animation
- Close on backdrop click or ESC

**Acceptance Criteria**:
- [ ] Modal opens with animation
- [ ] All content details display
- [ ] Streaming platforms displayed with logos
- [ ] Platform links are clickable
- [ ] Actions update state
- [ ] Recap button for TV shows

---

**TASK P5-04: Quiz Page**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P2: Important  
**Estimated Duration**: 60 minutes  
**Dependencies**: P4-06

**Task Objective**: Create interactive quiz experience.

**Flow**:
1. Select show from watch history
2. Start quiz (5 questions)
3. Multiple choice answers
4. Feedback on each answer
5. Final score with streak

**Components**:
- QuizSelector (choose show)
- QuizQuestion (question + 4 options)
- QuizResult (score, streak, fun facts)

**Technical Specifications**:
- Fetch quiz from /api/quiz
- Animate correct (green check) / incorrect (red X)
- Post score to backend for streak tracking

**Acceptance Criteria**:
- [ ] Can select show for quiz
- [ ] Questions display correctly
- [ ] Immediate feedback on answers
- [ ] Final score displays
- [ ] Streak counter updates

---

**TASK P5-05: Recap Modal**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P1: Critical  
**Estimated Duration**: 45 minutes  
**Dependencies**: P5-03

**Task Objective**: Display AI-generated recap in modal.

**Features**:
- TL;DR mode (default)
- Full Recap toggle
- Loading state while generating
- Character tooltips (future)

**Technical Specifications**:
- POST to /api/ai/recap
- Loading skeleton while generating
- Toggle between TL;DR and full

**Acceptance Criteria**:
- [ ] Recap fetches correctly
- [ ] TL;DR shows 2-3 sentences
- [ ] Full recap expands
- [ ] Loading state displays

---

**TASK P5-06: Settings Page**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P2: Important  
**Estimated Duration**: 45 minutes  
**Dependencies**: P4-06

**Task Objective**: Create settings page for user profile and preferences.

**Features**:
- Edit display name
- Change avatar (upload or URL)
- Manage streaming services (for availability filtering)
- Content rating preferences
- Dark/Light mode toggle (default: dark)
- Notification preferences (future)

**Technical Specifications**:
- `src/app/(dashboard)/settings/page.tsx`
- Form with React Hook Form
- PUT to /api/user/preferences

**Acceptance Criteria**:
- [ ] Can update display name
- [ ] Can update avatar
- [ ] Streaming services selectable
- [ ] Preferences persist

---

**TASK P5-07: Streaming Availability Backend**

**Assigned To**: Backend Engineer  
**Service**: Backend  
**Priority**: P1: Critical  
**Estimated Duration**: 45 minutes  
**Dependencies**: P2-05

**Task Objective**: Add streaming availability endpoint using JustWatch/TMDb data.

**API Contract**:

`GET /api/content/:type/:id/availability` (authenticated)
- Query: `?region=US`
- Response: `{ providers: [{ name, logo, type: 'stream'|'rent'|'buy', link }] }`

**Technical Specifications**:
- Use TMDb /watch/providers endpoint
- Cache results for 24 hours
- Support major regions: US, UK, IN, CA

**Acceptance Criteria**:
- [ ] Returns streaming platforms for content
- [ ] Region filtering works
- [ ] Cached to avoid rate limits

---

#### Phase 5 Exit Criteria

- [ ] History page shows all watched content with filters
- [ ] Watchlist page manages saved items
- [ ] Content detail modal with streaming availability
- [ ] Quiz feature playable
- [ ] Recap modal working
- [ ] Settings page functional
- [ ] Streaming availability integrated

---

### PHASE 6: POLISH & DEMO PREP

**Timeframe**: Hour 20 to Hour 24  
**Duration**: 4 hours  
**Phase Objective**: Add animations, fix bugs, prepare demo flow  
**Success Checkpoint**: Smooth demo experience, no critical bugs

---

#### Phase 6 Task Breakdown

---

**TASK P6-01: Animation Polish**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P2: Important  
**Estimated Duration**: 60 minutes  
**Dependencies**: P5-05

**Task Objective**: Add micro-interactions and animations per PRD.

**Animations to Add**:
- Card hover: lift (translateY -4px) + shadow
- Button hover: subtle glow
- Page transitions: fade + slide (200ms)
- Success checkmark: draw animation
- Typing indicator: bouncing dots

**Technical Specifications**:
- Framer Motion for complex animations
- CSS transitions for simple hover states
- respects prefers-reduced-motion

**Acceptance Criteria**:
- [ ] Card hover animations smooth
- [ ] Page transitions implemented
- [ ] Success animations visible
- [ ] No janky animations

---

**TASK P6-02: Error State Handling**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P1: Critical  
**Estimated Duration**: 45 minutes  
**Dependencies**: All frontend tasks

**Task Objective**: Ensure all error states handled gracefully.

**Error States**:
- API failure: "Oops! Something went wrong. Let's try that again."
- Empty history: "Your watch history is empty. Ask me for recommendations!"
- AI timeout: "I'm thinking... try again in a moment."
- Network offline: Banner at top

**Technical Specifications**:
- Global error boundary
- Toast notifications for transient errors
- Inline error messages for forms

**Acceptance Criteria**:
- [ ] No unhandled errors in console
- [ ] User-friendly error messages
- [ ] Retry options where applicable
- [ ] Empty states have CTAs

---

**TASK P6-03: Demo Data Seeding**

**Assigned To**: Backend Engineer  
**Service**: Backend  
**Priority**: P1: Critical  
**Estimated Duration**: 30 minutes  
**Dependencies**: P2-03

**Task Objective**: Create script to seed demo user with watch history.

**Demo User**:
- Email: demo@cinepal.ai
- Password: demo1234
- Watch History: 10 popular movies/shows (mix of watched, watching)
- Watchlist: 5 items with different priorities

**Technical Specifications**:
- Node.js script: /scripts/seed-demo.ts
- TMDb IDs for real content
- Run before demo

**Acceptance Criteria**:
- [ ] Demo user created
- [ ] History populated with real content
- [ ] Watchlist has items
- [ ] Script idempotent (can re-run)

---

**TASK P6-04: Performance Optimization**

**Assigned To**: Frontend Specialist  
**Service**: Frontend  
**Priority**: P2: Important  
**Estimated Duration**: 45 minutes  
**Dependencies**: All frontend tasks

**Task Objective**: Ensure Lighthouse score >90 and fast load times.

**Optimizations**:
- Image optimization (next/image)
- Font subsetting
- Component code-splitting
- API response caching

**Targets**:
- LCP <2.5s
- FID <100ms
- CLS <0.1

**Acceptance Criteria**:
- [ ] Lighthouse performance >90
- [ ] Images use next/image
- [ ] Fonts preloaded
- [ ] No layout shift

---

**TASK P6-05: Demo Script & Rehearsal**

**Assigned To**: All Team  
**Service**: All  
**Priority**: P0: Blocking  
**Estimated Duration**: 60 minutes  
**Dependencies**: All tasks

**Task Objective**: Write demo script and practice run-through.

**Demo Flow**:
1. Show landing page (10s)
2. Register new user (20s)
3. Quick onboarding - add 3 shows (30s)
4. Get recommendation in chat (30s)
5. Add to watchlist (10s)
6. Get recap for a show (20s)
7. Take a quiz (60s)
8. Show history page (10s)

**Total Demo Time**: ~3 minutes

**Preparation**:
- Pre-create backup account
- Record video backup
- Test all flows 3x

**Acceptance Criteria**:
- [ ] Demo script written
- [ ] Video backup recorded
- [ ] All team practiced demo
- [ ] Fallback plan documented

---

#### Phase 6 Exit Criteria

- [ ] All animations smooth
- [ ] Error states handled
- [ ] Demo data ready
- [ ] Performance optimized
- [ ] Demo rehearsed and recorded

---

## SECTION 3: PARALLEL WORKSTREAM COORDINATION

### 3.1 Team Structure

| Agent | Primary Responsibility | Task IDs |
|-------|----------------------|----------|
| **Frontend Specialist** | Next.js UI, Components, Styling | P1-01, P1-02, P4-01 to P4-10, P5-01 to P5-06, P6-01, P6-02, P6-04 |
| **Backend Engineer** | Node.js APIs, Database, Auth | P1-03 to P1-06, P1-06B, P2-*, P5-07, P6-03 |
| **AI/ML Engineer** | Python FastAPI, LLM Integration | P1-07, P3-* |

### 3.2 Parallel Execution Windows

| Hour | Frontend | Backend | AI/ML |
|------|----------|---------|-------|
| 0-2 | P1-01, P1-02 | P1-03 to P1-06B | P1-07 |
| 2-6 | (waiting) | P2-01 to P2-06 | P3-01, P3-02 |
| 6-10 | (waiting) | Support | P3-03 to P3-05 |
| 10-16 | P4-01 to P4-10 | Bug fixes, P5-07 | Support |
| 16-20 | P5-01 to P5-06 | P6-03 | Support |
| 20-24 | P6-01, P6-02, P6-04 | Support | P6-05 |

### 3.3 Critical Path

**Longest Sequential Chain**:
P1-03 → P1-04 → P1-05 → P1-06 → P2-01 → P2-03 → P2-06 → P3-03 → P4-04 → P4-05

**Critical Path Duration**: ~12 hours

**Parallelization Savings**: Frontend and AI service built in parallel during backend development saves ~4 hours.

---

## SECTION 4: RISK MANAGEMENT

### 4.1 Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OpenAI rate limits | Medium | High | Use gpt-4o-mini, cache responses |
| TMDb API down | Low | High | Cache popular content, static fallback |
| MongoDB connection | Low | Critical | Use Atlas, test connection early |
| LLM response quality | Medium | Medium | Refine prompts, use structured output |
| Time overrun | High | Critical | Cut quiz feature first, simplify recaps |

### 4.2 Scope Protection

**Minimum Viable Demo**:
- Auth (login only, skip register in demo)
- Chat with AI recommendations
- Add to history

**Cut Order if Behind**:
1. Quiz feature
2. Watchlist priorities
3. Episode progress tracking
4. Recap TL;DR toggle
5. Landing page animations

---

## SECTION 5: APPENDIX

### A. Environment Variables

**Frontend (.env.local)**:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend (.env)**:
```
PORT=8000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
TMDB_API_KEY=your-tmdb-key
AI_SERVICE_URL=http://localhost:5000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**AI Service (.env)**:
```
OPENAI_API_KEY=your-openai-key
TMDB_API_KEY=your-tmdb-key
```

### B. Quick Commands

```bash
# Start all services
cd frontend && npm run dev &
cd backend && npm run dev &
cd ai-service && uvicorn src.main:app --reload --port 5000 &

# Seed demo data
cd backend && npx ts-node scripts/seed-demo.ts

# Run tests
cd backend && npm test
cd frontend && npm test
```

### C. API Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Create account |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/google | No | Google OAuth redirect |
| GET | /api/auth/google/callback | No | Google OAuth callback |
| GET | /api/history | Yes | Get watch history |
| POST | /api/history | Yes | Add to history |
| PUT | /api/history/:id | Yes | Update history item |
| DELETE | /api/history/:id | Yes | Delete history item |
| GET | /api/watchlist | Yes | Get watchlist |
| POST | /api/watchlist | Yes | Add to watchlist |
| DELETE | /api/watchlist/:id | Yes | Remove from watchlist |
| GET | /api/content/search | Yes | Search TMDb |
| GET | /api/content/:type/:id | Yes | Get content details |
| GET | /api/content/:type/:id/availability | Yes | Get streaming availability |
| PUT | /api/user/preferences | Yes | Update user preferences |
| POST | /api/ai/chat | Yes | Chat with AI |
| POST | /api/ai/recap | Yes | Get recap |
| POST | /api/ai/quiz | Yes | Get quiz |

---

**END OF DEVELOPMENT PLAN**
