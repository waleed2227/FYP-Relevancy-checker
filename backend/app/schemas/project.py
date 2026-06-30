from datetime import date

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.utils.proposal_validators import (
    REQUIRED_TEXT_FIELDS,
    validate_proposal_text,
    validate_technologies,
)


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=10, max_length=500)
    technologies: str = Field(..., min_length=2, max_length=500)
    description: str = Field(..., min_length=100)
    professor_email: EmailStr
    category: str | None = None
    target_industry: str = Field(..., min_length=3)
    problem_statement: str = Field(..., min_length=80)
    current_challenges: str | None = None
    existing_solutions: str = Field(..., min_length=50)
    existing_solution_limitations: str | None = None
    proposed_solution: str = Field(..., min_length=80)
    project_scope: str = Field(..., min_length=50)
    unique_features: str = Field(..., min_length=40)
    innovation_aspect: str = Field(..., min_length=40)
    competitive_advantage: str | None = None
    market_gap: str | None = None
    target_users: str = Field(..., min_length=20)
    secondary_target_users: str | None = None
    ai_technologies_used: str | None = None
    technical_feasibility: str | None = None
    financial_feasibility: str | None = None
    operational_feasibility: str | None = None
    expected_impact: str = Field(..., min_length=40)
    academic_impact: str = Field(..., min_length=50)
    business_impact: str | None = None
    social_impact: str | None = None
    future_enhancements: str | None = None
    scalability_opportunities: str | None = None
    commercialization_potential: str | None = None
    privacy_concerns: str | None = None
    security_concerns: str | None = None
    ethical_considerations: str | None = None
    future_scope: str | None = None
    risk_assessment: str | None = None

    @field_validator("technologies")
    @classmethod
    def check_technologies(cls, v: str) -> str:
        return validate_technologies(v)

    @model_validator(mode="after")
    def check_required_text_fields(self) -> "ProjectCreate":
        for field, (min_len, label) in REQUIRED_TEXT_FIELDS.items():
            if field == "technologies":
                continue
            value = getattr(self, field, None)
            validate_proposal_text(value, min_length=min_len, label=label)
        return self


