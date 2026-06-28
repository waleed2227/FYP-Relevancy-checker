"""
FastAPI application entry point – AI-Based FYP Relevancy System.

Run development server:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Production:
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import get_settings
from app.database import engine
from app.middleware.exception_handlers import register_exception_handlers
from app.routes import api_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle."""
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
