from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..schemas import (
    LoginRequest,
    MeResponse,
    SignupRequest,
    SignupResponse,
    TokenResponse,
    UserOut,
)
from ..services.auth_service import AuthService

router = APIRouter()


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    payload_dict = payload.model_dump()
    # Ensure the stored hash uses bcrypt-truncated input, and avoid pydantic rejecting long passwords.
    payload_dict["password"] = payload_dict["password"][:72]
    payload = SignupRequest(**payload_dict)
    try:

        user = AuthService.signup(db=db, payload=payload)
        return SignupResponse(user=UserOut.model_validate(user))
    except ValueError as exc:
        if str(exc) == "email_taken":
            raise HTTPException(status_code=400, detail="Email already registered") from exc
        if str(exc) == "invalid_credentials":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password") from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc









@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = AuthService.login(db=db, email=payload.email, password=payload.password)
        token = AuthService.issue_token(user)
    except ValueError as exc:
        if str(exc) == "invalid_credentials":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password") from exc
        raise

    return TokenResponse(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.get("/me", response_model=MeResponse)
def me(current_user=Depends(get_current_user)):
    return MeResponse(user=UserOut.model_validate(current_user))

