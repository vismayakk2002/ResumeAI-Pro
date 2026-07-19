import json
from types import SimpleNamespace

from .grok_service import ask_ai


def _parse_ai_response(response):
    try:
        response = response.strip()

        # remove markdown if AI adds it
        if response.startswith("```"):
            response = response.replace("```json", "")
            response = response.replace("```", "")

        # remove text before JSON
        start = response.find("{")
        end = response.rfind("}")

        if start != -1 and end != -1:
            response = response[start:end+1]

        data = json.loads(response)


        # normalize AI inconsistent keys

        if "resume-based_questions" in data:
            data["resume_based_questions"] = data.pop("resume-based_questions")


        if "scenario-based_questions" in data:
            data["scenario_based_questions"] = data.pop("scenario-based_questions")


        # normalize follow ups

        def fix_followups(items):
            if isinstance(items, list):
                for item in items:
                    if "follow-up" in item:
                        item["follow_up"] = item.pop("follow-up")

                    if "follow-up_questions" in item:
                        item["follow_up"] = item.pop("follow-up_questions")

            return items


        for key in data:
            data[key] = fix_followups(data[key])


        return data
    except Exception as e:
        print("JSON PARSE ERROR:", e)
        print(response)
        return {}

# --------------------------------------------------------
# ATS ANALYSIS
# --------------------------------------------------------

def ats_analyze(resume_structured=None):
    prompt = f"""
You are an ATS (Applicant Tracking System) Resume Readability Analyzer.

Evaluate ONLY how well this resume would be parsed and understood by ATS
software in general — NOT how well it matches any specific job. Do not
reference or assume any job description; there isn't one.

Resume:
{json.dumps(resume_structured, indent=2)}

Evaluate:
- Formatting problems that break ATS parsing (tables, columns, graphics,
  unusual symbols, non-standard section headers, inconsistent date formats)
- Missing standard resume sections (e.g. Summary, Skills, Experience, Education)
- Keyword density: does the resume contain enough concrete, industry-relevant
  skill/tech keywords in general, independent of any specific job
- Resume length appropriateness for the experience level shown
- Grammar and phrasing issues
- Weak action verbs in experience bullets, and stronger alternatives
- Whether contact info, education, experience, and project entries are
  complete and properly structured

Return ONLY valid JSON matching this exact shape:

{{
  "ats_score": 85,
  "overall_rating": "Good",
  "formatting_issues": [],
  "missing_sections": [],
  "keyword_density_feedback": [],
  "length_feedback": [],
  "weak_action_verbs": [],
  "strong_action_verbs_suggestions": [],
  "grammar_suggestions": [],
  "contact_information_validation": {{}},
  "education_validation": {{}},
  "experience_validation": {{}},
  "projects_validation": {{}}
}}
"""
    return _parse_ai_response(ask_ai(prompt))


# --------------------------------------------------------
# JOB DESCRIPTION MATCH
# --------------------------------------------------------

def match_job_description(
    resume_text,
    job_description,
    resume_structured=None,
):

    print("========== RESUME DATA ==========")
    print(json.dumps(resume_structured, indent=2))

    print("========== JOB DESCRIPTION ==========")
    print(job_description)


    prompt = f"""
Compare this resume with this Job Description.

Resume:
{json.dumps(resume_structured, indent=2)}

Job Description:
{job_description}

Return ONLY JSON.

{{
    "match_percentage":80,
    "matching_keywords":[],
    "missing_keywords":[],
    "matching_skills":[],
    "missing_skills":[],
    "ats_score":80,
    "suggestions":[]
}}
"""

    return _parse_ai_response(ask_ai(prompt))
# --------------------------------------------------------
# REWRITE
# --------------------------------------------------------

def rewrite_resume_ai(
    resume_text,
    job_description="",
    resume_structured=None,
):

    prompt = f"""
Rewrite this resume professionally.

Resume:
{json.dumps(resume_structured, indent=2)}

Return ONLY JSON.

{{
    "better_summary":"",
    "better_experience":[],
    "better_projects":[]
}}
"""

    return _parse_ai_response(ask_ai(prompt))


# --------------------------------------------------------
# OPTIMIZE
# --------------------------------------------------------

def optimize_resume_ai(
    resume_text,
    job_description="",
    resume_structured=None,
):

    prompt = f"""
Optimize this resume for ATS.

Resume:
{json.dumps(resume_structured, indent=2)}

Job Description:
{job_description}

Return ONLY JSON.

{{
    "ats_optimized_resume":"",
    "improved_summary":"",
    "better_experience_points":[],
    "better_project_descriptions":[],
    "strong_action_verbs":[],
    "better_skills_section":[]
}}
"""

    return _parse_ai_response(ask_ai(prompt))


# --------------------------------------------------------
# COVER LETTER
# --------------------------------------------------------

def generate_cover_letter_ai(
    resume_text,
    job_description="",
    resume_structured=None,
):

    prompt = f"""
You are an expert HR recruiter.

Write a professional cover letter.

Resume:

{json.dumps(resume_structured, indent=2)}

Job Description:

{job_description}

Instructions:

- Address it as "Dear Hiring Manager,"
- Mention the candidate's most relevant skills.
- Mention why they fit this job.
- Mention experience from the resume.
- Keep it between 250-350 words.
- End professionally.
- Do NOT invent experience.
- Return ONLY JSON.

{{
    "cover_letter":""
}}
"""

    return _parse_ai_response(ask_ai(prompt))