class ProjectUpdate(BaseModel):
    title: str | None = Field(None, min_length=10, max_length=500)
    technologies: str | None = Field(None, min_length=2, max_length=500)
    description: str | None = Field(None, min_length=100)
    professor_email: EmailStr | None = None
    category: str | None = None
    target_industry: str | None = None
    problem_statement: str | None = None
    current_challenges: str | None = None
    existing_solutions: str | None = None
    existing_solution_limitations: str | None = None
    proposed_solution: str | None = None
    project_scope: str | None = None
    unique_features: str | None = None
    innovation_aspect: str | None = None
    competitive_advantage: str | None = None
    market_gap: str | None = None
    target_users: str | None = None
    secondary_target_users: str | None = None
    ai_technologies_used: str | None = None
    technical_feasibility: str | None = None
    financial_feasibility: str | None = None
    operational_feasibility: str | None = None
    expected_impact: str | None = None
    academic_impact: str | None = None
    business_impact: str | None = None
    social_impact: str | None = None
    future_enhancements: str | None = None
    scalability_opportunities: str | None = None
    commercialization_potential: str | None = None
    privacy_concerns: str | None = None
    security_concerns: str | None = None
    ethical_considerations: str | None = None
    future_scope: str | None = None
    risk_assessment: str | None = None

    @field_validator("technologies")
    @classmethod
    def check_technologies(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return validate_technologies(v)

    @model_validator(mode="after")
    def check_text_fields_when_present(self) -> "ProjectUpdate":
        for field, (min_len, label) in REQUIRED_TEXT_FIELDS.items():
            if field == "technologies":
                continue
            value = getattr(self, field, None)
            if value is not None:
                validate_proposal_text(value, min_length=min_len, label=label)
        return self


class ProjectResponse(BaseModel):
    id: int
    title: str
    technologies: str
    description: str
    category: str | None = None
    targetIndustry: str | None = None
    problemStatement: str | None = None
    currentChallenges: str | None = None
    existingSolutions: str | None = None
    existingSolutionLimitations: str | None = None
    proposedSolution: str | None = None
    projectScope: str | None = None
    uniqueFeatures: str | None = None
    innovationAspect: str | None = None
    competitiveAdvantage: str | None = None
    marketGap: str | None = None
    primaryTargetUsers: str | None = None
    secondaryTargetUsers: str | None = None
    aiTechnologiesUsed: str | None = None
    technicalFeasibility: str | None = None
    financialFeasibility: str | None = None
    operationalFeasibility: str | None = None
    expectedImpact: str | None = None
    academicImpact: str | None = None
    businessImpact: str | None = None
    socialImpact: str | None = None
    futureEnhancements: str | None = None
    scalabilityOpportunities: str | None = None
    commercializationPotential: str | None = None
    privacyConcerns: str | None = None
    securityConcerns: str | None = None
    ethicalConsiderations: str | None = None
    futureScope: str | None = None
    riskAssessment: str | None = None
    submittedDate: str
    status: str
    relevancyScore: float | None = None
    professor: str | None = None
    professorEmail: str
    feedback: str | None = None

    model_config = {"from_attributes": True}


class MatchedProjectResponse(BaseModel):
    id: int
    project_id: int | None = None
    title: str
    similarity: float
    year: str | None = None
    status: str | None = None
    author: str | None = None
    category: str | None = None
    risk_level: str
    description: str | None = None


class RelevancyInsight(BaseModel):
    label: str
    value: str
    description: str


class RelevancyExplanation(BaseModel):
    similarity_score: float | None = None
    why_relevant: str | None = None
    similar_projects_summary: str | None = None
    objectives_overlap: str | None = None
    problem_domains_overlap: str | None = None
    unique_aspects: str | None = None
    novelty_suggestions: list[str] = []
    ollama_model: str | None = None
    status: str | None = None


class RelevancyResultResponse(BaseModel):
    overall_score: float
    is_high_relevancy: bool
    insights: list[RelevancyInsight]
    matched_projects: list[MatchedProjectResponse]
    explanation: RelevancyExplanation | None = None
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
    category: str | None = None
    targetIndustry: str | None = None
    problemStatement: str | None = None
    currentChallenges: str | None = None
    existingSolutions: str | None = None
    existingSolutionLimitations: str | None = None
    proposedSolution: str | None = None
    projectScope: str | None = None
    uniqueFeatures: str | None = None
    innovationAspect: str | None = None
    competitiveAdvantage: str | None = None
    marketGap: str | None = None
    primaryTargetUsers: str | None = None
    secondaryTargetUsers: str | None = None
    aiTechnologiesUsed: str | None = None
    technicalFeasibility: str | None = None
    financialFeasibility: str | None = None
    operationalFeasibility: str | None = None
    expectedImpact: str | None = None
    academicImpact: str | None = None
    businessImpact: str | None = None
    socialImpact: str | None = None
    futureEnhancements: str | None = None
    scalabilityOpportunities: str | None = None
    commercializationPotential: str | None = None
    privacyConcerns: str | None = None
    securityConcerns: str | None = None
    ethicalConsiderations: str | None = None
    futureScope: str | None = None
    riskAssessment: str | None = None
    submittedDate: str
    professorName: str | None = None
    professorEmail: str | None = None
    relevancyScore: float | None = None
    status: str
    feedback: str | None = None
    innovationScore: float | None = None
    similarityScore: float | None = None
    feasibilityScore: float | None = None
    aiConfidence: float | None = None
    aiExplanation: RelevancyExplanation | None = None


class ReviewCreate(BaseModel):
    action: str = Field(..., pattern="^(approve|reject|revision)$")
    feedback: str = Field(..., min_length=5)


class DashboardStats(BaseModel):
    total: int
    approved: int
    pending: int
    rejected: int
