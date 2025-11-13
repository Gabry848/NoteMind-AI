"""
Add mermaid_schema column to documents table
"""
from sqlalchemy import text


def upgrade(engine):
    """Add mermaid_schema column to documents table"""
    with engine.connect() as conn:
        # Add mermaid_schema column
        conn.execute(
            text(
                """
                ALTER TABLE documents 
                ADD COLUMN mermaid_schema TEXT NULL
                """
            )
        )
        conn.commit()
        print("✓ Added mermaid_schema column to documents table")


def downgrade(engine):
    """Remove mermaid_schema column from documents table"""
    with engine.connect() as conn:
        conn.execute(
            text(
                """
                ALTER TABLE documents 
                DROP COLUMN mermaid_schema
                """
            )
        )
        conn.commit()
        print("✓ Removed mermaid_schema column from documents table")


if __name__ == "__main__":
    import sys
    from pathlib import Path
    
    # Add backend directory to Python path
    backend_dir = Path(__file__).parent.parent
    sys.path.insert(0, str(backend_dir))
    
    from app.core.database import engine
    
    print("Running migration: Add mermaid_schema column")
    upgrade(engine)
    print("Migration completed successfully!")
