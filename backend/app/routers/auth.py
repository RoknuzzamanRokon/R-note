from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import create_access_token, get_superuser, verify_password
from app.utils import ok

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/token")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Form fields: username, password → {access_token, token_type}"""
    user = db.scalar(select(User).where(User.username == form.username))
    if user is None or not user.is_active or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"access_token": create_access_token(user.id), "token_type": "bearer"}


@router.get("/check-me")
def check_me(user: User = Depends(get_superuser)):
    return ok({"id": user.id, "username": user.username, "is_superuser": user.is_superuser})
