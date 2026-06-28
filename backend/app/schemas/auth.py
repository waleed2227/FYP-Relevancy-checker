"""
Authentication request/response schemas with UOL validation rules.
"""

from typing import Literal, Self

from pydantic import BaseModel, Field, field_validator, model_validator

from app.utils.validators import (
    normalize_phone,
    student_email_matches_id,
    validate_pakistani_phone,
    validate_professor_email,
    validate_student_email,
    validate_student_id,
)


class RegisterRequest(BaseModel):
    """Student or professor registration payload."""

    full_name: str = Field(..., min_length=2, max_length=255, description="Full legal name")
    email: str = Field(..., description="UOL institutional email")
    password: str = Field(..., min_length=8, max_length=128, description="Min 8 characters")
    role: Literal["student", "professor"]
    student_id: str | None = Field(None, description="Numeric UOL student ID")
    department: str | None = Field(None, min_length=2, max_length=150)
    phone_number: str | None = Field(None, description="Pakistani mobile number")

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

    @model_validator(mode="after")
    def validate_role_fields(self) -> Self:
        if self.role == "student":
            if not self.student_id:
                raise ValueError("Student ID is required")
            self.student_id = validate_student_id(self.student_id)
            self.email = validate_student_email(self.email)
            student_email_matches_id(self.email, self.student_id)
            if not self.department:
                self.department = None  # optional for students
        else:
            self.email = validate_professor_email(self.email)
            if not self.department or not self.department.strip():
                raise ValueError("Department is required for professors")
            self.student_id = None

        self.phone_number = validate_pakistani_phone(self.phone_number, required=False)
        return self


class LoginRequest(BaseModel):
    email: str = Field(..., description="UOL email address")
    password: str = Field(..., min_length=1)
    role: Literal["student", "professor", "admin"] | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: str | None = None
    photo_url: str | None = None
    student_id: str | None = None
    department: str | None = None
    major: str | None = None
    year: str | None = None
    employee_id: str | None = None

    model_config = {"from_attributes": True}
