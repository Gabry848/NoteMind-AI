"""
Auto-migration system - Runs migrations automatically on server startup
"""
import os
import sys
from pathlib import Path
from sqlalchemy import create_engine, text, inspect
from app.core.config import settings


class MigrationRunner:
    """Handles automatic database migrations on startup"""

    def __init__(self):
        self.engine = create_engine(settings.DATABASE_URL)
        self.migrations_dir = Path(__file__).parent.parent.parent / "migrations"
        self._ensure_migrations_table()

    def _ensure_migrations_table(self):
        """Create migrations tracking table if it doesn't exist"""
        with self.engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS migration_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    migration_name VARCHAR NOT NULL UNIQUE,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()

    def _get_applied_migrations(self):
        """Get list of already applied migrations"""
        with self.engine.connect() as conn:
            result = conn.execute(text("SELECT migration_name FROM migration_history"))
            return {row[0] for row in result}

    def _get_pending_migrations(self):
        """Get list of migrations that need to be applied"""
        if not self.migrations_dir.exists():
            print(f"⚠️  Migrations directory not found: {self.migrations_dir}")
            return []

        # Get all migration files
        migration_files = sorted([
            f for f in self.migrations_dir.glob("*.py")
            if f.name != "__init__.py" and not f.name.startswith(".")
        ])

        # Get already applied migrations
        applied = self._get_applied_migrations()

        # Filter out applied migrations
        pending = [f for f in migration_files if f.stem not in applied]

        return pending

    def _run_migration_file(self, migration_file: Path):
        """Execute a single migration file"""
        print(f"  🔄 Running migration: {migration_file.name}")

        # Add migrations directory to Python path
        sys.path.insert(0, str(self.migrations_dir.parent))

        try:
            # Import and execute migration
            module_name = f"migrations.{migration_file.stem}"

            # Import the module
            import importlib.util
            spec = importlib.util.spec_from_file_location(module_name, migration_file)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            # Run migrate function
            if hasattr(module, 'migrate'):
                module.migrate()
            else:
                print(f"  ⚠️  Migration {migration_file.name} has no migrate() function")
                return False

            # Record migration as applied
            with self.engine.connect() as conn:
                conn.execute(
                    text("INSERT INTO migration_history (migration_name) VALUES (:name)"),
                    {"name": migration_file.stem}
                )
                conn.commit()

            print(f"  ✅ Migration {migration_file.name} completed successfully")
            return True

        except Exception as e:
            print(f"  ❌ Migration {migration_file.name} failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    def run_pending_migrations(self):
        """Run all pending migrations"""
        print("\n" + "="*60)
        print("🗃️  DATABASE MIGRATION CHECK")
        print("="*60)

        pending = self._get_pending_migrations()

        if not pending:
            print("✅ Database is up to date - no pending migrations")
            print("="*60 + "\n")
            return True

        print(f"📋 Found {len(pending)} pending migration(s):\n")
        for migration in pending:
            print(f"   - {migration.name}")

        print("\n🚀 Starting migration process...\n")

        success_count = 0
        for migration_file in pending:
            if self._run_migration_file(migration_file):
                success_count += 1
            else:
                print(f"\n❌ Migration process stopped due to error in {migration_file.name}")
                print("="*60 + "\n")
                return False

        print(f"\n✅ Successfully applied {success_count}/{len(pending)} migration(s)")
        print("="*60 + "\n")
        return True


# Singleton instance
_migration_runner = None


def get_migration_runner() -> MigrationRunner:
    """Get or create migration runner singleton"""
    global _migration_runner
    if _migration_runner is None:
        _migration_runner = MigrationRunner()
    return _migration_runner


def run_migrations():
    """Convenience function to run all pending migrations"""
    runner = get_migration_runner()
    return runner.run_pending_migrations()
