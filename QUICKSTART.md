# 🚀 NoteMind AI - Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- Python 3.11+
- Node.js 18+
- Google Gemini API Key

## 1. Get Your Gemini API Key

Visit [Google AI Studio](https://ai.google.dev/) and create a new API key.

## 2. Setup Environment

```bash
# Clone repository
git clone <your-repo-url>
cd NoteMind-AI

# Copy environment file
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```env
GEMINI_API_KEY=your-api-key-here
SECRET_KEY=change-this-to-random-string
```

## 3. Install Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

## 4. Install Frontend

```bash
cd ../web
npm install
```

## 5. Run the Application

### Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

Backend runs at: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

### Terminal 2 - Frontend:
```bash
cd web
npm run dev
```

Frontend runs at: `http://localhost:3000`

## 6. Use the App

1. Open `http://localhost:3000`
2. Click "Get Started" to register
3. Upload a document
4. Start chatting!

## Troubleshooting

**Backend won't start?**
- Check your Gemini API key in `.env`
- Make sure virtual environment is activated
- Verify Python version: `python --version` (should be 3.11+)

**Frontend build errors?**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node version: `node --version` (should be 18+)

**Database issues?**
- The SQLite database is created automatically
- Located at `backend/notemind.db`
- To reset: delete the file and restart backend

## Testing

### Backend Tests:
```bash
cd backend
pytest
```

### Frontend Build:
```bash
cd web
npm run build
```

## Need Help?

See the full [README.md](README.md) for detailed documentation.
