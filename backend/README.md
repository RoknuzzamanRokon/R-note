# R-Note backend

FastAPI + MySQL API for the `r-note-app` frontend (blog posts and categories).
Runs on port **8035**.

## Setup (first time)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # then fill in DB_* and JWT_SECRET
```

Tables are created automatically on first start (or by the scripts below).

## Run

```bash
python run.py             # http://localhost:8035   (API docs: /docs)
python run.py --reload    # auto-restart while editing code
```

## Scripts

| Command | What it does |
|---|---|
| `python create_user.py` | Create a login user (asks username + password). Running it again for the same username resets the password. |
| `python create_user.py --username rokon --password ...` | Same, without prompts |
| `python migrate_old_posts.py` | Copy categories and posts from the old API (`testcontent.innovatedemo.com`). Keeps the same ids. Safe to run again. |

## API

Prefix `/api/v1.0`. Responses look like `{"success": true, "data": ...}`, errors like `{"detail": "..."}`.

| Method | Path | Login | Notes |
|---|---|---|---|
| POST | `/auth/token` | – | form fields `username`, `password` → `{access_token, token_type}` |
| GET | `/auth/check-me` | ✔ | current user |
| GET | `/blog/posts?category=&status=&page=&limit=` | optional | `category` = name or slug, `limit` ≤ 100. Also returns `category_summary` |
| GET | `/blog/posts/{id}` | optional | adds 1 to `view_count` |
| POST | `/blog/posts` | ✔ | `title`, `content`, `author` required |
| PUT | `/blog/posts/{id}` | ✔ | send only the fields to change |
| DELETE | `/blog/posts/{id}` | ✔ | |
| GET | `/blog/categories` | optional | |
| POST | `/blog/categories` | ✔ | `name`, `description`, `is_public` |
| PUT | `/blog/categories/{id}` | ✔ | |
| DELETE | `/blog/categories/{id}` | ✔ | only when the category has no posts |
| POST | `/upload-blog-image` (no prefix) | ✔ | multipart field `file` (png/jpg/gif/webp, ≤ 10 MB) → `{url}` |

Uploaded images are served from `/uploads/...` without login so `<img>` tags work.

## Who can read what

- **Logged in (superuser):** everything, including drafts and private posts.
- **Not logged in:** only posts that are **published** and either
  - the post is public (`is_public = true`), or
  - its category is public.

Everything is private by default, including all imported posts.

## Deploying

- Set `PUBLIC_URL` to the address people use to reach this API (used in uploaded image URLs).
- Add the frontend's address to `CORS_ORIGINS`.
- Build the frontend with `NEXT_PUBLIC_API_URL=<this API's address>`.
- Keep `uploads/` when redeploying; it holds the uploaded images.
