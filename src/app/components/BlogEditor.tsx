"use client";

import { useEffect, useState } from "react";
import {
  createPost,
  uploadBlogImage,
  type CreatePostPayload,
  type CategorySummary,
} from "@/lib/api";
import { prefetchCategories, getCachedCategories } from "@/lib/postsStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function BlogEditor({ open, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [author, setAuthor] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [status, setStatus] = useState("draft");
  const [tagsInput, setTagsInput] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const cached = getCachedCategories();
    if (cached) {
      setCategories(cached);
      return;
    }
    prefetchCategories()
      .then(setCategories)
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadBlogImage(file);
      setFeaturedImage(result.url);
    } catch {
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setTitle("");
    setContent("");
    setExcerpt("");
    setAuthor("");
    setCategoryId("");
    setFeaturedImage("");
    setStatus("draft");
    setTagsInput("");
    setMetaTitle("");
    setMetaDescription("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) return alert("Title is required");
    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const payload: CreatePostPayload = {
        title: title.trim(),
        content,
        excerpt: excerpt.trim() || undefined,
        author: author.trim() || undefined,
        category_id: categoryId || undefined,
        featured_image: featuredImage || undefined,
        status,
        tags: tags.length > 0 ? tags : undefined,
        meta_title: metaTitle.trim() || undefined,
        meta_description: metaDescription.trim() || undefined,
      };
      await createPost(payload);
      reset();
      onClose();
    } catch {
      alert("Failed to create post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-nav-bg border border-outline-variant rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant">
          <h2 className="text-title-md font-bold text-white">New Blog Post</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-white p-1 rounded hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-lg py-md space-y-md">
          <div>
            <label className="block text-label-md text-on-surface-variant mb-xs">
              Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-variant border border-outline-variant rounded-lg px-md py-sm text-body-md text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tanstack-blue"
              placeholder="Post title"
            />
          </div>

          <div>
            <label className="block text-label-md text-on-surface-variant mb-xs">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full bg-surface-variant border border-outline-variant rounded-lg px-md py-sm text-body-md text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tanstack-blue resize-y"
              placeholder="Write your content here..."
            />
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-xs">
                Excerpt
              </label>
              <input
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full bg-surface-variant border border-outline-variant rounded-lg px-md py-sm text-body-md text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tanstack-blue"
                placeholder="Short summary"
              />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-xs">
                Author
              </label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-surface-variant border border-outline-variant rounded-lg px-md py-sm text-body-md text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tanstack-blue"
                placeholder="Author name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-label-md text-on-surface-variant mb-xs">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-surface-variant border border-outline-variant rounded-lg px-md py-sm text-body-md text-white focus:outline-none focus:border-tanstack-blue"
              >
                <option value="">None</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-xs">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-surface-variant border border-outline-variant rounded-lg px-md py-sm text-body-md text-white focus:outline-none focus:border-tanstack-blue"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-label-md text-on-surface-variant mb-xs">
              Featured Image
            </label>
            <div className="flex gap-sm items-center">
              <input
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                className="flex-1 bg-surface-variant border border-outline-variant rounded-lg px-md py-sm text-body-md text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tanstack-blue"
                placeholder="Image URL"
              />
              <label className="cursor-pointer bg-surface-variant border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface-variant hover:text-white hover:bg-surface-variant/80 transition-colors shrink-0 flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px]">
                  upload
                </span>
                {uploading && <span className="text-sm">...</span>}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-label-md text-on-surface-variant mb-xs">
              Tags (comma-separated)
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-surface-variant border border-outline-variant rounded-lg px-md py-sm text-body-md text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tanstack-blue"
              placeholder="tag-1, tag-2"
            />
          </div>

          <div>
            <label className="block text-label-md text-on-surface-variant mb-xs">
              Meta Title
            </label>
            <input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full bg-surface-variant border border-outline-variant rounded-lg px-md py-sm text-body-md text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tanstack-blue"
              placeholder="SEO title"
            />
          </div>

          <div>
            <label className="block text-label-md text-on-surface-variant mb-xs">
              Meta Description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              className="w-full bg-surface-variant border border-outline-variant rounded-lg px-md py-sm text-body-md text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-tanstack-blue resize-y"
              placeholder="SEO description"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-sm px-lg py-md border-t border-outline-variant">
          <button
            onClick={onClose}
            className="px-md py-sm rounded-lg text-body-md text-on-surface-variant hover:text-white hover:bg-surface-variant transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-lg py-sm rounded-lg text-body-md font-bold text-white transition-colors disabled:opacity-50"
            style={{ background: "#3b82f6" }}
          >
            {saving ? "Saving..." : "Create Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
