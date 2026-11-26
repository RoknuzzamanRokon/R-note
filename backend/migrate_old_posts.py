"""Copy categories and posts from the old API into this database.

    python migrate_old_posts.py
    python migrate_old_posts.py --old-api https://testcontent.innovatedemo.com/api/v1.0

- Keeps the same ids, so /docs/<id> links keep working.
- Safe to run again: existing rows are updated, nothing is duplicated.
- New rows start as private (is_public = false). A post you already made
  public here keeps its public setting when you run this again.
"""

import argparse
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime

from sqlalchemy import select

from app.database import SessionLocal, create_tables
from app.models import Category, Post, utcnow
from app.utils import calc_read_time, clean_tags, unique_slug

DEFAULT_OLD_API = "https://testcontent.innovatedemo.com/api/v1.0"


def fetch(base: str, path: str):
    req = urllib.request.Request(
        base.rstrip("/") + path,
        headers={"Accept": "application/json", "User-Agent": "rnote-migrate/1.0"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = json.load(resp)
    return body.get("data", body) if isinstance(body, dict) else body


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None, microsecond=0)


def main() -> None:
    parser = argparse.ArgumentParser(description="Import posts from the old API")
    parser.add_argument("--old-api", default=DEFAULT_OLD_API)
    args = parser.parse_args()

    print(f"Reading from {args.old_api}")
    old_categories = fetch(args.old_api, "/blog/categories")
    old_posts: list[dict] = []
    page = 1
    while True:
        data = fetch(args.old_api, f"/blog/posts?page={page}&limit=100")
        old_posts.extend(data.get("posts", []))
        if page >= (data.get("total_pages") or 1):
            break
        page += 1
    print(f"Found {len(old_categories)} categories, {len(old_posts)} posts")

    create_tables()
    stats = {"cat_new": 0, "cat_upd": 0, "post_new": 0, "post_upd": 0}

    with SessionLocal() as db:
        # ── categories ──
        id_map: dict[str, str] = {}  # old category id → id in this DB
        for oc in old_categories:
            cat = db.get(Category, oc["id"])
            if cat is None:
                # Same name created here by hand already → reuse it
                cat = db.scalar(select(Category).where(Category.name == oc["name"]))
            if cat is None:
                cat = Category(
                    id=oc["id"],
                    name=oc["name"],
                    slug=unique_slug(db, Category, oc.get("slug") or oc["name"]),
                    description=oc.get("description"),
                    is_public=False,
                    created_at=parse_dt(oc.get("created_at")) or utcnow(),
                )
                db.add(cat)
                db.flush()
                stats["cat_new"] += 1
            else:
                cat.description = oc.get("description") or cat.description
                stats["cat_upd"] += 1
            id_map[oc["id"]] = cat.id

        # ── posts ──
        for op in old_posts:
            old_cat = op.get("category") or {}
            category_id = id_map.get(old_cat.get("id")) if old_cat else None
            content = op.get("content") or ""
            status = op.get("status") if op.get("status") in ("draft", "published") else "draft"
            created = parse_dt(op.get("created_at")) or utcnow()

            values = dict(
                title=op["title"],
                content=content,
                excerpt=op.get("excerpt"),
                author=op.get("author") or "Unknown",
                category_id=category_id,
                tags=clean_tags(op.get("tags")),
                featured_image=op.get("featured_image"),
                status=status,
                view_count=op.get("view_count") or 0,
                read_time=op.get("read_time") or calc_read_time(content),
                meta_title=op.get("meta_title"),
                meta_description=op.get("meta_description"),
                created_at=created,
                updated_at=parse_dt(op.get("updated_at")) or created,
                published_at=parse_dt(op.get("published_at")),
            )

            post = db.get(Post, op["id"])
            if post is None:
                post = Post(
                    id=op["id"],
                    slug=unique_slug(db, Post, op.get("slug") or op["title"]),
                    is_public=False,
                    **values,
                )
                db.add(post)
                stats["post_new"] += 1
            else:
                for key, value in values.items():
                    setattr(post, key, value)
                stats["post_upd"] += 1
            db.flush()

        db.commit()

    print(
        f"Categories: {stats['cat_new']} new, {stats['cat_upd']} updated\n"
        f"Posts:      {stats['post_new']} new, {stats['post_upd']} updated\n"
        "All imported posts are private (only you can read them after login)."
    )


if __name__ == "__main__":
    try:
        main()
    except urllib.error.URLError as e:
        sys.exit(f"Could not reach the old API: {e}")
