from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas import MeResponse, ProfileUpdateRequest, ProfileUpdateResponse, UserOut

router = APIRouter()


@router.get("/auth/me", response_model=MeResponse)
def me(current_user=Depends(get_current_user)):
    return MeResponse(user=UserOut.model_validate(current_user))


@router.get("/profile", response_model=ProfileUpdateResponse)
def profile(current_user=Depends(get_current_user)):
    # Keep response consistent with ProfileUpdateResponse.user
    return ProfileUpdateResponse(user=UserOut.model_validate(current_user))



@router.put("/profile", response_model=ProfileUpdateResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user.id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.name = payload.name
    user.phone = payload.phone
    user.location = payload.location
    user.linkedin = payload.linkedin
    user.github = payload.github
    user.portfolio = payload.portfolio
    user.job_title = payload.job_title
    user.summary = payload.summary

    db.commit()
    db.refresh(user)

    return ProfileUpdateResponse(
        user=UserOut.model_validate(user)
    )

