"""Notification and AI suggestion services."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_suggestion import AISuggestion
from app.models.notification import Notification
from app.schemas.notification import AISuggestionResponse, NotificationResponse
from app.utils.time_format import relative_time


def _notif_response(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=n.id,
        type=n.type.value,
        title=n.title,
        message=n.message,
        timestamp=relative_time(n.created_at),
        isRead=n.is_read,
        priority=n.priority,
        color=n.color,
    )


def _suggestion_response(s: AISuggestion) -> AISuggestionResponse:
    return AISuggestionResponse(
        id=s.id,
        isRead=s.is_read,
        type=s.type.value,
        title=s.title,
        description=s.description,
        detailedReasoning=s.detailed_reasoning,
        priority=s.priority,
        confidenceScore=s.confidence_score,
        suggestedAction=s.suggested_action,
        color=s.color,
    )


async def list_notifications(db: AsyncSession, user_id: int) -> list[NotificationResponse]:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
    )
    return [_notif_response(n) for n in result.scalars().all()]


async def list_ai_suggestions(db: AsyncSession, user_id: int) -> list[AISuggestionResponse]:
    result = await db.execute(
        select(AISuggestion)
        .where(AISuggestion.user_id == user_id, AISuggestion.is_dismissed.is_(False))
        .order_by(AISuggestion.created_at.desc())
    )
    return [_suggestion_response(s) for s in result.scalars().all()]
