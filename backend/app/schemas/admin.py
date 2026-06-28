from datetime import datetime
from typing import Literal, Self

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.utils.validators import (
    normalize_phone,
    student_email_matches_id,
    validate_pakistani_phone,
    validate_professor_email,
    validate_student_email,
    validate_student_id,
)


class UserListItem(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: str
    status: str
    joinedDate: str
    projectsCount: int


class StudentListItem(BaseModel):
    id: int
    name: str
    email: str
    studentId: str
    department: str
    status: str
    projectsCount: int
    joinedDate: str


class ProfessorListItem(BaseModel):
    id: int
    name: str
    email: str
    department: str
    status: str
    projectsSupervised: int
    joinedDate: str
    phone: str | None = None
    photoUrl: str | None = None
    professorId: str | None = None
    specialization: str | None = None


class ProfessorStatsResponse(BaseModel):
    totalProfessors: int
    activeProfessors: int
    totalSupervisedProjects: int
    averageRating: float


class ProfessorProjectItem(BaseModel):
    id: int
    title: str
    studentName: str
    status: str
    submittedDate: str
    relevancyScore: float | None = None


class ProfessorReviewHistoryItem(BaseModel):
    id: int
    projectTitle: str
    studentName: str
    action: str
    feedback: str
    createdAt: str


class ProfessorDetailResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None = None
    photoUrl: str | None = None
    professorId: str | None = None
    department: str
    specialization: str | None = None
    status: str
    joinedDate: str
    projectsSupervised: int
    assignedProjects: list[ProfessorProjectItem]
    reviewHistory: list[ProfessorReviewHistoryItem]


class AdminUpdateProfessorRequest(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=255)
    email: str | None = None
    department: str | None = None
    phone_number: str | None = None
    specialization: str | None = Field(None, max_length=255)
    status: Literal["active", "inactive"] | None = None

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, v: str | None) -> str | None:
        return v.strip() if v else None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str | None) -> str | None:
        return v.strip().lower() if v else None

    @field_validator("department", "specialization")
    @classmethod
    def strip_optional(cls, v: str | None) -> str | None:
        if v is None:
            return None
        stripped = v.strip()
        return stripped if stripped else None

    @model_validator(mode="after")
    def validate_fields(self) -> Self:
        if self.email:
            self.email = validate_professor_email(self.email)
        self.phone_number = validate_pakistani_phone(self.phone_number, required=False)
        return self


class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str | None = None
    headProfessor: str | None = None
    studentCount: int
    professorCount: int
    projectCount: int
    description: str | None = None


class DashboardActivityItem(BaseModel):
    id: str
    type: str
    title: str
    description: str
    occurredAt: datetime
    color: str


class DashboardDepartmentItem(BaseModel):
    department: str
    projects: int
    students: int
    professors: int
    percentage: float


class DuplicateProjectSummary(BaseModel):
    id: int
    title: str
    studentName: str
    technologies: str
    description: str
    status: str
    submittedDate: str


class DuplicateAlertItem(BaseModel):
    id: int
    project1: DuplicateProjectSummary
    project2: DuplicateProjectSummary
    similarity: float
    riskLevel: str
    status: str
    detectedDate: str
    aiAnalysis: str | None = None
    recommendation: str | None = None


class AdminDashboardStats(BaseModel):
    totalStudents: int
    totalProfessors: int
    submittedProjects: int
    approvedProjects: int
    rejectedProjects: int
    aiDuplicateAlerts: int
    recentActivities: list[DashboardActivityItem]
    departmentBreakdown: list[DashboardDepartmentItem]
    duplicateAlerts: list[DuplicateAlertItem]


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    photo_url: str | None = Field(None, max_length=500_000)
    major: str | None = None
    year: str | None = None
    department: str | None = None

    @field_validator("photo_url")
    @classmethod
    def validate_photo_url(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        if not v.startswith("data:image/"):
            raise ValueError("Profile photo must be an image data URL")
        if len(v) > 500_000:
            raise ValueError("Profile photo is too large. Use a smaller image (max ~350 KB after compression).")
        return v


class AdminCreateUserRequest(BaseModel):
    """Admin-created user account (student, professor, or admin)."""

    full_name: str = Field(..., min_length=2, max_length=255)
    email: str
    password: str = Field(..., min_length=8, max_length=128)
    role: Literal["student", "professor", "admin"]
    student_id: str | None = None
    department: str | None = None
    phone_number: str | None = None
    specialization: str | None = Field(None, max_length=255)

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("department")
    @classmethod
    def strip_department(cls, v: str | None) -> str | None:
        return v.strip() if v else None

    @field_validator("specialization")
    @classmethod
    def strip_specialization(cls, v: str | None) -> str | None:
        if v is None:
            return None
        stripped = v.strip()
        return stripped if stripped else None

    @model_validator(mode="after")
    def validate_role_fields(self) -> Self:
        if self.role == "student":
            if not self.student_id:
                raise ValueError("Student ID is required")
            self.student_id = validate_student_id(self.student_id)
            self.email = validate_student_email(self.email)
            student_email_matches_id(self.email, self.student_id)
        elif self.role == "professor":
            self.email = validate_professor_email(self.email)
            if not self.department or not self.department.strip():
                raise ValueError("Department is required for professors")
            self.student_id = None
        else:
            self.email = validate_professor_email(self.email)
            self.student_id = None

        self.phone_number = validate_pakistani_phone(self.phone_number, required=False)
        return self
