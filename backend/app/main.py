from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.auth import router as auth_router
from .routers.resume import router as resume_router
from .routers.profile import router as profile_router
from dotenv import load_dotenv
from .routers import ai

load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://superb-trust-production-b12d.up.railway.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Welcome to ResumeAI Pro!"}


# Auth
app.include_router(auth_router, prefix="/auth", tags=["auth"])

# App features
app.include_router(resume_router, prefix="", tags=["resumes"])
app.include_router(profile_router, prefix="", tags=["profile"])
# AI Features
app.include_router(ai.router)
# Create DB tables on startup (SQLite-friendly, no-op for existing tables).
from .database import ENGINE, Base

Base.metadata.create_all(bind=ENGINE)



