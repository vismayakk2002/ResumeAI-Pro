from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), default="")
    location: Mapped[str] = mapped_column(String(255), default="")
    linkedin: Mapped[str] = mapped_column(String(255), default="")
    github: Mapped[str] = mapped_column(String(255), default="")
    portfolio: Mapped[str] = mapped_column(String(255), default="")
    job_title: Mapped[str] = mapped_column(String(255), default="")
    summary: Mapped[str] = mapped_column(Text, default="")

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    resumes: Mapped[list["Resume"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    uploaded_resumes: Mapped[list["UploadedResume"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Personal details
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    email: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    phone: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    location: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    linkedin: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    github: Mapped[str] = mapped_column(String(255), nullable=False, default="")

    # Professional summary (was missing before — added so it actually persists)
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")

    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Resume")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="resumes")

    education: Mapped[list["Education"]] = relationship(
        back_populates="resume",
        cascade="all, delete-orphan",
    )

    experience: Mapped[list["Experience"]] = relationship(
        back_populates="resume",
        cascade="all, delete-orphan",
    )

    projects: Mapped[list["Project"]] = relationship(
        back_populates="resume",
        cascade="all, delete-orphan",
    )

    skills: Mapped[list["Skill"]] = relationship(
        back_populates="resume",
        cascade="all, delete-orphan",
    )

    achievements: Mapped[list["Achievement"]] = relationship(
        back_populates="resume",
        cascade="all, delete-orphan",
    )

    @property
    def personal(self):
        return {
            "fullName": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "location": self.location,
            "linkedin": self.linkedin,
            "github": self.github,
        }


class Education(Base):
    __tablename__ = "educations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)

    college: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    degree: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    year: Mapped[str] = mapped_column(String(50), nullable=False, default="")

    resume: Mapped[Resume] = relationship(back_populates="education")


class Experience(Base):
    __tablename__ = "experiences"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)

    company: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    role: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    duration: Mapped[str] = mapped_column(String(255), nullable=False, default="")

    # Bullet points from the "Work Summary" textarea (newline-separated). Was missing before.
    responsibilities: Mapped[str] = mapped_column(Text, nullable=False, default="")

    resume: Mapped[Resume] = relationship(back_populates="experience")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")

    resume: Mapped[Resume] = relationship(back_populates="projects")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False, default="")

    resume: Mapped[Resume] = relationship(back_populates="skills")


class Achievement(Base):
    """New table — Achievements section had no backend storage at all before."""

    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)

    text: Mapped[str] = mapped_column(Text, nullable=False, default="")

    resume: Mapped[Resume] = relationship(back_populates="achievements")


class UploadedResume(Base):
    __tablename__ = "uploaded_resumes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    filename: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    content_type: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    storage_path: Mapped[str] = mapped_column(String(1024), nullable=False, default="")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="uploaded_resumes")
