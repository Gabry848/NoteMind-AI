"""
Migration: Add quiz_templates table
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings


def migrate():
    """Run migration to create quiz_templates table"""
    print("Running migration: Add quiz_templates table")

    # Create engine
    engine = create_engine(settings.DATABASE_URL)

    with engine.connect() as conn:
        # Check if table already exists
        if "sqlite" in settings.DATABASE_URL:
            # SQLite
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='quiz_templates'"))
            table_exists = result.fetchone() is not None
        else:
            # PostgreSQL or other databases
            result = conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_name='quiz_templates'
            """))
            table_exists = result.rowcount > 0

        if not table_exists:
            print("Creating quiz_templates table...")
            conn.execute(text("""
                CREATE TABLE quiz_templates (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    name VARCHAR NOT NULL,
                    description VARCHAR,
                    settings JSON NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """))
            conn.commit()
            print("Table created successfully!")
        else:
            print("Table already exists, skipping...")

    print("Migration completed successfully!")


def rollback():
    """Rollback migration"""
    print("Rolling back migration: Remove quiz_templates table")

    engine = create_engine(settings.DATABASE_URL)

    with engine.connect() as conn:
        print("Dropping quiz_templates table...")
        conn.execute(text("DROP TABLE IF EXISTS quiz_templates"))
        conn.commit()
        print("Table dropped successfully!")

    print("Rollback completed successfully!")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Quiz templates migration")
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
