import json
from pypdf import PdfReader
from docx import Document



from .grok_service import ask_ai


def extract_text(file_path, content_type):

    text = ""

    if "pdf" in content_type:
        reader = PdfReader(file_path)

        for page in reader.pages:
            text += page.extract_text() or ""

    elif "word" in content_type or file_path.endswith(".docx"):

        doc = Document(file_path)

        for para in doc.paragraphs:
            text += para.text + "\n"


    return text



def parse_resume_with_ai(text):

    prompt = f"""

You are a resume parser.

Extract resume information.

Resume:

{text}


Return ONLY JSON:

{{
 "full_name":"",
 "email":"",
 "phone":"",
 "location":"",
 "linkedin":"",
 "github":"",

 "skills":[],

 "education":[
 {{
  "college":"",
  "degree":"",
  "year":""
 }}
 ],

 "experience":[
 {{
  "company":"",
  "role":"",
  "duration":""
 }}
 ],

 "projects":[
 {{
 "title":"",
 "description":""
 }}
 ]
}}

"""

    response = ask_ai(prompt)

    print("========== AI RESPONSE ==========")
    print(response)
    print("=================================")

    response = response.strip()

    if response.startswith("```"):
        response = (
            response.replace("```json", "")
            .replace("```", "")
            .strip()
        )

    return json.loads(response)