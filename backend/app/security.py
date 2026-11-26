from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app import config
from app.database import get_db
from app.models import User

# auto_error=False → endpoints can be called without a token; each route decides
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1.0/auth/token", auto_error=False)

_BEARER = {"WWW-Authenticate": "Bearer"}


def hash_password(password: str) -> str:
    if len(password.encode()) > 72:
        raise ValueError("Password must be at most 72 bytes")
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        return False


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=config.ACCESS_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


def get_optional_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """No token → None (anonymous). A bad or expired token → 401."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired, please log in again", headers=_BEARER)
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token, please log in again", headers=_BEARER)

    user = db.get(User, payload.get("sub"))
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token, please log in again", headers=_BEARER)
    return user


def get_superuser(user: User | None = Depends(get_optional_user)) -> User:
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated", headers=_BEARER)
    if not user.is_superuser:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Superuser access required")
    return user


def can_see_private(user: User | None) -> bool:
    return bool(user and user.is_superuser)
