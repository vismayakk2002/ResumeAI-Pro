from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from jose import jwt
from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def _jwt_secret() -> str:
    return os.getenv("JWT_SECRET", "change-me")


def _jwt_algorithm() -> str:
    return os.getenv("JWT_ALGORITHM", "HS256")


def _jwt_exp_minutes() -> int:
    try:
        return int(os.getenv("JWT_EXPIRE_MINUTES", "3600"))
    except ValueError:
        return 3600



def create_access_token(subject: str, additional_claims: Optional[Dict[str, Any]] = None) -> str:
    now = datetime.utcnow()
    expire = now + timedelta(minutes=_jwt_exp_minutes())

    to_encode: Dict[str, Any] = {"sub": subject, "iat": int(now.timestamp()), "exp": int(expire.timestamp())}
    if additional_claims:
        to_encode.update(additional_claims)

    return jwt.encode(to_encode, _jwt_secret(), algorithm=_jwt_algorithm())


def decode_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, _jwt_secret(), algorithms=[_jwt_algorithm()])

