from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr

    phone: str
    location: str
    linkedin: str
    github: str
    portfolio: str
    job_title: str
    summary: str

    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, value: str):
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password cannot be longer than 72 bytes")
        return value








class SignupResponse(BaseModel):
    user: UserOut


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class MeResponse(BaseModel):
    user: UserOut


class EducationIn(BaseModel):
    college: str
    degree: str
    year: str


class EducationOut(EducationIn):
    id: int

    class Config:
        from_attributes = True


class ExperienceIn(BaseModel):
    company: str
    role: str
    duration: str
    responsibilities: str = ""


class ExperienceOut(ExperienceIn):
    id: int

    class Config:
        from_attributes = True


class ProjectIn(BaseModel):
    title: str
    description: str


class ProjectOut(ProjectIn):
    id: int

    class Config:
        from_attributes = True


class SkillIn(BaseModel):
    name: str


class SkillOut(SkillIn):
    id: int

    class Config:
        from_attributes = True


class AchievementIn(BaseModel):
    text: str


class AchievementOut(AchievementIn):
    id: int

    class Config:
        from_attributes = True


class PersonalDetailsIn(BaseModel):
    fullName: str
    email: str
    phone: str
    location: str
    linkedin: str
    github: str



class PersonalDetailsOut(PersonalDetailsIn):
    class Config:
        from_attributes = True


class ResumeCreateRequest(BaseModel):
    title: str = "Resume"
    personal: PersonalDetailsIn
    summary: str = ""
    education: list[EducationIn] = []
    experience: list[ExperienceIn] = []
    projects: list[ProjectIn] = []
    skills: list[SkillIn] = []
    achievements: list[str] = []


class ResumeUpdateRequest(BaseModel):
    title: str
    personal: PersonalDetailsIn
    summary: str = ""
    education: list[EducationIn] = []
    experience: list[ExperienceIn] = []
    projects: list[ProjectIn] = []
    skills: list[SkillIn] = []
    achievements: list[str] = []


class ResumeCardOut(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ResumeOut(BaseModel):
    id: int
    user_id: int
    title: str
    personal: PersonalDetailsOut
    summary: str
    education: list[EducationOut]
    experience: list[ExperienceOut]
    projects: list[ProjectOut]
    skills: list[SkillOut]
    achievements: list[AchievementOut]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UploadedResumeOut(BaseModel):
    id: int
    filename: str
    content_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class UploadResumeResponse(BaseModel):
    uploaded: UploadedResumeOut


class ATSAnalyzeRequest(BaseModel):
    resume_id: int
    job_description: str | None = None


class ATSAnalyzeResponse(BaseModel):
    resume_id: int
    ats_score: int
    overall_rating: str

    missing_keywords: list[str]
    matching_keywords: list[str]

    missing_skills: list[str]
    matching_skills: list[str]

    weak_action_verbs: list[str]
    strong_action_verbs_suggestions: list[str]

    grammar_suggestions: list[str]
    formatting_suggestions: list[str]

    contact_information_validation: dict[str, Any]
    education_validation: dict[str, Any]
    experience_validation: dict[str, Any]
    projects_validation: dict[str, Any]


class JDMatchRequest(BaseModel):
    resume_id: int
    job_description: str


class JDMatchResponse(BaseModel):
    resume_id: int
    match_percentage: int

    missing_keywords: list[str]
    matching_keywords: list[str]

    missing_skills: list[str]
    matching_skills: list[str]

    ats_score: int
    suggestions: list[str]


class OptimizeAIRequest(BaseModel):
    resume_id: int
    job_description: str | None = None


class OptimizeAIResponse(BaseModel):
    resume_id: int
    current_ats_score: int
    improved_ats_score: int

    optimizedResume: str
    suggestions: dict[str, Any]


class RewriteAIRequest(BaseModel):
    resume_id: int
    job_description: str | None = None


class RewriteAIResponse(BaseModel):
    resume_id: int
    betterSummary: str
    betterExperience: list[str]
    betterProjects: list[str]


# Backwards compatibility: keep existing mock endpoint types.
class OptimizeRequest(BaseModel):
    resume_id: int
    job_description: str


class OptimizeResponse(BaseModel):
    resume_id: int
    ats_score: int
    optimizedResume: str
    suggestions: dict[str, list[str]]





class ProfileUpdateRequest(BaseModel):
    name: str
    phone: str
    location: str
    linkedin: str
    github: str
    portfolio: str
    job_title: str
    summary: str

class ProfileUpdateResponse(BaseModel):
    user: UserOut


class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    resume_id: int
    job_description: str

class FinalReportRequest(BaseModel):
    results: list
    resume_id: int
    job_description: str