def generate_interview_questions_ai(
    resume_text="",
    job_description="",
    resume_structured=None,
):
    prompt = f"""
You are a Senior Technical Interviewer at Google, Microsoft and Amazon.

Your responsibility is to conduct a realistic interview.

You have the candidate's resume and the Job Description.

Candidate Resume:
{json.dumps(resume_structured, indent=2)}

Job Description:
{job_description}

INSTRUCTIONS

Generate interview questions exactly like an experienced interviewer.

The questions MUST be personalized.

RULES

1. Use BOTH the Resume and Job Description.

2. Ask questions based on the candidate's ACTUAL experience.

3. If the candidate mentions Angular, don't ask:
"What is Angular?"

Instead ask:

- Explain the Angular application you worked on.
- Why did you choose Angular?
- Which Angular features did you use?
- Which lifecycle hooks were used?
- Explain a difficult Angular bug you solved.

4. If the resume mentions Infosys, ask project-based questions.

5. If the resume mentions REST APIs, ask implementation questions instead of definitions.

6. If the resume mentions Akana, ask deployment and API management questions.

7. If a technology exists ONLY in the Job Description and NOT in the resume,
ask beginner to intermediate conceptual questions.

8. Avoid repeated questions.

9. Every technical question MUST have 2-3 realistic follow-up questions.

10. HR questions should be specific to the candidate's profile.

11. Scenario questions should simulate real production issues.

12. Difficulty should match a candidate with approximately 3-4 years of experience.

QUESTION COUNT

Generate exactly:

- 5 Technical Questions
- 3 Resume-Based Questions
- 2 Scenario-Based Questions
- 2 HR Questions

RETURN ONLY VALID JSON.

{{
  "technical_questions": [
    {{
      "question": "",
      "follow_up": [
        "",
        "",
        ""
      ]
    }}
  ]
}}
"""

    return _parse_ai_response(ask_ai(prompt))


def evaluate_answer_ai(question, answer, resume_structured=None, job_description=""):

    prompt = f"""
You are a Senior Technical Interviewer.

Evaluate the candidate's interview answer.

Resume:
{json.dumps(resume_structured, indent=2)}

Job Description:
{job_description}

Interview Question:
{question}

Candidate Answer:
{answer}

Evaluate the answer.

Return ONLY valid JSON.

{{
    "score": 0,
    "strengths": [
        "",
        ""
    ],
    "missing_points": [
        "",
        ""
    ],
    "ideal_answer": "",
    "follow_up": ""
}}

Rules:

- Score must be an integer between 1 and 10.

Scoring criteria:

1-3:
Poor answer. Candidate lacks understanding.

4-5:
Basic understanding but missing important concepts.

6-7:
Good answer with correct understanding but missing depth or examples.

8-9:
Strong answer with practical experience, examples and good explanation.

10:
Excellent answer showing deep understanding, real-world experience, tradeoffs and best practices.

Do not give 8 by default.
Evaluate strictly based on the candidate's actual answer.
"""

    return _parse_ai_response(ask_ai(prompt))



def generate_final_report_ai(results, resume_structured, job_description):

    # Calculate overall score from individual answer scores
    scores = []

    for item in results:
        evaluation = item.get("evaluation", {})

        score = evaluation.get("score", 0)

        if isinstance(score, (int, float)):
            scores.append(score)


    if scores:
        average_score = sum(scores) / len(scores)
        overall_score = round(average_score * 10)
    else:
        overall_score = 0



    # Calculate rating
    if overall_score >= 85:
        rating = "Excellent"

    elif overall_score >= 70:
        rating = "Good"

    elif overall_score >= 50:
        rating = "Average"

    else:
        rating = "Poor"



    prompt = f"""
You are a Senior Technical Interviewer.

A candidate completed an interview.

Resume:
{json.dumps(resume_structured, indent=2)}

Job Description:
{job_description}

Question Evaluations:
{json.dumps(results, indent=2)}


The final calculated score is already determined:

Overall Score:
{overall_score}/100

Rating:
{rating}


Analyze the candidate performance and return ONLY valid JSON.

Return this format:

{{
    "technical_level": "Beginner",
    "communication": "Good",
    "confidence": "Fair",

    "recommendation": "Recommended",

    "strengths": [
        "",
        "",
        ""
    ],

    "weaknesses": [
        "",
        "",
        ""
    ],

    "summary": ""
}}


Rules:

- Do not generate overall_score.
- Do not generate rating.
- Only analyze the candidate based on answers.
- Recommendation must be one of:

  "Highly Recommended"
  "Recommended"
  "Needs Improvement"
  "Not Recommended"

- Technical level must be one of:

  "Beginner"
  "Intermediate"
  "Advanced"

- Communication must be one of:

  "Poor"
  "Fair"
  "Good"
  "Excellent"

- Confidence must be one of:

  "Poor"
  "Fair"
  "Good"
  "Excellent"

- Summary must be 3-5 sentences.
- Return ONLY JSON.
- No markdown.
"""


    response = ask_ai(prompt)


    ai_report = json.loads(response)


    # Combine calculated values with AI feedback

    final_report = {

        "overall_score": overall_score,

        "rating": rating,

        "technical_level": ai_report.get(
            "technical_level",
            "Beginner"
        ),

        "communication": ai_report.get(
            "communication",
            "Fair"
        ),

        "confidence": ai_report.get(
            "confidence",
            "Fair"
        ),

        "recommendation": ai_report.get(
            "recommendation",
            "Needs Improvement"
        ),

        "strengths": ai_report.get(
            "strengths",
            []
        ),

        "weaknesses": ai_report.get(
            "weaknesses",
            []
        ),

        "summary": ai_report.get(
            "summary",
            ""
        )
    }


    return final_report