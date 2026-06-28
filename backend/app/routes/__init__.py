"""
API route modules – aggregated router for the application.
"""

from fastapi import APIRouter

from app.routes import admin, auth, notifications, profile, projects

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(notifications.router)
api_router.include_router(admin.router)
api_router.include_router(profile.router)

__all__ = ["api_router", "auth", "projects", "notifications", "admin", "profile"]
