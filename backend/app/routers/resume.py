from __future__ import annotations

import os
import re
from pathlib import Path
from ..services.resume_parser import extract_text, parse_resume_with_ai

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from ..models import UploadedResume, Resume
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Achievement, Education, Experience, Project, Resume, Skill, UploadedResume
from ..schemas import (
    ATSAnalyzeRequest,
    ATSAnalyzeResponse,
    JDMatchRequest,
    JDMatchResponse,
    OptimizeAIRequest,
    OptimizeAIResponse,
    ProfileUpdateResponse,
    ResumeCreateRequest,
    ResumeCardOut,
    ResumeOut,
    ResumeUpdateRequest,
    RewriteAIRequest,
    RewriteAIResponse,
    UploadResumeResponse,
)
from ..services.ai_service import ats_analyze, match_job_description, optimize_resume_ai, rewrite_resume_ai
from ..services.resume_service import optimize_resume_mock
from ..schemas import OptimizeRequest, OptimizeResponse
from ..models import (
    Resume,
    UploadedResume,
    Skill,
    Education,
    Experience,
    Project,
)

router = APIRouter()


def _require_own_resume(db: Session, current_user_id: int, resume_id: int) -> Resume:
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user_id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return resume


# -------------------- Resume CRUD --------------------


@router.post("/resumes", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
def create_resume(
    payload: ResumeCreateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Create main resume
    resume = Resume(
        user_id=current_user.id,
        title=payload.title,
        full_name=payload.personal.fullName,
        email=payload.personal.email,
        phone=payload.personal.phone,
        location=payload.personal.location,
        linkedin=payload.personal.linkedin,
        github=payload.personal.github,
        summary=payload.summary,
    )
    db.add(resume)
    db.flush()  # get resume.id

    # Child rows
    for edu in payload.education:
        db.add(Education(resume_id=resume.id, college=edu.college, degree=edu.degree, year=edu.year))

    for exp in payload.experience:
        db.add(Experience(
            resume_id=resume.id,
            company=exp.company,
            role=exp.role,
            duration=exp.duration,
            responsibilities=exp.responsibilities,
        ))

    for proj in payload.projects:
        db.add(Project(resume_id=resume.id, title=proj.title, description=proj.description))

    for skill in payload.skills:
        db.add(Skill(resume_id=resume.id, name=skill.name))

    for achievement_text in payload.achievements:
        db.add(Achievement(resume_id=resume.id, text=achievement_text))

    db.commit()
    db.refresh(resume)

    # Returning the ORM object directly (instead of a hand-built dict) means
    # ResumeOut / from_attributes handles serialization for us, including the
    # new summary/responsibilities/achievements fields automatically.
    return resume


@router.get("/resumes", response_model=list[ResumeCardOut])
def list_resumes(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.updated_at.desc())
        .all()
    )
    return resumes


@router.get("/resumes/{id}", response_model=ResumeOut)
def get_resume(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    resume = _require_own_resume(db, current_user.id, id)
    return resume


@router.put("/resumes/{id}", response_model=ResumeOut)
def update_resume(
    id: int,
    payload: ResumeUpdateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = _require_own_resume(db, current_user.id, id)

    resume.title = payload.title
    resume.full_name = payload.personal.fullName
    resume.email = payload.personal.email
    resume.phone = payload.personal.phone
    resume.location = payload.personal.location
    resume.linkedin = payload.personal.linkedin
    resume.github = payload.personal.github
    resume.summary = payload.summary

    # Replace children (simple and correct)
    db.query(Education).filter(Education.resume_id == resume.id).delete(synchronize_session=False)
    db.query(Experience).filter(Experience.resume_id == resume.id).delete(synchronize_session=False)
    db.query(Project).filter(Project.resume_id == resume.id).delete(synchronize_session=False)
    db.query(Skill).filter(Skill.resume_id == resume.id).delete(synchronize_session=False)
    db.query(Achievement).filter(Achievement.resume_id == resume.id).delete(synchronize_session=False)
    db.flush()

    for edu in payload.education:
        db.add(Education(resume_id=resume.id, college=edu.college, degree=edu.degree, year=edu.year))

    for exp in payload.experience:
        db.add(Experience(
            resume_id=resume.id,
            company=exp.company,
            role=exp.role,
            duration=exp.duration,
            responsibilities=exp.responsibilities,
        ))

    for proj in payload.projects:
        db.add(Project(resume_id=resume.id, title=proj.title, description=proj.description))

    for skill in payload.skills:
        db.add(Skill(resume_id=resume.id, name=skill.name))

    for achievement_text in payload.achievements:
        db.add(Achievement(resume_id=resume.id, text=achievement_text))

    db.commit()
    db.refresh(resume)
    return resume


@router.delete("/resumes/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    resume = _require_own_resume(db, current_user.id, id)
    db.delete(resume)
    db.commit()
    return None


# -------------------- Uploads --------------------


UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))


@router.post("/upload-resume", response_model=UploadResumeResponse)
def upload_resume(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Accept PDF/DOCX only
    content_type = (file.content_type or "").lower()
    filename = file.filename or "uploaded"
    ext = os.path.splitext(filename)[1].lower()
    allowed_ext = {".pdf", ".docx"}
    if ext not in allowed_ext and "pdf" not in content_type and "word" not in content_type:
        raise HTTPException(status_code=400, detail="Only PDF/DOCX files are supported")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", filename)
    storage_path = str((UPLOAD_DIR / f"user_{current_user.id}_{safe_name}").resolve())

    with open(storage_path, "wb") as out:
        out.write(file.file.read())

    uploaded = UploadedResume(
        user_id=current_user.id,
        filename=filename,
        content_type=file.content_type or "application/octet-stream",
        storage_path=storage_path,
    )
    db.add(uploaded)
    db.commit()
    db.refresh(uploaded)


    # -----------------------------
    # Extract Resume Text
    # -----------------------------
    text = extract_text(storage_path, content_type)

    # -----------------------------
    # Parse using AI
    # -----------------------------
    parsed = parse_resume_with_ai(text)

    # -----------------------------
    # Create Resume
    # -----------------------------
    resume = Resume(
        user_id=current_user.id,
        title=filename,
        full_name=parsed.get("full_name", ""),
        email=parsed.get("email", ""),
        phone=parsed.get("phone", ""),
        location=parsed.get("location", ""),
        linkedin=parsed.get("linkedin", ""),
        github=parsed.get("github", ""),
        summary=parsed.get("summary", ""),
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    # -----------------------------
    # Save Skills
    # -----------------------------
    for skill in parsed.get("skills", []):
        db.add(
            Skill(
                resume_id=resume.id,
                name=skill
            )
        )

    # -----------------------------
    # Save Education
    # -----------------------------
    for edu in parsed.get("education", []):
        db.add(
            Education(
                resume_id=resume.id,
                college=edu.get("college", ""),
                degree=edu.get("degree", ""),
                year=edu.get("year", "")
            )
        )

    # -----------------------------
    # Save Experience
    # -----------------------------
    for exp in parsed.get("experience", []):
        db.add(
            Experience(
                resume_id=resume.id,
                company=exp.get("company", ""),
                role=exp.get("role", ""),
                duration=exp.get("duration", ""),
                responsibilities=exp.get("responsibilities", "")
            )
        )

    # -----------------------------
    # Save Projects
    # -----------------------------
    for project in parsed.get("projects", []):
        db.add(
            Project(
                resume_id=resume.id,
                title=project.get("title", ""),
                description=project.get("description", "")
            )
        )

    # -----------------------------
    # Save Achievements
    # -----------------------------
    for achievement in parsed.get("achievements", []):
        db.add(
            Achievement(
                resume_id=resume.id,
                text=achievement if isinstance(achievement, str) else achievement.get("text", "")
            )
        )

    db.commit()

    return {
        "uploaded": uploaded,
        "resume": resume,
        "parsed": parsed
    }

# -------------------- Existing optimize (kept) --------------------


@router.post("/resume/optimize", response_model=OptimizeAIResponse)
def optimize_ai(payload: OptimizeAIRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    resume = _require_own_resume(db, current_user.id, payload.resume_id)

    resume_structured = {
        "personal": {
            "fullName": resume.full_name,
            "email": resume.email,
            "phone": resume.phone,
            "location": resume.location,
            "linkedin": resume.linkedin,
            "github": resume.github,
        },
        "education": [{"college": e.college, "degree": e.degree, "year": e.year} for e in (resume.education or [])],
        "experience": [{"company": x.company, "role": x.role, "duration": x.duration} for x in (resume.experience or [])],
        "projects": [{"title": p.title, "description": p.description} for p in (resume.projects or [])],
        "skills": [{"name": s.name} for s in (resume.skills or [])],
    }

    resume_text = "\n".join(
        [
            resume.full_name,
            resume.email,
            resume.phone,
            resume.location,
            resume.linkedin,
            resume.github,
            "Skills: " + ", ".join([s["name"] for s in resume_structured["skills"]]),
        ]
    )

    # Current score (original)
    current = ats_analyze(
        resume_text=resume_text,
        job_description=payload.job_description,
        resume_structured=resume_structured,
    )

    # Optimized text
    opt = optimize_resume_ai(
        resume_text=resume_text,
        job_description=payload.job_description,
        resume_structured=resume_structured,
    )

    improved = ats_analyze(
        resume_text=opt.ats_optimized_resume,
        job_description=payload.job_description,
        resume_structured=resume_structured,
    )

    # Keep suggestions format compatible for frontend (best effort)
    return OptimizeAIResponse(
        resume_id=resume.id,
        current_ats_score=current.ats_score,
        improved_ats_score=improved.ats_score,
        optimizedResume=opt.ats_optimized_resume,
        suggestions={
            "improvedSummary": opt.improved_summary,
            "betterExperiencePoints": opt.better_experience_points,
            "betterProjectDescriptions": opt.better_project_descriptions,
            "strongActionVerbs": opt.strong_action_verbs,
            "betterSkillsSection": opt.better_skills_section,
        },
    )


# -------------------- New AI endpoints --------------------


@router.post("/resume/ats-analyze", response_model=ATSAnalyzeResponse)
def ats_analyze_endpoint(
    payload: ATSAnalyzeRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = _require_own_resume(db, current_user.id, payload.resume_id)

    resume_structured = {
        "personal": {
            "fullName": resume.full_name,
            "email": resume.email,
            "phone": resume.phone,
            "location": resume.location,
            "linkedin": resume.linkedin,
            "github": resume.github,
        },
        "education": [{"college": e.college, "degree": e.degree, "year": e.year} for e in (resume.education or [])],
        "experience": [{"company": x.company, "role": x.role, "duration": x.duration} for x in (resume.experience or [])],
        "projects": [{"title": p.title, "description": p.description} for p in (resume.projects or [])],
        "skills": [{"name": s.name} for s in (resume.skills or [])],
    }

    resume_text = "\n".join(
        [
            resume.full_name,
            resume.email,
            resume.phone,
            resume.location,
            resume.linkedin,
            resume.github,
            "Skills: " + ", ".join([s.name for s in (resume.skills or [])]),
            "\nEducation: " + ", ".join([f"{e.degree} {e.college} {e.year}" for e in (resume.education or [])]),
            "\nExperience: " + ", ".join([f"{x.role} {x.company} {x.duration}" for x in (resume.experience or [])]),
            "\nProjects: " + ", ".join([f"{p.title} {p.description}" for p in (resume.projects or [])]),
        ]
    )

    analysis = ats_analyze(
        resume_text=resume_text,
        job_description=payload.job_description,
        resume_structured=resume_structured,
    )

    return ATSAnalyzeResponse(
        resume_id=resume.id,
        ats_score=analysis.ats_score,
        overall_rating=analysis.overall_rating,
        missing_keywords=analysis.missing_keywords,
        matching_keywords=analysis.matching_keywords,
        missing_skills=analysis.missing_skills,
        matching_skills=analysis.matching_skills,
        weak_action_verbs=analysis.weak_action_verbs,
        strong_action_verbs_suggestions=analysis.strong_action_verbs_suggestions,
        grammar_suggestions=analysis.grammar_suggestions,
        formatting_suggestions=analysis.formatting_suggestions,
        contact_information_validation=analysis.contact_information_validation,
        education_validation=analysis.education_validation,
        experience_validation=analysis.experience_validation,
        projects_validation=analysis.projects_validation,
    )




@router.post("/resume/rewrite-ai", response_model=RewriteAIResponse)
def rewrite_ai_endpoint(
    payload: RewriteAIRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = _require_own_resume(db, current_user.id, payload.resume_id)

    resume_structured = {
        "personal": {
            "fullName": resume.full_name,
            "email": resume.email,
            "phone": resume.phone,
            "location": resume.location,
            "linkedin": resume.linkedin,
            "github": resume.github,
        },
        "education": [{"college": e.college, "degree": e.degree, "year": e.year} for e in (resume.education or [])],
        "experience": [{"company": x.company, "role": x.role, "duration": x.duration} for x in (resume.experience or [])],
        "projects": [{"title": p.title, "description": p.description} for p in (resume.projects or [])],
        "skills": [{"name": s.name} for s in (resume.skills or [])],
    }

    resume_text = "\n".join(
        [
            resume.full_name,
            resume.email,
            resume.phone,
            resume.location,
            resume.linkedin,
            resume.github,
            "Skills: " + ", ".join([s.name for s in (resume.skills or [])]),
        ]
    )

    result = rewrite_resume_ai(
        resume_text=resume_text,
        job_description=payload.job_description,
        resume_structured=resume_structured,
    )

    return RewriteAIResponse(
        resume_id=resume.id,
        betterSummary=result.better_summary,
        betterExperience=result.better_experience,
        betterProjects=result.better_projects,
    )

# NOTE: This second "/resume/optimize" route is unreachable — FastAPI matches
# routes in registration order, so the OptimizeAIResponse version above will
# always handle requests to this path first. Consider renaming this route
# (e.g. "/resume/optimize-mock") or removing it if it's no longer used.
@router.post("/resume/optimize", response_model=OptimizeResponse)
def optimize_resume(
    request: OptimizeRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = _require_own_resume(db, current_user.id, request.resume_id)

    score = 82

    suggestions = {
        "Missing Skills": [
            "Docker",
            "CI/CD",
            "Unit Testing",
        ],
        "Improve Experience": [
            "Add measurable achievements.",
            "Use stronger action verbs.",
        ],
        "Formatting": [
            "Keep resume to one page.",
            "Use ATS-friendly headings.",
        ],
    }

    optimized_resume = f"""
{resume.full_name}
{resume.email}
{resume.phone}

SUMMARY
Results-driven software engineer with experience in Python, FastAPI, React and SQL.

SKILLS
Python
FastAPI
React
SQL
Git

EXPERIENCE
• Improved API performance.
• Developed scalable backend services.
• Built responsive frontend applications.
"""

    return OptimizeResponse(
        resume_id=resume.id,
        ats_score=score,
        optimizedResume=optimized_resume,
        suggestions=suggestions,
    )