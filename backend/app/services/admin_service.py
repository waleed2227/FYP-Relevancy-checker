"""Admin dashboard and management services."""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.security import hash_password
from app.models.admin import Admin
from app.models.department import Department
from app.models.notification import Notification
from app.models.professor import Professor
from app.models.project import ProjectIdea, ProjectStatus
from app.models.review import Review, ReviewAction
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.admin import (
    AdminCreateUserRequest,
    AdminDashboardStats,
    AdminUpdateProfessorRequest,
    DashboardActivityItem,
    DashboardDepartmentItem,
    DepartmentResponse,
    DuplicateAlertItem,
    ProfessorDetailResponse,
    ProfessorListItem,
    ProfessorProjectItem,
    ProfessorReviewHistoryItem,
    ProfessorStatsResponse,
    StudentListItem,
    UserListItem,
)
from app.services import duplicate_service
from app.services.auth_service import get_user_by_email
from app.utils.exceptions import bad_request, conflict, not_found

_ACTIVITY_LIMIT = 10
_SOURCE_FETCH_LIMIT = 8


async def _fetch_recent_activities(db: AsyncSession) -> list[DashboardActivityItem]:
    """Merge latest events from projects, reviews, notifications, and user signups."""
    activities: list[tuple[datetime, DashboardActivityItem]] = []

    project_rows = await db.execute(
        select(ProjectIdea)
        .options(selectinload(ProjectIdea.student).selectinload(Student.user))
        .order_by(ProjectIdea.created_at.desc())
        .limit(_SOURCE_FETCH_LIMIT)
    )
    for project in project_rows.scalars().all():
        student_name = project.student.user.full_name if project.student else "A student"
        activities.append(
            (
                project.created_at,
                DashboardActivityItem(
                    id=f"project-{project.id}",
                    type="submission",
                    title="New Project Submitted",
                    description=f'{student_name} submitted "{project.title}"',
                    occurredAt=project.created_at,
                    color="blue",
                ),
            )
        )

    review_rows = await db.execute(
        select(Review)
        .options(
            selectinload(Review.project),
            selectinload(Review.professor).selectinload(Professor.user),
        )
        .order_by(Review.created_at.desc())
        .limit(_SOURCE_FETCH_LIMIT)
    )
    review_meta = {
        ReviewAction.APPROVE: ("approval", "Project Approved", "green"),
        ReviewAction.REJECT: ("rejection", "Project Rejected", "red"),
        ReviewAction.REVISION: ("revision", "Revision Requested", "purple"),
    }
    for review in review_rows.scalars().all():
        activity_type, title, color = review_meta[review.action]
        professor_name = review.professor.user.full_name if review.professor else "Professor"
        project_title = review.project.title if review.project else "a project"
        activities.append(
            (
                review.created_at,
                DashboardActivityItem(
                    id=f"review-{review.id}",
                    type=activity_type,
                    title=title,
                    description=f'{professor_name} reviewed "{project_title}"',
                    occurredAt=review.created_at,
                    color=color,
                ),
            )
        )

    notification_rows = await db.execute(
        select(Notification).order_by(Notification.created_at.desc()).limit(_SOURCE_FETCH_LIMIT)
    )
    for notification in notification_rows.scalars().all():
        activities.append(
            (
                notification.created_at,
                DashboardActivityItem(
                    id=f"notification-{notification.id}",
                    type=notification.type.value,
                    title=notification.title,
                    description=notification.message,
                    occurredAt=notification.created_at,
                    color=notification.color or "orange",
                ),
            )
        )

    user_rows = await db.execute(
        select(User)
        .where(User.role != UserRole.ADMIN)
        .order_by(User.created_at.desc())
        .limit(_SOURCE_FETCH_LIMIT)
    )
    role_labels = {
        UserRole.STUDENT: "Student",
        UserRole.PROFESSOR: "Professor",
    }
    for user in user_rows.scalars().all():
        role_label = role_labels.get(user.role, user.role.value.title())
        activities.append(
            (
                user.created_at,
                DashboardActivityItem(
                    id=f"user-{user.id}",
                    type="registration",
                    title="New Account Registered",
                    description=f"{user.full_name} joined as {role_label}",
                    occurredAt=user.created_at,
                    color="teal",
                ),
            )
        )

    activities.sort(key=lambda row: row[0], reverse=True)
    seen: set[str] = set()
    unique: list[DashboardActivityItem] = []
    for _, item in activities:
        if item.id in seen:
            continue
        seen.add(item.id)
        unique.append(item)
        if len(unique) >= _ACTIVITY_LIMIT:
            break
    return unique


