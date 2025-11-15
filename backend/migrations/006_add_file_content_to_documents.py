"""
Add file_content column to documents table for storing file content in database
"""
import sys
from pathlib import Path

# Add backend directory to Python path early
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.core.config import settings


def get_database_type():
    """Determine the database type from DATABASE_URL"""
    if "sqlite" in settings.DATABASE_URL:
        return "sqlite"
    elif "postgres" in settings.DATABASE_URL:
        return "postgresql"
    elif "mysql" in settings.DATABASE_URL:
        return "mysql"
    else:
        return "unknown"


def upgrade(engine):
    """Add file_content column to documents table"""
    db_type = get_database_type()
    print(f"Database type detected: {db_type}")

    with engine.connect() as conn:
        # Check if column already exists
        if db_type == "postgresql":
            result = conn.execute(
                text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns
                        WHERE table_name='documents' AND column_name='file_content'
                    )
                """)
            )
            if result.scalar():
                print("ℹ Column file_content already exists, skipping")
                return

            # Add file_content column for PostgreSQL
            conn.execute(
                text(
                    """
                    ALTER TABLE documents
                    ADD COLUMN file_content BYTEA NULL
                    """
                )
            )
        elif db_type == "sqlite":
            # SQLite: Try to add column, ignore if it already exists
            try:
                conn.execute(
                    text(
                        """
                        ALTER TABLE documents
                        ADD COLUMN file_content BLOB NULL
                        """
                    )
                )
            except Exception as e:
                if "duplicate column" in str(e).lower():
                    print("ℹ Column file_content already exists, skipping")
                    return
                raise
        elif db_type == "mysql":
            # MySQL: Try to add column, ignore if it already exists
            try:
                conn.execute(
                    text(
                        """
                        ALTER TABLE documents
                        ADD COLUMN file_content LONGBLOB NULL
                        """
                    )
                )
            except Exception as e:
                if "duplicate column" in str(e).lower():
                    print("ℹ Column file_content already exists, skipping")
                    return
                raise

        conn.commit()
        print("✓ Added file_content column to documents table")


def downgrade(engine):
    """Remove file_content column from documents table"""
    with engine.connect() as conn:
        try:
            conn.execute(
                text(
                    """
                    ALTER TABLE documents
                    DROP COLUMN file_content
                    """
                )
            )
            conn.commit()
            print("✓ Removed file_content column from documents table")
        except Exception as e:
            if "column" in str(e).lower() and "does not exist" in str(e).lower():
                print("ℹ Column file_content does not exist, nothing to remove")
            else:
                raise


if __name__ == "__main__":
    from app.core.database import engine

    print("Running migration: Add file_content column")
    upgrade(engine)
    print("Migration completed successfully!")
