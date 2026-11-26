import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status

from app import config
from app.models import User
from app.security import get_superuser

router = APIRouter(tags=["upload"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}


@router.post("/upload-blog-image")
async def upload_blog_image(
    request: Request,
    file: UploadFile = File(...),
    _: User = Depends(get_superuser),
):
    """multipart/form-data field "file" → {"url": "<public image url>"}"""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS or not (file.content_type or "").startswith("image/"):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Only image files are allowed ({', '.join(sorted(ALLOWED_EXTENSIONS))})",
        )

    data = await file.read(config.MAX_IMAGE_BYTES + 1)
    if len(data) > config.MAX_IMAGE_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Image must be 10 MB or smaller")
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Empty file")

    config.BLOG_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    name = f"blog_{uuid.uuid4().hex}{ext}"
    (config.BLOG_IMAGE_DIR / name).write_bytes(data)

    base = config.PUBLIC_URL or str(request.base_url).rstrip("/")
    return {"success": True, "url": f"{base}/uploads/blog_images/{name}"}
