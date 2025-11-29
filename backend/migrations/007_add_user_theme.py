"""
Migration: Add theme to users table
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings


def migrate():
    """Run migration to add theme column"""
    print("Running migration: Add theme to users table")

    # Create engine
    engine = create_engine(settings.DATABASE_URL)

    with engine.connect() as conn:
        # Check if column already exists
        if "sqlite" in settings.DATABASE_URL:
            # SQLite
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result]

            if "theme" not in columns:
                print("Adding theme column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN theme VARCHAR(10) DEFAULT 'light' NOT NULL"))
                conn.commit()
                print("Column added successfully!")
            else:
                print("Column already exists, skipping...")
        else:
            # PostgreSQL or other databases
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='users' AND column_name='theme'
            """))

            if result.rowcount == 0:
                print("Adding theme column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN theme VARCHAR(10) DEFAULT 'light' NOT NULL"))
                conn.commit()
                print("Column added successfully!")
            else:
                print("Column already exists, skipping...")

    print("Migration completed successfully!")


def rollback():
    """Rollback migration"""
    print("Rolling back migration: Remove theme from users table")

    engine = create_engine(settings.DATABASE_URL)

    with engine.connect() as conn:
        if "sqlite" in settings.DATABASE_URL:
            print("Note: SQLite does not support DROP COLUMN. Manual intervention required.")
        else:
            print("Dropping theme column...")
            conn.execute(text("ALTER TABLE users DROP COLUMN theme"))
            conn.commit()
            print("Column dropped successfully!")

    print("Rollback completed successfully!")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="User theme migration")
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
