"""Settings loaded from backend/.env"""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _bool(value: str | None, default: bool = False) -> bool:
    if value is None or value.strip() == "":
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


# ── Database ─────────────────────────────────────────────────────────────────
# DB_HOST may include the port, e.g. "my-host:20184"
_db_host = os.getenv("DB_HOST", "localhost")
if ":" in _db_host:
    DB_HOST, _port = _db_host.rsplit(":", 1)
    DB_PORT = int(_port)
else:
    DB_HOST = _db_host
    DB_PORT = int(os.getenv("DB_PORT", "3306"))

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "rnote")
DB_SSL = _bool(os.getenv("DB_SSL"), default=True)
DB_SSL_CA = os.getenv("DB_SSL_CA", "").strip() or None

# ── Server ───────────────────────────────────────────────────────────────────
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8035"))
PUBLIC_URL = os.getenv("PUBLIC_URL", "").strip().rstrip("/")
CORS_ORIGINS = [
    o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()
]

# ── Auth ─────────────────────────────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "30"))

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is missing in backend/.env")

# ── Uploads ──────────────────────────────────────────────────────────────────
UPLOAD_DIR = BASE_DIR / "uploads"
BLOG_IMAGE_DIR = UPLOAD_DIR / "blog_images"
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
