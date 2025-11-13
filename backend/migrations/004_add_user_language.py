"""
Migration: Add preferred_language to users table
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings


def migrate():
    """Run migration to add preferred_language column"""
    print("Running migration: Add preferred_language to users table")
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if column already exists
        if "sqlite" in settings.DATABASE_URL:
            # SQLite
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result]
            
            if "preferred_language" not in columns:
                print("Adding preferred_language column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'it' NOT NULL"))
                conn.commit()
                print("Column added successfully!")
            else:
                print("Column already exists, skipping...")
        else:
            # PostgreSQL or other databases
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='preferred_language'
            """))
            
            if result.rowcount == 0:
                print("Adding preferred_language column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'it' NOT NULL"))
                conn.commit()
                print("Column added successfully!")
            else:
                print("Column already exists, skipping...")
    
    print("Migration completed successfully!")


def rollback():
    """Rollback migration"""
    print("Rolling back migration: Remove preferred_language from users table")
    
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        if "sqlite" in settings.DATABASE_URL:
            print("Note: SQLite does not support DROP COLUMN. Manual intervention required.")
        else:
            print("Dropping preferred_language column...")
            conn.execute(text("ALTER TABLE users DROP COLUMN preferred_language"))
            conn.commit()
            print("Column dropped successfully!")
    
    print("Rollback completed successfully!")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="User preferred language migration")
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
