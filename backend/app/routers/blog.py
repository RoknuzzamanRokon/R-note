"""Blog posts + categories.

Who can read what:
- Logged-in superuser → everything (drafts and private posts too).
- No token → only published posts that are public, or whose category is public.
"""

from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.orm import Session, contains_eager, joinedload

from app.database import get_db
from app.models import Category, Post, User, new_id, utcnow
from app.schemas import CategoryCreate, CategoryUpdate, PostCreate, PostStatus, PostUpdate
from app.security import can_see_private, get_optional_user, get_superuser
from app.utils import (
    calc_read_time,
    clean_tags,
    ok,
    serialize_category,
    serialize_post,
    unique_slug,
)

router = APIRouter(prefix="/blog", tags=["blog"])


# ── helpers ──────────────────────────────────────────────────────────────────

def _public_condition():
    """SQL condition for posts anyone may read (needs Category joined)."""
    return and_(
        Post.status == "published",
        or_(Post.is_public.is_(True), Category.is_public.is_(True)),
    )


def _is_public_post(p: Post) -> bool:
    return p.status == "published" and (p.is_public or bool(p.category and p.category.is_public))


def _load_post(db: Session, post_id: str) -> Post | None:
    return db.scalar(
        select(Post)
        .options(joinedload(Post.category))
        .where(Post.id == post_id)
        .execution_options(populate_existing=True)
    )


def _check_category(db: Session, category_id: str | None) -> str | None:
    if not category_id:
        return None
    if db.get(Category, category_id) is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Category not found")
    return category_id


def _category_counts(db: Session, private: bool) -> list[tuple[Category, int]]:
    join_on = Post.category_id == Category.id
    if not private:
        join_on = and_(join_on, _public_condition())
    rows = db.execute(
        select(Category, func.count(Post.id))
        .outerjoin(Post, join_on)
        .group_by(Category.id)
        .order_by(Category.name)
    ).all()
    if not private:
        rows = [(c, n) for c, n in rows if c.is_public or n > 0]
    return [(c, n) for c, n in rows]


def _post_count(db: Session, category_id: str) -> int:
    return db.scalar(select(func.count(Post.id)).where(Post.category_id == category_id)) or 0


# ── posts ────────────────────────────────────────────────────────────────────

@router.get("/posts")
def list_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    category: str | None = Query(None, description="Category name or slug"),
    status_: PostStatus | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    private = can_see_private(user)

    conditions = []
    if not private:
        conditions.append(_public_condition())
    if status_:
        conditions.append(Post.status == status_)
    if category:
        conditions.append(or_(Category.name == category, Category.slug == category))

    total = db.scalar(
        select(func.count(Post.id)).select_from(Post).outerjoin(Post.category).where(*conditions)
    ) or 0
    posts = db.scalars(
        select(Post)
        .outerjoin(Post.category)
        .options(contains_eager(Post.category))
        .where(*conditions)
        .order_by(Post.created_at.desc(), Post.id)
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()

    return ok(
        {
            "posts": [serialize_post(p) for p in posts],
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": ceil(total / limit),
            "category_summary": [
                {"id": c.id, "name": c.name, "slug": c.slug, "is_public": c.is_public, "post_count": n}
                for c, n in _category_counts(db, private)
            ],
        }
    )


@router.get("/posts/{post_id}")
def get_post(
    post_id: str,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    post = _load_post(db, post_id)
    if post is None or (not can_see_private(user) and not _is_public_post(post)):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")

    db.execute(
        update(Post)
        .where(Post.id == post.id)
        .values(view_count=Post.view_count + 1)
        .execution_options(synchronize_session=False)
    )
    db.commit()
    post.view_count += 1
    return ok(serialize_post(post))


@router.post("/posts")
def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_superuser),
):
    now = utcnow()
    post = Post(
        id=new_id(),
        title=data.title.strip(),
        slug=unique_slug(db, Post, data.title),
        content=data.content,
        excerpt=data.excerpt,
        author=data.author.strip(),
        category_id=_check_category(db, data.category_id),
        tags=clean_tags(data.tags),
        featured_image=data.featured_image,
        status=data.status,
        is_public=data.is_public,
        view_count=0,
        read_time=calc_read_time(data.content),
        meta_title=data.meta_title,
        meta_description=data.meta_description,
        created_at=now,
        updated_at=now,
        published_at=now if data.status == "published" else None,
    )
    db.add(post)
    db.commit()
    return ok(serialize_post(_load_post(db, post.id)))


@router.put("/posts/{post_id}")
def update_post(
    post_id: str,
    data: PostUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_superuser),
):
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")

    fields = data.model_dump(exclude_unset=True)
    # These columns can't be empty: sending null for them means "leave as is"
    for key in ("title", "content", "author", "status", "tags", "is_public"):
        if key in fields and fields[key] is None:
            del fields[key]

    if "category_id" in fields:
        fields["category_id"] = _check_category(db, fields["category_id"])
    if "title" in fields:
        fields["title"] = fields["title"].strip()
        if fields["title"] != post.title:
            post.slug = unique_slug(db, Post, fields["title"], exclude_id=post.id)
    if "author" in fields:
        fields["author"] = fields["author"].strip()
    if "content" in fields:
        post.read_time = calc_read_time(fields["content"])
    if "tags" in fields:
        fields["tags"] = clean_tags(fields["tags"])

    for key, value in fields.items():
        setattr(post, key, value)

    now = utcnow()
    if post.status == "published" and post.published_at is None:
        post.published_at = now
    post.updated_at = now
    db.commit()
    return ok(serialize_post(_load_post(db, post.id)))


@router.delete("/posts/{post_id}")
def delete_post(
    post_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_superuser),
):
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    db.delete(post)
    db.commit()
    return ok({"id": post_id, "deleted": True})


# ── categories ───────────────────────────────────────────────────────────────

@router.get("/categories")
def list_categories(
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    return ok([serialize_category(c, n) for c, n in _category_counts(db, can_see_private(user))])


@router.post("/categories")
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_superuser),
):
    name = data.name.strip()
    if not name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Category name is required")
    if db.scalar(select(Category.id).where(Category.name == name)):
        raise HTTPException(status.HTTP_409_CONFLICT, f'Category "{name}" already exists')

    category = Category(
        id=new_id(),
        name=name,
        slug=unique_slug(db, Category, name),
        description=(data.description or "").strip() or None,
        is_public=data.is_public,
        created_at=utcnow(),
    )
    db.add(category)
    db.commit()
    return ok(serialize_category(category, 0))


@router.put("/categories/{category_id}")
def update_category(
    category_id: str,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_superuser),
):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")

    fields = data.model_dump(exclude_unset=True)
    if fields.get("name") is not None:
        name = fields["name"].strip()
        if not name:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Category name is required")
        clash = db.scalar(select(Category.id).where(Category.name == name, Category.id != category.id))
        if clash:
            raise HTTPException(status.HTTP_409_CONFLICT, f'Category "{name}" already exists')
        if name != category.name:
            category.name = name
            category.slug = unique_slug(db, Category, name, exclude_id=category.id)
    if "description" in fields:
        category.description = (fields["description"] or "").strip() or None
    if fields.get("is_public") is not None:
        category.is_public = fields["is_public"]

    db.commit()
    return ok(serialize_category(category, _post_count(db, category.id)))


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_superuser),
):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    count = _post_count(db, category.id)
    if count:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Category has {count} post(s). Move or delete them first.",
        )
    db.delete(category)
    db.commit()
    return ok({"id": category_id, "deleted": True})
