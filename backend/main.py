"""
NoteMind AI - FastAPI Backend
Main application entry point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.core.database import init_db
from app.core.migrations import run_migrations
from app.api import auth, documents, chat, summaries, folders, analytics, quiz, quiz_templates


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("\n🚀 Starting NoteMind AI Backend...")

    # Initialize database
    print("📊 Initializing database...")
    init_db()

    # Run pending migrations automatically
    print("🔄 Checking for database migrations...")
    migration_success = run_migrations()

    if not migration_success:
        print("⚠️  WARNING: Some migrations failed. Server starting anyway.")
        print("    Please check the logs above for details.\n")

    print("✅ Server startup complete!\n")

    yield

    # Shutdown (if needed)
    print("\n👋 Shutting down NoteMind AI Backend...")


# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered notebook for document analysis and chat",
    lifespan=lifespan,
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(folders.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(summaries.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(quiz_templates.router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to NoteMind AI API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
