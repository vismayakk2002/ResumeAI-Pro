from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)


def ask_ai(prompt):
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            # temperature=0 makes the model's output as deterministic as
            # possible. Without this, the same resume can get a different
            # ATS score, match percentage, etc. on every run because the
            # model is sampling instead of picking its most likely answer.
            temperature=0,
        )
    except Exception as e:
        # Without this, any Groq-side failure (auth, rate limit, timeout,
        # network blip) throws all the way up through ai_service.py and
        # the route handler as an unhandled exception — which is what was
        # producing the "couldn't reach server" / CORS-looking error on
        # the frontend for endpoints that had no try/except of their own.
        print("AI REQUEST ERROR:", e)
        raise RuntimeError(f"AI request failed: {e}") from e

    result = response.choices[0].message.content
    print(result)
    return result
