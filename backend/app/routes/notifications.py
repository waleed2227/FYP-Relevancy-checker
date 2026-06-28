"""Notifications and AI suggestions API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import CurrentUser
from app.database import get_db
from app.models.ai_suggestion import AISuggestion
from app.models.notification import Notification
from app.schemas.notification import AISuggestionResponse, NotificationResponse
from app.services import notification_service
from app.utils.exceptions import not_found

router = APIRouter(tags=["Notifications"])


@router.get("/notifications", response_model=list[NotificationResponse])
async def get_notifications(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await notification_service.list_notifications(db, user.id)


@router.patch("/notifications/{notification_id}/read")
async def mark_read(notification_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user.id
        )
    )
    n = result.scalar_one_or_none()
    if not n:
        raise not_found("Notification")
    n.is_read = True
    return {"message": "Marked as read"}


@router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user.id
        )
    )
    n = result.scalar_one_or_none()
    if not n:
        raise not_found("Notification")
    await db.delete(n)
    return {"message": "Deleted"}


@router.patch("/notifications/read-all")
async def mark_all_read(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Notification).where(Notification.user_id == user.id, Notification.is_read.is_(False))
    )
    for n in result.scalars().all():
        n.is_read = True
    return {"message": "All marked as read"}


@router.get("/ai-suggestions", response_model=list[AISuggestionResponse])
async def get_ai_suggestions(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return await notification_service.list_ai_suggestions(db, user.id)


@router.patch("/ai-suggestions/{suggestion_id}/read")
async def mark_suggestion_read(suggestion_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AISuggestion).where(
            AISuggestion.id == suggestion_id, AISuggestion.user_id == user.id
        )
    )
    s = result.scalar_one_or_none()
    if not s:
        raise not_found("Suggestion")
    s.is_read = True
    return {"message": "Marked as read"}


@router.delete("/ai-suggestions/{suggestion_id}")
async def dismiss_suggestion(suggestion_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AISuggestion).where(
            AISuggestion.id == suggestion_id, AISuggestion.user_id == user.id
        )
    )
    s = result.scalar_one_or_none()
    if not s:
        raise not_found("Suggestion")
    s.is_dismissed = True
    return {"message": "Dismissed"}
