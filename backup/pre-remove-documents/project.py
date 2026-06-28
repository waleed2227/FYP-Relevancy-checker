from datetime import date
from pydantic import BaseModel, EmailStr, Field


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=500)
    technologies: str = Field(..., min_length=2, max_length=500)
    description: str = Field(..., min_length=20)
    professor_email: EmailStr
    problem_statement: str | None = None
    objectives: str | None = None
    methodology: str | None = None
    expected_outcomes: str | None = None
    deliverables: str | None = None


class ProjectUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=500)
    technologies: str | None = Field(None, min_length=2, max_length=500)
    description: str | None = Field(None, min_length=20)
    professor_email: EmailStr | None = None
    problem_statement: str | None = None
    objectives: str | None = None
    methodology: str | None = None
    expected_outcomes: str | None = None
    deliverables: str | None = None


class ProjectResponse(BaseModel):
    id: int
    title: str
    technologies: str
    description: str
    problemStatement: str | None = None
    objectives: str | None = None
    methodology: str | None = None
    expectedOutcomes: str | None = None
    deliverables: str | None = None
    submittedDate: str
    status: str
    relevancyScore: float | None = None
    professor: str | None = None
    professorEmail: str
    feedback: str | None = None

    model_config = {"from_attributes": True}


class MatchedProjectResponse(BaseModel):
    id: int
    title: str
    similarity: float
    year: str | None = None
    status: str | None = None
    author: str | None = None


class RelevancyInsight(BaseModel):
    label: str
    value: str
    description: str


class RelevancyResultResponse(BaseModel):
    overall_score: float
    is_high_relevancy: bool
    insights: list[RelevancyInsight]
    matched_projects: list[MatchedProjectResponse]
    project: ProjectResponse


class ReviewQueueItem(BaseModel):
    id: int
    studentName: str
    studentId: str
    studentEmail: str
    studentPhone: str | None = None
    studentPhoto: str | None = None
    title: str
    projectTitle: str | None = None
    technologies: str
    description: str
    problemStatement: str | None = None
    objectives: str | None = None
    methodology: str | None = None
    expectedOutcomes: str | None = None
    deliverables: str | None = None
    submittedDate: str
    relevancyScore: float | None = None
    status: str
    feedback: str | None = None
    innovationScore: float | None = None
    similarityScore: float | None = None
    feasibilityScore: float | None = None
    aiConfidence: float | None = None


class ReviewCreate(BaseModel):
    action: str = Field(..., pattern="^(approve|reject|revision)$")
    feedback: str = Field(..., min_length=5)


class DashboardStats(BaseModel):
    total: int
    approved: int
    pending: int
    rejected: int
