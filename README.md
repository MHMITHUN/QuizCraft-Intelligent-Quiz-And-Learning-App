# QuizCraft

AI-powered mobile quiz generation platform for education and business. Generate high-quality quizzes from text, PDFs, and images using Google Gemini, store and search with MongoDB Atlas Vector Search, and manage users and analytics across roles: guest, student, teacher, and admin.

## Features (Core)

- AI quiz generation: Gemini 1.5 (Pro/Flash) for MCQ/TF/short answers with explanations
- Content ingestion: PDF text extraction and OCR (pdf-parse + Tesseract.js)
- Vector search: Gemini embeddings (gemini-embedding-001) in MongoDB Atlas Vector Search (cosine)
- Role-based access: guest, student, teacher, admin; JWT auth and RBAC
- Quiz lifecycle: create, browse, attempt, history, analytics, recommendations
- Admin controls: users, quizzes, settings, quotas, categories/tags
- Freemium model: guest/student/teacher/admin tiers with usage limits

## Tech Stack

- Frontend: React Native (Expo), React Navigation, Axios, RN charts
- Backend: Node.js (Express), JWT + bcrypt, Multer (file upload)
- Database: MongoDB Atlas (including vector search index)
- AI: Google Gemini 1.5 Pro / 1.5 Flash; Embeddings: gemini-embedding-001

## Quick Start

Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas project (free tier ok)
- Google Gemini API key
- Expo CLI (for mobile)

Backend

1. Install
   - pwsh:
     - cd backend
     - npm install
2. Configure .env (backend/.env)
   - See Environment section below
3. Run
   - Development: npm run dev
   - Production: npm start
   - Server runs at http://localhost:5000

Frontend

1. Install
   - cd frontend
   - npm install
2. Configure API URL
   - frontend/app.config.js → extra.apiUrl
     - Physical device: http://YOUR_COMPUTER_IP:5000/api
     - Android emulator: http://10.0.2.2:5000/api
     - iOS simulator: http://localhost:5000/api
3. Start
   - npx expo start
   - Then press a (Android), i (iOS), or w (Web) as needed

Sanity check (API)

- Health: GET http://localhost:5000/health
- Login (admin after seed): POST /api/auth/login
- Generate quiz: POST /api/quiz/generate-from-text (Bearer token required)

## Environment (backend/.env)

Recommended variables (adjust to your needs):

PORT=5000
NODE_ENV=development

# MongoDB Atlas

MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/quizcraft?retryWrites=true&w=majority

# Auth

JWT_SECRET=replace_with_strong_random_string
JWT_EXPIRE=7d

# Gemini (AI)

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro

# Optionally use flash for lower latency:

# GEMINI_MODEL=gemini-1.5-flash

EMBEDDING_MODEL=gemini-embedding-001

# Vector Search (Atlas)

VECTOR_INDEX_NAME=quizembeddings_vector_index

# Uploads & limits

UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Rate limiting

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Quotas (freemium)

FREE_QUIZ_LIMIT=10
PREMIUM_QUIZ_LIMIT=1000

# Admin bootstrap

ADMIN_EMAIL=admin@quizcraft.com
ADMIN_PASSWORD=ChangeThisPassword!

## Role-Based Flows (high level)

- Guest: explore limited quizzes/search, no persistence beyond session
- Student: generate/attempt quizzes, view history and analytics
- Teacher: all student features + class management and broader quotas
- Admin: platform management (users, quizzes, categories/tags, settings)

## API Highlights (selected)

- Auth
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/guest-access
  - GET /api/auth/me
- Quiz
  - POST /api/quiz/generate-from-text
  - POST /api/quiz/upload-and-generate (multipart: PDF/image)
  - GET /api/quiz (filters: page, limit, category, difficulty)
  - GET /api/quiz/:id
  - POST /api/quiz/:id/submit
- Search
  - GET /api/search/similar?query=...
- History & Analytics
  - GET /api/history/my
  - POST /api/history/save
  - GET /api/analytics/my-stats
  - GET /api/analytics/leaderboard
- Admin
  - GET/PUT /api/admin/users (filters, role updates)
  - GET/PUT /api/admin/quizzes (visibility, ownership)
  - GET /api/settings

## Troubleshooting

Backend won’t start

- Verify MONGODB_URI, whitelist your IP in Atlas
- Check GEMINI_API_KEY is valid and quota available
- Ensure port 5000 is free (netstat/taskkill on Windows)

Frontend can’t reach backend

- Set correct extra.apiUrl (IP for physical device)
- Ensure backend is running and firewall allows 5000
- Same Wi-Fi network for device and PC

Vector search returns no results

- Ensure vector index created on quizembeddings with cosine
- Confirm embeddings generated (gemini-embedding-001)
- Allow time for index build in Atlas

File upload fails

- Check MAX_FILE_SIZE and that uploads folder exists
- Validate accepted MIME types (PDF/images)

## Best Practices

- Keep secrets in backend/.env (never commit)
- Use gemini-1.5-flash when latency matters; 1.5-pro for quality
- Chunk and embed quiz content per-question for better search recall
- Monitor quotas per role; enforce server-side checks
- Add server logging in development for easier debugging
- Consider app.config.js profiles for dev/staging/prod API URLs

## License

Proprietary. All rights reserved.
