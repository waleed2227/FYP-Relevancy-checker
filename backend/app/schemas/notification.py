from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    timestamp: str
    isRead: bool
    priority: str | None = None
    color: str | None = None


class AISuggestionResponse(BaseModel):
    id: int
    isRead: bool
    type: str
    title: str
    description: str
    detailedReasoning: str | None = None
    priority: str | None = None
    confidenceScore: float | None = None
    suggestedAction: str | None = None
    color: str | None = None
