# 🧠 NoteMind AI

> **AI-Powered Notebook** - Transform your documents into interactive conversations with Google Gemini

NoteMind AI is a modern, intelligent document analysis tool similar to Google's NotebookLM. Upload documents, chat with an AI about their content, and generate comprehensive summaries—all powered by Google's Gemini API with File Search capabilities.

![NoteMind AI](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)
![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green?logo=fastapi)
![Gemini](https://img.shields.io/badge/Gemini-API-purple)

## ✨ Features

### 📄 Document Management
- **Multi-format Support**: Upload PDF, DOCX, TXT, JSON, Markdown, and code files
- **Drag & Drop Interface**: Intuitive file upload with visual feedback
- **Real-time Processing**: Track document processing status
- **Smart Storage**: Organized document library with metadata

### 💬 AI Chat
- **Context-Aware Conversations**: Chat naturally about your documents
- **Citation Support**: Get answers with specific references to source material
- **Conversation History**: Resume previous discussions
- **Multi-turn Dialogues**: Build on previous questions and answers

### 📊 Intelligent Summaries
- **Auto-Generation**: Create comprehensive summaries with one click
- **Multiple Styles**: Choose from brief, medium, or detailed summaries
- **Key Topics Extraction**: Automatically identify main themes
- **Smart Insights**: Get the essence of long documents quickly

### 🔐 User Management
- **Secure Authentication**: JWT-based login system
- **Personal Workspace**: Private document storage per user
- **Session Management**: Stay logged in securely

### 🎨 Modern UX
- **Smooth Animations**: Fluid transitions with Framer Motion
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Clean Interface**: Minimal, distraction-free design
- **Real-time Feedback**: Loading states and progress indicators

## 🏗️ Architecture

```
NoteMind-AI/
├── backend/                 # Python FastAPI Backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   │   ├── auth.py     # Authentication
│   │   │   ├── documents.py # Document management
│   │   │   ├── chat.py     # Chat functionality
│   │   │   └── summaries.py # Summary generation
│   │   ├── core/           # Core configuration
│   │   │   ├── config.py   # Settings
│   │   │   ├── database.py # Database setup
│   │   │   └── security.py # Auth utilities
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   │   └── gemini_service.py # Gemini API integration
│   │   ├── schemas/        # Pydantic schemas
│   │   └── utils/          # Utilities
│   ├── tests/              # Backend tests
│   └── main.py             # FastAPI entry point
├── web/                    # Next.js Frontend
│   ├── app/                # Next.js pages
│   │   ├── page.tsx        # Landing page
│   │   ├── login/          # Login page
│   │   ├── register/       # Register page
│   │   ├── dashboard/      # Dashboard
│   │   └── document/[id]/  # Document view
│   ├── components/         # React components
│   ├── lib/                # API client
│   ├── store/              # Zustand state management
│   └── types/              # TypeScript types
└── IMPLEMENTATION.md       # Detailed roadmap
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **Google Gemini API Key** ([Get one here](https://ai.google.dev/))

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/NoteMind-AI.git
cd NoteMind-AI
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### 3. Frontend Setup

```bash
cd ../web

# Install dependencies
npm install
```

### 🔑 Configuration

#### Backend Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Backend Configuration
DATABASE_URL=sqlite:///./notemind.db
SECRET_KEY=your-secret-key-change-this-to-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Google Gemini API (REQUIRED)
GEMINI_API_KEY=your-gemini-api-key-here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Upload Configuration
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10485760
```

**Important**: Replace `GEMINI_API_KEY` with your actual API key from [Google AI Studio](https://ai.google.dev/).

#### Frontend Configuration

Create `.env.local` in the `web/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### ▶️ Running the Application

#### 1. Start the Backend

```bash
cd backend

# Make sure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run the server
python main.py
```

The backend API will be available at `http://localhost:8000`

- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

#### 2. Start the Frontend

In a new terminal:

```bash
cd web

# Development mode
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 🧪 Running Tests

#### Backend Tests

```bash
cd backend
source venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v
```

#### Frontend Tests

```bash
cd web

# Run tests (once configured)
npm test
```

## 📚 Usage Guide

### 1. Create an Account

1. Navigate to `http://localhost:3000`
2. Click "Get Started" or "Sign up"
3. Enter your email and password
4. You'll be automatically logged in

### 2. Upload a Document

1. Go to your Dashboard
2. Click "Upload Document"
3. Drag & drop a file or click to browse
4. Wait for processing (usually a few seconds)
5. Document will appear with "ready" status

### 3. Chat with Your Document

1. Click on any document card
2. Type your question in the chat input
3. Press Enter or click "Send"
4. Get AI-powered answers with citations
5. Continue the conversation naturally

### 4. Generate Summaries

1. In the document view, click the "Summary" tab
2. Click "Generate Summary"
3. Wait for the AI to analyze the document
4. View the summary and key topics
5. Regenerate for different insights

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Documents
- `GET /api/documents` - List all documents
- `GET /api/documents/{id}` - Get document details
- `POST /api/documents/upload` - Upload new document
- `DELETE /api/documents/{id}` - Delete document

### Chat
- `POST /api/chat` - Send message
- `GET /api/chat/history/{document_id}` - Get conversation history
- `DELETE /api/chat/{conversation_id}` - Delete conversation

### Summaries
- `POST /api/summaries/generate` - Generate summary
- `GET /api/summaries/{document_id}` - Get existing summary

Full API documentation available at `http://localhost:8000/docs`

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL ORM
- **SQLite** - Lightweight database
- **Google Generative AI** - Gemini API SDK
- **Pydantic** - Data validation
- **python-jose** - JWT tokens
- **passlib** - Password hashing
- **pytest** - Testing framework

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Zustand** - State management
- **Axios** - HTTP client
- **React Dropzone** - File upload

## 📊 Database Schema

```sql
-- Users table
users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Documents table
documents (
  id INTEGER PRIMARY KEY,
  user_id INTEGER FOREIGN KEY,
  filename TEXT,
  original_filename TEXT,
  file_path TEXT,
  file_size INTEGER,
  file_type TEXT,
  gemini_file_id TEXT,
  status TEXT, -- processing, ready, error
  summary TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Conversations table
conversations (
  id INTEGER PRIMARY KEY,
  user_id INTEGER FOREIGN KEY,
  document_id INTEGER FOREIGN KEY,
  title TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Messages table
messages (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER FOREIGN KEY,
  role TEXT, -- user, assistant
  content TEXT,
  citations JSON,
  created_at TIMESTAMP
)
```

## 🔒 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Pydantic schemas for all inputs
- **SQL Injection Prevention**: SQLAlchemy ORM
- **File Type Validation**: Whitelist of allowed extensions
- **File Size Limits**: 10MB max per file
- **Rate Limiting**: (Can be added with slowapi)

## 🚢 Production Deployment

### Backend Deployment

1. Set environment variables in production
2. Use PostgreSQL instead of SQLite
3. Set `DEBUG=False`
4. Use production WSGI server (Gunicorn/Uvicorn)
5. Enable HTTPS
6. Set up database backups

### Frontend Deployment

1. Build the production version:
```bash
cd web
npm run build
```

2. Deploy to Vercel, Netlify, or your hosting provider
3. Set environment variables in hosting platform
4. Configure custom domain

### Recommended Stack
- **Backend**: Railway, Render, or DigitalOcean
- **Frontend**: Vercel or Netlify
- **Database**: PostgreSQL on Supabase or Neon

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini API for powerful AI capabilities
- Next.js team for excellent React framework
- FastAPI for modern Python web development
- All open-source contributors

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Email: your@email.com



**Made with ❤️ using Next.js, FastAPI, and Google Gemini**
