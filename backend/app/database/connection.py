"""PostgreSQL connection URL builder from environment variables."""

from urllib.parse import quote_plus

from app.config.settings import get_settings


def get_database_url() -> str:
    """
    Build async PostgreSQL URL for SQLAlchemy + asyncpg.
    Always built from DB_HOST, DB_USER, DB_PASSWORD, etc. (single source of truth).
    Password is URL-encoded for special characters.
    """
    s = get_settings()
    password = quote_plus(s.db_password)
    return (
        f"postgresql+asyncpg://{s.db_user}:{password}"
        f"@{s.db_host}:{s.db_port}/{s.db_name}"
    )