async def _fetch_department_breakdown(db: AsyncSession) -> list[DashboardDepartmentItem]:
    departments = await list_departments(db)
    total_projects = sum(d.projectCount for d in departments)
    breakdown = [
        DashboardDepartmentItem(
            department=d.name,
            projects=d.projectCount,
            students=d.studentCount,
            professors=d.professorCount,
            percentage=round((d.projectCount / total_projects) * 100, 1) if total_projects else 0.0,
        )
        for d in departments
    ]
    breakdown.sort(key=lambda row: row.projects, reverse=True)
    return breakdown


async def get_admin_stats(db: AsyncSession) -> AdminDashboardStats:
    students = await db.scalar(select(func.count(Student.id))) or 0
    professors = await db.scalar(select(func.count(Professor.id))) or 0
    submitted = await db.scalar(select(func.count(ProjectIdea.id))) or 0
    approved = await db.scalar(
        select(func.count(ProjectIdea.id)).where(ProjectIdea.status == ProjectStatus.APPROVED)
    ) or 0
    rejected = await db.scalar(
        select(func.count(ProjectIdea.id)).where(ProjectIdea.status == ProjectStatus.REJECTED)
    ) or 0
    recent_activities = await _fetch_recent_activities(db)
    department_breakdown = await _fetch_department_breakdown(db)
    raw_alerts = await duplicate_service.list_pending_duplicate_alerts(db)
    duplicate_alerts = [DuplicateAlertItem(**item) for item in raw_alerts]
    duplicates = len(duplicate_alerts)
    return AdminDashboardStats(
        totalStudents=students,
        totalProfessors=professors,
        submittedProjects=submitted,
        approvedProjects=approved,
        rejectedProjects=rejected,
        aiDuplicateAlerts=duplicates,
        recentActivities=recent_activities,
        departmentBreakdown=department_breakdown,
        duplicateAlerts=duplicate_alerts,
    )


async def list_all_users(db: AsyncSession) -> list[UserListItem]:
    result = await db.execute(
        select(User)
        .options(selectinload(User.student), selectinload(User.professor))
        .order_by(User.created_at.desc())
    )
    items = []
    for u in result.scalars().all():
        dept = "Administration"
        if u.student:
            dept = u.student.major or "N/A"
        elif u.professor and u.professor.department_id:
            dept_result = await db.get(Department, u.professor.department_id)
            dept = dept_result.name if dept_result else "N/A"

        proj_count = 0
        if u.role == UserRole.STUDENT and u.student:
            proj_count = await db.scalar(
                select(func.count(ProjectIdea.id)).where(ProjectIdea.student_id == u.student.id)
            ) or 0
        elif u.role == UserRole.PROFESSOR and u.professor:
            proj_count = await db.scalar(
                select(func.count(ProjectIdea.id)).where(ProjectIdea.professor_id == u.professor.id)
            ) or 0

        items.append(
            UserListItem(
                id=u.id,
                name=u.full_name,
                email=u.email,
                role=u.role.value,
                department=dept,
                status="active" if u.is_active else "inactive",
                joinedDate=u.created_at.date().isoformat(),
                projectsCount=proj_count,
            )
        )
    return items


async def list_students(db: AsyncSession) -> list[StudentListItem]:
    result = await db.execute(
        select(Student).options(selectinload(Student.user), selectinload(Student.department))
    )
    items = []
    for s in result.scalars().all():
        count = await db.scalar(
            select(func.count(ProjectIdea.id)).where(ProjectIdea.student_id == s.id)
        ) or 0
        items.append(
            StudentListItem(
                id=s.id,
                name=s.user.full_name,
                email=s.user.email,
                studentId=s.student_id,
                department=s.department.name if s.department else (s.major or "N/A"),
                status="active" if s.user.is_active else "inactive",
                projectsCount=count,
                joinedDate=s.user.created_at.date().isoformat(),
            )
        )
    return items


async def list_professors(db: AsyncSession) -> list[ProfessorListItem]:
    result = await db.execute(
        select(Professor).options(selectinload(Professor.user), selectinload(Professor.department))
    )
    items = []
    for p in result.scalars().all():
        count = await db.scalar(
            select(func.count(ProjectIdea.id)).where(ProjectIdea.professor_id == p.id)
        ) or 0
        items.append(
            ProfessorListItem(
                id=p.id,
                name=p.user.full_name,
                email=p.user.email,
                department=p.department.name if p.department else "N/A",
                status="active" if p.user.is_active else "inactive",
                projectsSupervised=count,
                joinedDate=p.user.created_at.date().isoformat(),
                phone=p.user.phone,
                photoUrl=p.user.photo_url,
                professorId=p.employee_id or f"PROF{p.id:03d}",
                specialization=p.specialization,
            )
        )
    return items


