"""
UOL (University of Lahore) registration validators.
Used by Pydantic schemas and auth service.
"""

import re

# Student: 70140912@student.uol.edu.pk
STUDENT_EMAIL_REGEX = re.compile(r"^[0-9]{5,12}@student\.uol\.edu\.pk$", re.IGNORECASE)

# Professor: name@uol.edu.pk (not student subdomain)
PROFESSOR_EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9._-]+@uol\.edu\.pk$",
    re.IGNORECASE,
)

# Numeric student ID only
STUDENT_ID_REGEX = re.compile(r"^[0-9]{5,12}$")

# Pakistani mobile: +923001234567 or 03001234567
PK_PHONE_REGEX = re.compile(r"^(?:\+92|0)?3[0-9]{9}$")


def normalize_phone(phone: str | None) -> str | None:
    """Normalize Pakistani phone to +92XXXXXXXXXX format."""
    if not phone or not str(phone).strip():
        return None
    cleaned = re.sub(r"[\s\-()]", "", phone.strip())
    if cleaned.startswith("+92"):
        digits = cleaned[3:]
    elif cleaned.startswith("92") and len(cleaned) == 12:
        digits = cleaned[2:]
    elif cleaned.startswith("0"):
        digits = cleaned[1:]
    else:
        digits = cleaned
    if not re.match(r"^3[0-9]{9}$", digits):
        return None
    return f"+92{digits}"


def validate_pakistani_phone(phone: str | None, required: bool = False) -> str | None:
    if not phone or not str(phone).strip():
        if required:
            raise ValueError("Phone number is required")
        return None
    normalized = normalize_phone(phone)
    if not normalized:
        raise ValueError(
            "Invalid Pakistani phone number. Use format +923001234567 or 03001234567"
        )
    return normalized


def validate_student_email(email: str) -> str:
    email = email.strip().lower()
    if not STUDENT_EMAIL_REGEX.match(email):
        raise ValueError(
            "Invalid UOL student email. Use format: 70140912@student.uol.edu.pk"
        )
    return email


def validate_professor_email(email: str) -> str:
    email = email.strip().lower()
    if "@student." in email:
        raise ValueError("Professors must use @uol.edu.pk email, not @student.uol.edu.pk")
    if not PROFESSOR_EMAIL_REGEX.match(email):
        raise ValueError(
            "Invalid UOL professor email. Use format: name@uol.edu.pk"
        )
    return email


def validate_student_id(student_id: str) -> str:
    sid = student_id.strip()
    if not STUDENT_ID_REGEX.match(sid):
        raise ValueError("Student ID must contain numbers only (e.g. 70140912)")
    return sid


def student_email_matches_id(email: str, student_id: str) -> None:
    """Ensure email local-part equals student ID."""
    local = email.split("@")[0]
    if local != student_id:
        raise ValueError(
            f"Student email must match your ID: {student_id}@student.uol.edu.pk"
        )
