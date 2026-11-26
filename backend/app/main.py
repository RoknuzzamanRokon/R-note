from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app import config
from app.database import create_tables
from app.routers import auth, blog, upload


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_tables()
    yield


app = FastAPI(title="R-Note API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError):
    """Return "detail" as one readable string (the frontend shows err.detail)."""
    parts = []
    for e in exc.errors():
        field = ".".join(str(x) for x in e.get("loc", []) if x not in ("body", "query", "path"))
        parts.append(f"{field}: {e.get('msg')}" if field else str(e.get("msg")))
    return JSONResponse(
        status_code=422,
        content={"detail": "; ".join(parts), "errors": jsonable_encoder(exc.errors())},
    )


api = APIRouter(prefix="/api/v1.0")
api.include_router(auth.router)
api.include_router(blog.router)
app.include_router(api)
app.include_router(upload.router)

# Uploaded images are served without login so <img> tags can load them.
config.BLOG_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=config.UPLOAD_DIR), name="uploads")


@app.get("/", tags=["health"])
def health():
    return {"status": "ok", "service": "r-note-api"}