async def get_professor_stats(db: AsyncSession) -> ProfessorStatsResponse:
    total = await db.scalar(select(func.count(Professor.id))) or 0
    active = await db.scalar(
        select(func.count(Professor.id))
        .join(Professor.user)
        .where(User.is_active.is_(True))
    ) or 0
    total_supervised = await db.scalar(
        select(func.count(ProjectIdea.id)).where(ProjectIdea.professor_id.isnot(None))
    ) or 0
    avg_relevancy = await db.scalar(
        select(func.avg(ProjectIdea.relevancy_score)).where(
            ProjectIdea.professor_id.isnot(None),
            ProjectIdea.relevancy_score.isnot(None),
        )
    )
    average_rating = round(float(avg_relevancy or 0) / 20, 1) if avg_relevancy else 0.0
    if average_rating > 5.0:
        average_rating = 5.0
    return ProfessorStatsResponse(
        totalProfessors=total,
        activeProfessors=active,
        totalSupervisedProjects=total_supervised,
        averageRating=average_rating,
    )


async def get_professor_detail(db: AsyncSession, professor_id: int) -> ProfessorDetailResponse:
    result = await db.execute(
        select(Professor)
        .where(Professor.id == professor_id)
        .options(
            selectinload(Professor.user),
            selectinload(Professor.department),
            selectinload(Professor.supervised_projects).selectinload(ProjectIdea.student).selectinload(Student.user),
            selectinload(Professor.reviews)
            .selectinload(Review.project)
            .selectinload(ProjectIdea.student)
            .selectinload(Student.user),
        )
    )
    professor = result.scalar_one_or_none()
    if not professor or not professor.user:
        raise not_found("Professor")

    assigned = []
    for project in sorted(professor.supervised_projects, key=lambda p: p.submitted_date, reverse=True):
        student_name = project.student.user.full_name if project.student and project.student.user else "Unknown"
        assigned.append(
            ProfessorProjectItem(
                id=project.id,
                title=project.title,
                studentName=student_name,
                status=project.status.value,
                submittedDate=project.submitted_date.isoformat(),
                relevancyScore=project.relevancy_score,
            )
        )

    review_history = []
    for review in sorted(professor.reviews, key=lambda r: r.created_at, reverse=True):
        project = review.project
        student_name = "Unknown"
        project_title = "Unknown project"
        if project:
            project_title = project.title
            if project.student and project.student.user:
                student_name = project.student.user.full_name
        review_history.append(
            ProfessorReviewHistoryItem(
                id=review.id,
                projectTitle=project_title,
                studentName=student_name,
                action=review.action.value,
                feedback=review.feedback,
                createdAt=review.created_at.isoformat(),
            )
        )

    return ProfessorDetailResponse(
        id=professor.id,
        name=professor.user.full_name,
        email=professor.user.email,
        phone=professor.user.phone,
        photoUrl=professor.user.photo_url,
        professorId=professor.employee_id or f"PROF{professor.id:03d}",
        department=professor.department.name if professor.department else "N/A",
        specialization=professor.specialization,
        status="active" if professor.user.is_active else "inactive",
        joinedDate=professor.user.created_at.date().isoformat(),
        projectsSupervised=len(assigned),
        assignedProjects=assigned,
        reviewHistory=review_history,
    )


async def update_professor(
    db: AsyncSession, professor_id: int, data: AdminUpdateProfessorRequest
) -> ProfessorListItem:
    result = await db.execute(
        select(Professor)
        .where(Professor.id == professor_id)
        .options(selectinload(Professor.user), selectinload(Professor.department))
    )
    professor = result.scalar_one_or_none()
    if not professor or not professor.user:
        raise not_found("Professor")

    user = professor.user
    if data.email and data.email != user.email:
        existing = await get_user_by_email(db, data.email)
        if existing and existing.id != user.id:
            raise conflict("Email already registered")
        user.email = data.email

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone_number is not None:
        user.phone = data.phone_number
    if data.status is not None:
        user.is_active = data.status == "active"
    if data.specialization is not None:
        professor.specialization = data.specialization or None
    if data.department is not None:
        dept = await _resolve_department(db, data.department)
        professor.department_id = dept.id if dept else None

    await db.flush()
    count = await db.scalar(
        select(func.count(ProjectIdea.id)).where(ProjectIdea.professor_id == professor.id)
    ) or 0
    return ProfessorListItem(
        id=professor.id,
        name=user.full_name,
        email=user.email,
        department=professor.department.name if professor.department else "N/A",
        status="active" if user.is_active else "inactive",
        projectsSupervised=count,
        joinedDate=user.created_at.date().isoformat(),
        phone=user.phone,
        photoUrl=user.photo_url,
        professorId=professor.employee_id or f"PROF{professor.id:03d}",
        specialization=professor.specialization,
    )


