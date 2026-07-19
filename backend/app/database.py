from __future__ import annotations

import os
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

# If no DATABASE_URL is configured, fall back to local SQLite so the API
# can run without MySQL.
DEFAULT_SQLITE_URL = "sqlite:///./resumeai.db"



# Load environment variables from .env
load_dotenv()


class Base(DeclarativeBase):
    pass


def get_database_url() -> str:

    # Use DATABASE_URL if provided
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        return database_url


    # Otherwise build MySQL URL from individual variables
    db_user = os.getenv(
        "DB_USER",
        "root"
    )

    db_password = os.getenv(
        "DB_PASSWORD",
        ""
    )

    db_host = os.getenv(
        "DB_HOST",
        "127.0.0.1"
    )

    db_port = os.getenv(
        "DB_PORT",
        "3306"
    )

    db_name = os.getenv(
        "DB_NAME",
        "resumeai"
    )


    return (
        f"mysql+pymysql://"
        f"{db_user}:{db_password}"
        f"@{db_host}:{db_port}/{db_name}"
    )



DATABASE_URL = get_database_url()

# Always prefer SQLite for local dev if DATABASE_URL isn't explicitly set.
# If you set DATABASE_URL to a real MySQL connection string, that will be used.
# If DATABASE_URL points to MySQL but MySQL isn't available, tests/dev will fail.
# For this project, default to SQLite unless DATABASE_URL is explicitly set and
# appears to be a real MySQL URL.
if not DATABASE_URL or DATABASE_URL.startswith("mysql+"):
    DATABASE_URL = DEFAULT_SQLITE_URL




print("FINAL DATABASE URL:", DATABASE_URL)

ENGINE = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)



SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=ENGINE
)



def get_db() -> Generator[Session, None, None]:

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()