from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import User
from ..schemas import SignupRequest
from ..utils.security import hash_password, verify_password, create_access_token


class AuthService:
    @staticmethod
    def signup(db: Session, payload: SignupRequest) -> User:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            # Let router translate to proper HTTP error.
            raise ValueError("email_taken")

        user = User(
            name=payload.name,
            email=payload.email,
            password_hash=hash_password(payload.password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


    @staticmethod
    def login(db: Session, email: str, password: str) -> User:
        user = db.query(User).filter(User.email == email).first()
        if not user or not user.is_active:
            raise ValueError("invalid_credentials")

        if not verify_password(password, user.password_hash):
            raise ValueError("invalid_credentials")

        return user

    @staticmethod
    def issue_token(user: User) -> str:
        return create_access_token(subject=str(user.id))

