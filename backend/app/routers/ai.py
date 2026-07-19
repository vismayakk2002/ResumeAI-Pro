from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Resume
from ..schemas import EvaluateAnswerRequest, FinalReportRequest
from ..services.ai_service import (
    ats_analyze,
    match_job_description,
    rewrite_resume_ai,
    optimize_resume_ai,
    generate_cover_letter_ai,
    generate_interview_questions_ai,
    evaluate_answer_ai,
    generate_final_report_ai,
)

router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


def _require_own_resume(db, user_id: int, resume_id: int):
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == user_id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    return resume


def resume_to_dict(resume):

    return {
        "personal": {
            "fullName": resume.full_name,
            "email": resume.email,
            "phone": resume.phone,
            "location": resume.location,
            "linkedin": resume.linkedin,
            "github": resume.github,
        },

        "title": resume.title,

        "education": [
            {
                "college": edu.college,
                "degree": edu.degree,
                "year": edu.year
            }
            for edu in resume.education
        ],

        "experience": [
            {
                "company": exp.company,
                "role": exp.role,
                "duration": exp.duration
            }
            for exp in resume.experience
        ],

        "projects": [
            {
                "title": project.title,
                "description": project.description
            }
            for project in resume.projects
        ],

        "skills": [
            skill.name
            for skill in resume.skills
        ]
    }


# --------------------------------------------------------
# ATS ANALYSIS
# --------------------------------------------------------

@router.post("/ats/{resume_id}")
def analyze_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    resume = _require_own_resume(db, user.id, resume_id)

    try:
        result = ats_analyze(resume_structured=resume_to_dict(resume))
    except Exception as e:
        print("ATS ANALYZE ERROR:", e)
        raise HTTPException(status_code=500, detail=f"ATS analysis failed: {e}")

    return result


# --------------------------------------------------------
# JOB DESCRIPTION MATCH
# --------------------------------------------------------

@router.post("/match/{resume_id}")
def match_resume(
    resume_id: int,
    job_description: str,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    resume = _require_own_resume(db, user.id, resume_id)

    try:
        result = match_job_description(
            resume_text="",
            job_description=job_description,
            resume_structured=resume_to_dict(resume)
        )
    except Exception as e:
        print("MATCH ERROR:", e)
        raise HTTPException(status_code=500, detail=f"Job description match failed: {e}")

    return result


# --------------------------------------------------------
# RESUME REWRITE
# --------------------------------------------------------

@router.post("/rewrite/{resume_id}")
def rewrite_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    resume = _require_own_resume(db, user.id, resume_id)

    try:
        result = rewrite_resume_ai(
            resume_text="",
            resume_structured=resume_to_dict(resume)
        )
    except Exception as e:
        print("REWRITE ERROR:", e)
        raise HTTPException(status_code=500, detail=f"Resume rewrite failed: {e}")

    return result


# --------------------------------------------------------
# RESUME OPTIMIZATION
# --------------------------------------------------------

@router.post("/optimize/{resume_id}")
def optimize_resume(
    resume_id: int,
    job_description: str = "",
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    resume = _require_own_resume(db, user.id, resume_id)

    try:
        result = optimize_resume_ai(
            resume_text="",
            job_description=job_description,
            resume_structured=resume_to_dict(resume)
        )
    except Exception as e:
        print("OPTIMIZE ERROR:", e)
        raise HTTPException(status_code=500, detail=f"Resume optimization failed: {e}")

    return result


# --------------------------------------------------------
# COVER LETTER
# --------------------------------------------------------

@router.post("/cover-letter/{resume_id}")
def generate_cover_letter(
    resume_id: int,
    job_description: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = _require_own_resume(db, current_user.id, resume_id)

    resume_data = resume_to_dict(resume)

    try:
        result = generate_cover_letter_ai(
            resume_text="",
            job_description=job_description,
            resume_structured=resume_data,
        )
    except Exception as e:
        print("COVER LETTER ERROR:", e)
        raise HTTPException(status_code=500, detail=f"Cover letter generation failed: {e}")

    # result is a plain dict (from json.loads inside _parse_ai_response),
    # NOT an object — result.cover_letter (attribute access) throws
    # AttributeError on every call. Use dict access with a safe default
    # instead, in case the AI response is missing the key or parsing
    # failed and returned {}.
    cover_letter_text = result.get("cover_letter", "") if isinstance(result, dict) else ""

    if not cover_letter_text:
        raise HTTPException(
            status_code=502,
            detail="The AI service did not return a cover letter. Please try again.",
        )

    return {
        "cover_letter": cover_letter_text
    }


# --------------------------------------------------------
# INTERVIEW QUESTIONS
# --------------------------------------------------------

@router.post("/interview/{resume_id}")
def generate_interview_questions(
    resume_id: int,
    job_description: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resume = _require_own_resume(db, current_user.id, resume_id)

    try:
        result = generate_interview_questions_ai(
            resume_text="",
            job_description=job_description,
            resume_structured=resume_to_dict(resume),
        )
    except Exception as e:
        print("INTERVIEW QUESTIONS ERROR:", e)
        raise HTTPException(status_code=500, detail=f"Interview question generation failed: {e}")

    return result


@router.post("/evaluate-answer")
def evaluate_answer(
    request: EvaluateAnswerRequest,
    db: Session = Depends(get_db)
):
    try:
        resume = db.query(Resume).filter(
            Resume.id == request.resume_id
        ).first()

        if not resume:
            raise HTTPException(
                status_code=404,
                detail="Resume not found"
            )

        result = evaluate_answer_ai(
            question=request.question,
            answer=request.answer,
            resume_structured=resume_to_dict(resume),
            job_description=request.job_description,
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        print("EVALUATE ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/final-report")
def final_report(
    request: FinalReportRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == request.resume_id,
            Resume.user_id == current_user.id
        )
        .first()
    )

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume_data = {
        "personal": resume.personal,
        "education": [
            {
                "college": e.college,
                "degree": e.degree,
                "year": e.year
            }
            for e in resume.education
        ],
        "experience": [
            {
                "company": e.company,
                "role": e.role,
                "duration": e.duration
            }
            for e in resume.experience
        ],
        "projects": [
            {
                "title": p.title,
                "description": p.description
            }
            for p in resume.projects
        ],
        "skills": [
            s.name
            for s in resume.skills
        ]
    }

    try:
        return generate_final_report_ai(
            request.results,
            resume_data,
            request.job_description
        )
    except Exception as e:
        print("FINAL REPORT ERROR:", e)
        raise HTTPException(status_code=500, detail=f"Final report generation failed: {e}")
