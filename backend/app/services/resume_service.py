from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class MockOptimizationResult:
    resume_id: int
    suggestions: dict[str, list[str]]


def optimize_resume_mock(resume_id: int, job_description: str) -> MockOptimizationResult:
    _ = job_description
    return MockOptimizationResult(
        resume_id=resume_id,
        suggestions={
            "ats_keywords": [
                "Add 6–10 ATS-relevant keywords from the job description.",
                "Mirror important skill terms exactly as listed (e.g., frameworks/tools).",
            ],
            "achievements": [
                "Convert responsibilities into measurable achievements (metrics, scope, impact).",
                "Include 2–3 quantified results (e.g., time saved, revenue growth, performance gains).",
            ],
            "action_verbs": [
                "Use stronger action verbs (e.g., designed, led, improved, automated).",
                "Start bullets with verbs and keep descriptions concise.",
            ],
            "formatting": [
                "Ensure consistent heading styles and spacing.",
                "Use a clean section order: Summary → Experience → Projects → Education → Skills.",
            ],
        },
    )