async def delete_professor(db: AsyncSession, professor_id: int) -> None:
    result = await db.execute(
        select(Professor)
        .where(Professor.id == professor_id)
        .options(selectinload(Professor.user))
    )
    professor = result.scalar_one_or_none()
    if not professor or not professor.user:
        raise not_found("Professor")

    active_count = await db.scalar(
        select(func.count(ProjectIdea.id)).where(
            ProjectIdea.professor_id == professor_id,
            ProjectIdea.status.in_([ProjectStatus.PENDING, ProjectStatus.REVISION]),
        )
    ) or 0
    if active_count > 0:
        raise bad_request(
            f"Cannot delete professor: {active_count} active project(s) are still assigned "
            "(pending or revision). Reassign or complete reviews first."
        )

    await db.delete(professor.user)


async def list_departments(db: AsyncSession) -> list[DepartmentResponse]:
    result = await db.execute(select(Department))
    items = []
    for d in result.scalars().all():
        sc = await db.scalar(select(func.count(Student.id)).where(Student.department_id == d.id)) or 0
        pc = await db.scalar(select(func.count(Professor.id)).where(Professor.department_id == d.id)) or 0
        proj = await db.scalar(
            select(func.count(ProjectIdea.id))
            .join(Student, ProjectIdea.student_id == Student.id)
            .where(Student.department_id == d.id)
        ) or 0
        items.append(
            DepartmentResponse(
                id=d.id,
                name=d.name,
                code=d.code,
                headProfessor=d.head_professor,
                studentCount=sc,
                professorCount=pc,
                projectCount=proj,
                description=d.description,
            )
        )
    return items


async def _resolve_department(db: AsyncSession, name: str | None) -> Department | None:
    if not name or not name.strip():
        return None
    result = await db.execute(select(Department).where(Department.name.ilike(name.strip())))
    dept = result.scalar_one_or_none()
    if not dept:
        dept = Department(name=name.strip())
        db.add(dept)
        await db.flush()
    return dept


async def _user_to_list_item(db: AsyncSession, user: User) -> UserListItem:
    dept = "Administration"
    if user.student:
        dept = user.student.major or "N/A"
        if user.student.department:
            dept = user.student.department.name
    elif user.professor and user.professor.department_id:
        dept_result = await db.get(Department, user.professor.department_id)
        dept = dept_result.name if dept_result else "N/A"

    proj_count = 0
    if user.role == UserRole.STUDENT and user.student:
        proj_count = await db.scalar(
            select(func.count(ProjectIdea.id)).where(ProjectIdea.student_id == user.student.id)
        ) or 0
    elif user.role == UserRole.PROFESSOR and user.professor:
        proj_count = await db.scalar(
            select(func.count(ProjectIdea.id)).where(ProjectIdea.professor_id == user.professor.id)
        ) or 0

    return UserListItem(
        id=user.id,
        name=user.full_name,
        email=user.email,
        role=user.role.value,
        department=dept,
        status="active" if user.is_active else "inactive",
        joinedDate=user.created_at.date().isoformat(),
        projectsCount=proj_count,
    )


async def create_user(db: AsyncSession, data: AdminCreateUserRequest) -> UserListItem:
    """Create a student, professor, or admin account (admin-only)."""
    if await get_user_by_email(db, data.email):
        raise conflict("Email already registered")

    role_map = {
        "student": UserRole.STUDENT,
        "professor": UserRole.PROFESSOR,
        "admin": UserRole.ADMIN,
    }
    role = role_map[data.role]

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=role,
        phone=data.phone_number,
    )
    db.add(user)
    await db.flush()

    dept = await _resolve_department(db, data.department)

    if role == UserRole.STUDENT:
        existing_sid = await db.execute(select(Student).where(Student.student_id == data.student_id))
        if existing_sid.scalar_one_or_none():
            raise conflict("Student ID already exists")
        db.add(
            Student(
                user_id=user.id,
                student_id=data.student_id,
                department_id=dept.id if dept else None,
                major=dept.name if dept else None,
                year="4th Year",
            )
        )
    elif role == UserRole.PROFESSOR:
        db.add(
            Professor(
                user_id=user.id,
                department_id=dept.id if dept else None,
                specialization=data.specialization,
            )
        )
    else:
        db.add(Admin(user_id=user.id))

    await db.flush()
    result = await db.execute(
        select(User)
        .where(User.id == user.id)
        .options(
            selectinload(User.student).selectinload(Student.department),
            selectinload(User.professor),
        )
    )
    loaded = result.scalar_one()
    return await _user_to_list_item(db, loaded)
