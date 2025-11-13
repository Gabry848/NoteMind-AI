"""
Migration script to add folders support
Adds folder table and folder_id to documents
"""
import sqlite3
from pathlib import Path


def migrate():
    """Run migration"""
    db_path = Path(__file__).parent.parent / "notemind.db"
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Starting migration: Add folders support")
        
        # Create folders table
        print("Creating folders table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS folders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name VARCHAR NOT NULL,
                parent_id INTEGER,
                color VARCHAR DEFAULT '#3B82F6',
                icon VARCHAR DEFAULT '📁',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (parent_id) REFERENCES folders (id)
            )
        """)
        
        # Check if folder_id column already exists
        cursor.execute("PRAGMA table_info(documents)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if "folder_id" not in columns:
            print("Adding folder_id column to documents table...")
            cursor.execute("""
                ALTER TABLE documents ADD COLUMN folder_id INTEGER
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents (folder_id)
            """)
        else:
            print("folder_id column already exists in documents table")
        
        # Create indexes for better performance
        print("Creating indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders (user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders (parent_id)")
        
        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
