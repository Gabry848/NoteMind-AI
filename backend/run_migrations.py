"""
Database migration runner
Runs all pending migrations in order
"""
import sys
import os
from pathlib import Path
import importlib.util

# Add backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.database import engine


def get_migration_files():
    """Get sorted list of migration files"""
    migrations_dir = backend_dir / "migrations"
    migration_files = sorted(migrations_dir.glob("*.py"))
    # Filter out __init__.py and other non-migration files
    migration_files = [f for f in migration_files if f.name[0].isdigit()]
    return migration_files


def run_migration(migration_file):
    """Run a single migration file"""
    print(f"\n📝 Running migration: {migration_file.name}")

    try:
        # Load the migration module
        spec = importlib.util.spec_from_file_location(migration_file.stem, migration_file)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        # Run the upgrade function if it exists
        if hasattr(module, 'upgrade'):
            module.upgrade(engine)
            print(f"✓ Migration {migration_file.name} completed successfully")
            return True
        else:
            print(f"⚠ Migration {migration_file.name} has no upgrade function, skipping")
            return True

    except Exception as e:
        print(f"✗ Migration {migration_file.name} failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all migrations"""
    print("🚀 Running database migrations...")
    print(f"Database: {sys.argv[1] if len(sys.argv) > 1 else 'default'}")

    migration_files = get_migration_files()

    if not migration_files:
        print("ℹ No migrations found")
        return True

    print(f"\n📋 Found {len(migration_files)} migration(s)")

    failed_migrations = []
    for migration_file in migration_files:
        success = run_migration(migration_file)
        if not success:
            failed_migrations.append(migration_file.name)

    print("\n" + "="*50)
    if failed_migrations:
        print(f"❌ {len(failed_migrations)} migration(s) failed:")
        for name in failed_migrations:
            print(f"  - {name}")
        return False
    else:
        print(f"✅ All {len(migration_files)} migration(s) completed successfully!")
        return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
