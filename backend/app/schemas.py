from typing import Literal

from pydantic import BaseModel, Field

PostStatus = Literal["draft", "published"]


class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    excerpt: str | None = Field(None, max_length=500)
    author: str = Field(min_length=1, max_length=100)
    category_id: str | None = Field(None, max_length=50)
    tags: list[str] = Field(default_factory=list)
    featured_image: str | None = Field(None, max_length=500)
    status: PostStatus = "draft"
    is_public: bool = False
    meta_title: str | None = Field(None, max_length=255)
    meta_description: str | None = Field(None, max_length=500)


class PostUpdate(BaseModel):
    """Only the fields that are sent get changed."""

    title: str | None = Field(None, min_length=1, max_length=255)
    content: str | None = Field(None, min_length=1)
    excerpt: str | None = Field(None, max_length=500)
    author: str | None = Field(None, min_length=1, max_length=100)
    category_id: str | None = Field(None, max_length=50)
    tags: list[str] | None = None
    featured_image: str | None = Field(None, max_length=500)
    status: PostStatus | None = None
    is_public: bool | None = None
    meta_title: str | None = Field(None, max_length=255)
    meta_description: str | None = Field(None, max_length=500)


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    is_public: bool = False


class CategoryUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    is_public: bool | None = None
