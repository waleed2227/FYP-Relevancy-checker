"""
FastAPI application entry point – AI-Based FYP Relevancy System.

Run development server:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Production:
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
"""

import asyncio
import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.ai import semantic_embeddings
from app.config.settings import get_settings
from app.database import engine
from app.middleware.exception_handlers import register_exception_handlers
from app.routes import api_router

settings = get_settings()
logger = logging.getLogger(__name__)


async def _warm_up_models() -> None:
    """Preload the embedding model and the local LLM so the first project
    submission does not pay the cold-start cost (model load into memory).

    Runs in the background at startup; failures are non-fatal.
    """
    # 1) Sentence-transformer embedding model.
    try:
        if semantic_embeddings.is_semantic_engine_enabled():
            await asyncio.to_thread(semantic_embeddings.preload_model)
            logger.info("Warm-up: embedding model loaded.")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Warm-up: embedding model skipped (%s).", exc)

    # 2) Ollama LLM — a trivial request loads the model into memory and keep_alive
    #    keeps it resident so subsequent explanations are fast.
    if settings.ollama_enabled:
        try:
            url = f"{settings.ollama_base_url.rstrip('/')}/api/generate"
            async with httpx.AsyncClient(timeout=settings.ollama_timeout_seconds) as client:
                await client.post(
                    url,
                    json={
                        "model": settings.ollama_model,
                        "prompt": "ready",
                        "stream": False,
                        "keep_alive": "30m",
                    },
                )
            logger.info("Warm-up: Ollama model loaded.")
        except Exception as exc:  # noqa: BLE001
            logger.warning("Warm-up: Ollama skipped (%s).", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle."""
    # Fire-and-forget so startup is not blocked by model loading.
    asyncio.create_task(_warm_up_models())
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    description=(
        "Production REST API for FYP project submission, AI relevancy scoring, "
        "and professor review workflow. Roles: Admin, Professor, Student."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

register_exception_handlers(app)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/health", tags=["Health"])
async def health_check():
    """Liveness check for deployments and load balancers."""
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.app_env,
    }
