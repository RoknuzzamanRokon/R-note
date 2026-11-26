import re
import unicodedata
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Category, Post


def ok(data: Any) -> dict:
    """Same envelope as the old API: {"success": true, "data": ...}"""
    return {"success": True, "data": data}


def slugify(text: str, fallback: str = "post") -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[\s_-]+", "-", text).strip("-")
    return text[:250] or fallback


def unique_slug(db: Session, model: type[Post] | type[Category], text: str, exclude_id: str | None = None) -> str:
    base = slugify(text, fallback="category" if model is Category else "post")
    slug, n = base, 2
    while True:
        q = select(model.id).where(model.slug == slug)
        if exclude_id:
            q = q.where(model.id != exclude_id)
        if db.scalar(q) is None:
            return slug
        slug, n = f"{base}-{n}", n + 1


def calc_read_time(content: str) -> int:
    """Minutes at 200 words/minute (matches the old API's numbers)."""
    return max(1, round(len(content.split()) / 200))


def clean_tags(tags: list[str] | None) -> list[str]:
    seen: list[str] = []
    for t in tags or []:
        t = t.strip()
        if t and t not in seen:
            seen.append(t)
    return seen


def _dt(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def category_ref(c: Category | None) -> dict | None:
    if c is None:
        return None
    return {"id": c.id, "name": c.name, "slug": c.slug, "is_public": c.is_public}


def serialize_post(p: Post) -> dict:
    return {
        "id": p.id,
        "title": p.title,
        "slug": p.slug,
        "content": p.content,
        "excerpt": p.excerpt,
        "author": p.author,
        "category": category_ref(p.category),
        "tags": p.tags or [],
        "featured_image": p.featured_image,
        "status": p.status,
        "is_public": p.is_public,
        "view_count": p.view_count,
        "read_time": p.read_time,
        "created_at": _dt(p.created_at),
        "updated_at": _dt(p.updated_at),
        "published_at": _dt(p.published_at),
        "meta_title": p.meta_title,
        "meta_description": p.meta_description,
    }


def serialize_category(c: Category, post_count: int) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "slug": c.slug,
        "description": c.description,
        "is_public": c.is_public,
        "post_count": post_count,
        "created_at": _dt(c.created_at),
    }
