"""
Migration: Add quiz results and shared quizzes tables
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import Base
from app.models.quiz import QuizResult, SharedQuiz


def migrate():
    """Run migration to add quiz results tables"""
    print("Running migration: Add quiz results and shared quizzes tables")
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    # Create tables
    print("Creating quiz_results table...")
    QuizResult.__table__.create(bind=engine, checkfirst=True)
    
    print("Creating shared_quizzes table...")
    SharedQuiz.__table__.create(bind=engine, checkfirst=True)
    
    print("Migration completed successfully!")


def rollback():
    """Rollback migration"""
    print("Rolling back migration: Remove quiz results tables")
    
    engine = create_engine(settings.DATABASE_URL)
    
    print("Dropping shared_quizzes table...")
    SharedQuiz.__table__.drop(bind=engine, checkfirst=True)
    
    print("Dropping quiz_results table...")
    QuizResult.__table__.drop(bind=engine, checkfirst=True)
    
    print("Rollback completed successfully!")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Quiz results migration")
    parser.add_argument(
        "--rollback",
        action="store_true",
        help="Rollback the migration"
    )
    
    args = parser.parse_args()
    
    if args.rollback:
        rollback()
    else:
        migrate()
