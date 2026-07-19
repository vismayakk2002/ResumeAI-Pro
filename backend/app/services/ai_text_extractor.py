from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ExtractedResumeText:
    resume_text: str
    structured: dict[str, Any]


def extract_text_and_structure(*, resume_text: str | None = None, resume_structured: dict[str, Any] | None = None) -> ExtractedResumeText:
    """Small façade for later PDF/DOCX extraction.

    Current backend stores resume content as structured resume fields, not raw text.
    This function returns:
      - resume_text: a best-effort concatenation for the ATS analyzer
      - structured: the structured fields for validation

    Replace the implementation later with:
      - pdfplumber / textract for PDFs
      - python-docx for DOCX
      - OCR if needed
    """

    structured = resume_structured or {}

    # Best-effort: concatenate structured fields into a “resume_text” blob.
    if resume_text is not None:
        final_text = resume_text
    else:
        personal = structured.get("personal", {}) or {}
        education = structured.get("education", []) or []
        experience = structured.get("experience", []) or []
        projects = structured.get("projects", []) or []
        skills = structured.get("skills", []) or []

        parts: list[str] = []
        if personal.get("fullName"):
            parts.append(f"{personal.get('fullName')}")
        if personal.get("email"):
            parts.append(f"Email: {personal.get('email')}")
        if personal.get("phone"):
            parts.append(f"Phone: {personal.get('phone')}")
        if personal.get("location"):
            parts.append(f"Location: {personal.get('location')}")
        if personal.get("linkedin"):
            parts.append(f"LinkedIn: {personal.get('linkedin')}")
        if personal.get("github"):
            parts.append(f"GitHub: {personal.get('github')}")

        if skills:
            parts.append("Skills: " + ", ".join([str(s) for s in skills]))

        if education:
            parts.append("Education:")
            for e in education:
                parts.append(f"- {e.get('degree','')} {e.get('college','')} {e.get('year','')}")

        if experience:
            parts.append("Experience:")
            for x in experience:
                parts.append(f"- {x.get('role','')} at {x.get('company','')} ({x.get('duration','')})")

        if projects:
            parts.append("Projects:")
            for p in projects:
                parts.append(f"- {p.get('title','')}: {p.get('description','')}")

        final_text = "\n".join(parts)

    return ExtractedResumeText(resume_text=final_text, structured=structured)

