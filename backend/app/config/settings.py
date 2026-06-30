"""
Application configuration loaded from environment variables (.env).
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AI-Based FYP Relevancy System"
    app_env: str = "development"
    debug: bool = True
    api_prefix: str = "/api/v1"

    host: str = "0.0.0.0"
    port: int = 8000

    # PostgreSQL – set DB_PASSWORD to your real PostgreSQL install password
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "fyp_relevancy_system"
    db_user: str = "postgres"
    db_password: str = "postgres123"

    # Optional legacy override (DB_* fields are preferred; kept in sync in .env)
    database_url: str = ""

    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_recycle: int = 1800

    secret_key: str = "change-this-to-a-long-random-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    password_reset_token_expire_minutes: int = 30

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Public base URL of the frontend (used to build password-reset links in emails)
    frontend_base_url: str = "http://localhost:5173"

    # SMTP — used to send password-reset emails. Leave smtp_host empty to disable email.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "AI FYP Relevancy System"
    smtp_use_tls: bool = True

    upload_dir: str = "uploads"
    max_upload_size_mb: int = 10

    openai_api_key: str = ""

    # Ollama – natural-language relevancy explanations (not used for similarity scoring)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    ollama_enabled: bool = True
    ollama_timeout_seconds: int = 120

    # Duplicate detection: minimum similarity % to flag a pair (matches relevancy matched_projects)
    duplicate_similarity_threshold: float = 50.0

    # Relevancy corpus: 0 = no limit (compare against all other projects)
    relevancy_corpus_limit: int = 0

    # AI relevancy V2 — semantic embeddings (prerequisite; disabled until integrated)
    relevancy_engine_v2_enabled: bool = False
    sentence_transformer_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    sentence_transformer_device: str = "cpu"

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
