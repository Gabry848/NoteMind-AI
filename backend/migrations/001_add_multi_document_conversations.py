"""
Migration: Add multi-document support to conversations
Creates conversation_documents association table for many-to-many relationship
"""
import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from app.core.config import settings


def get_engine():
    """Get database engine"""
    return create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    )


def upgrade():
    """Create conversation_documents table and migrate existing data"""
    engine = get_engine()
    
    print("Starting migration...")
    print(f"Database: {settings.DATABASE_URL}")
    
    with engine.connect() as conn:
        # Create the association table
        print("Creating conversation_documents table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS conversation_documents (
                conversation_id INTEGER NOT NULL,
                document_id INTEGER NOT NULL,
                PRIMARY KEY (conversation_id, document_id),
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
            )
        """))
        
        # Migrate existing conversations to new table
        print("Migrating existing conversation data...")
        result = conn.execute(text("""
            INSERT OR IGNORE INTO conversation_documents (conversation_id, document_id)
            SELECT id, document_id 
            FROM conversations 
            WHERE document_id IS NOT NULL
        """))
        
        conn.commit()
        print(f"✓ Migration completed successfully!")
        print(f"  - conversation_documents table created")
        print(f"  - {result.rowcount if hasattr(result, 'rowcount') else 'N/A'} existing conversations migrated")


def downgrade():
    """Drop conversation_documents table"""
    engine = get_engine()
    
    print("Reverting migration...")
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS conversation_documents"))
        conn.commit()
        print("✓ Migration reverted: conversation_documents table dropped")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Database migration for multi-document conversations")
    parser.add_argument("--downgrade", action="store_true", help="Revert the migration")
    args = parser.parse_args()
    
    try:
        if args.downgrade:
            downgrade()
        else:
            upgrade()
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
