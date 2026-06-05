"use client";

import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createPost, isLoggedIn, bustCache, type CreatePostPayload, type CategorySummary } from "@/lib/api";
import { prefetchCategories, getCachedCategories, invalidatePosts } from "@/lib/postsStore";
import { useSidebar } from "@/app/components/SidebarContext";

const MarkdownRenderer = lazy(() => import("../[id]/MarkdownRenderer"));

// ── helpers ──────────────────────────────────────────────────────────────────

function extractTitle(md: string): string {
  const match = md.match(/^#{1,6}\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

function extractExcerpt(md: string): string {
  // First non-empty, non-heading, non-code-fence line
  const lines = md.split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("```") || t.startsWith("---")) continue;
    return t.replace(/[*_`[\]]/g, "").substring(0, 160);
  }
  return "";
}

// ── component ─────────────────────────────────────────────────────────────────

export default function NewPostPage() {
  const router = useRouter();
  const { open } = useSidebar();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [md, setMd] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [author, setAuthor] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [featuredImage, setFeaturedImage] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  // Load categories
  useEffect(() => {
    const cached = getCachedCategories();
    if (cached) { setCategories(cached); return; }
    prefetchCategories().then(setCategories).catch(() => {});
  }, []);

  // Auto-extract title + excerpt from markdown
  useEffect(() => {
    const t = extractTitle(md);
    if (t) setTitle(t);
    const e = extractExcerpt(md);
    if (e) setExcerpt(e);
  }, [md]);

  // Drag-and-drop .md file
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith(".md")) return;
    const reader = new FileReader();
    reader.onload = (ev) => setMd(ev.target?.result as string ?? "");
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setMd(ev.target?.result as string ?? "");
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required — add a # Heading to your markdown."); return; }
    if (!author.trim()) { setError("Author is required."); return; }
    if (!md.trim()) { setError("Content cannot be empty."); return; }
    setError("");
    setSaving(true);
    try {
      const payload: CreatePostPayload = {
        title: title.trim(),
        author: author.trim(),
        content: md,
        excerpt: excerpt.trim() || undefined,
        category_id: categoryId || undefined,
        featured_image: featuredImage.trim() || undefined,
        status,
        meta_title: metaTitle.trim() || undefined,
        meta_description: metaDescription.trim() || undefined,
      };
      await createPost(payload);
      bustCache();
      invalidatePosts();
      router.push("/docs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Sub-navbar */}
      <div
        className="fixed top-14 z-30 transition-all duration-300 px-xl py-sm bg-nav-bg border-b border-outline-variant flex items-center justify-between"
        style={{ left: open ? "16rem" : "0", right: 0 }}
      >
        <button
          onClick={() => router.push("/docs")}
          className="flex items-center gap-xs text-on-surface-variant hover:text-white transition-colors text-body-md"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>

        <div className="flex items-center gap-sm">
          {/* Draft / Published toggle */}
          <button
            onClick={() => setStatus(s => s === "draft" ? "published" : "draft")}
            className={`px-md py-1 rounded text-label-md font-bold border transition-colors ${
              status === "published"
                ? "bg-tanstack-green/10 text-tanstack-green border-tanstack-green/40"
                : "bg-surface-variant text-on-surface-variant border-outline-variant"
            }`}
          >
            {status === "published" ? "Published" : "Draft"}
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-xs px-lg py-1.5 rounded text-label-md font-bold text-white transition-colors disabled:opacity-50"
            style={{ background: "#3b82f6" }}
          >
            <span className="material-symbols-outlined text-[16px]">
              {saving ? "hourglass_empty" : "send"}
            </span>
            {saving ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      {/* Page body */}
      <div className="mt-12 flex gap-lg" style={{ height: "calc(100vh - 7.5rem)" }}>

        {/* ── Left panel: editor ── */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">

          {/* Write / Preview tabs */}
          <div className="flex items-center gap-0 mb-md border border-outline-variant rounded-lg overflow-hidden w-fit shrink-0">
            {(["write", "preview"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-md py-1.5 text-label-md font-medium capitalize transition-colors ${
                  tab === t
                    ? "bg-surface-variant text-white"
                    : "text-on-surface-variant hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Editor area */}
          {tab === "write" ? (
            <div
              ref={dropRef}
              className={`relative flex-1 rounded-lg border transition-colors overflow-hidden ${
                dragging
                  ? "border-tanstack-blue bg-tanstack-blue/5"
                  : "border-outline-variant"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {md === "" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-on-surface-variant/40 gap-sm z-10">
                  <span className="material-symbols-outlined text-[48px]">draft</span>
                  <p className="text-body-md">Drop a .md file here or start typing</p>
                  <p className="text-label-md">Start with # Your Title to auto-fill fields</p>
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={md}
                onChange={(e) => setMd(e.target.value)}
                spellCheck={false}
                className="w-full h-full resize-none bg-transparent text-body-md font-mono focus:outline-none placeholder:text-transparent custom-scrollbar"
                style={{ lineHeight: "1.7", tabSize: 2, color: "var(--fg)" }}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto rounded-lg border border-outline-variant p-lg prose-dark custom-scrollbar">
              {md.trim() ? (
                <Suspense fallback={
                  <div className="space-y-sm animate-pulse">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-3 bg-surface-variant rounded" style={{ width: `${60 + i * 8}%` }} />
                    ))}
                  </div>
                }>
                  <MarkdownRenderer content={md} />
                </Suspense>
              ) : (
                <p className="text-on-surface-variant/40 text-body-md">Nothing to preview yet.</p>
              )}
            </div>
          )}

          {/* Drop-zone file input */}
          <label className="mt-sm flex items-center gap-xs text-label-md text-on-surface-variant hover:text-white cursor-pointer w-fit transition-colors">
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            Import .md file
            <input type="file" accept=".md,text/markdown" onChange={handleFileInput} className="hidden" />
          </label>

          {error && (
            <div className="mt-sm flex items-center gap-xs text-tanstack-pink text-body-md">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}
        </div>

        {/* ── Right panel: metadata ── */}
        <div
          className="w-72 shrink-0 flex flex-col gap-md custom-scrollbar pb-lg"
          style={{ overflowY: "auto", height: "100%" }}
        >

          {/* Auto-extracted fields */}
          <div className="bg-card-bg border border-card-border rounded-lg p-md space-y-md">
            <p className="text-label-md text-on-surface-variant uppercase tracking-wide">Post Details</p>

            <div>
              <label className="block text-label-md text-on-surface-variant mb-xs">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-surface-variant border border-outline-variant rounded px-sm py-1.5 text-body-md placeholder:text-on-surface-variant/40 focus:outline-none focus:border-tanstack-blue"
                style={{ color: "var(--fg)" }}
                placeholder="Auto-filled from # heading"
              />
            </div>

            <div>
              <label className="block text-label-md text-on-surface-variant mb-xs">Excerpt</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full bg-surface-variant border border-outline-variant rounded px-sm py-1.5 text-body-md placeholder:text-on-surface-variant/40 focus:outline-none focus:border-tanstack-blue resize-none custom-scrollbar"
                style={{ color: "var(--fg)" }}
                placeholder="Auto-filled from first paragraph"
              />
            </div>

            <div>
              <label className="block text-label-md text-on-surface-variant mb-xs">Author *</label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-surface-variant border border-outline-variant rounded px-sm py-1.5 text-body-md placeholder:text-on-surface-variant/40 focus:outline-none focus:border-tanstack-blue"
                style={{ color: "var(--fg)" }}
                placeholder="Your name (required)"
              />
            </div>

            <div>
              <label className="block text-label-md text-on-surface-variant mb-xs">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-surface-variant border border-outline-variant rounded px-sm py-1.5 text-body-md focus:outline-none focus:border-tanstack-blue"
                style={{ color: "var(--fg)" }}
              >
                <option value="">None</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-label-md text-on-surface-variant mb-xs">Featured Image URL</label>
              <input
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                className="w-full bg-surface-variant border border-outline-variant rounded px-sm py-1.5 text-body-md placeholder:text-on-surface-variant/40 focus:outline-none focus:border-tanstack-blue"
                style={{ color: "var(--fg)" }}
                placeholder="https://…"
              />
            </div>
          </div>

          {/* SEO */}
          <div className="bg-card-bg border border-card-border rounded-lg p-md space-y-md">
            <p className="text-label-md text-on-surface-variant uppercase tracking-wide">SEO / Meta</p>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-xs">Meta Title</label>
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full bg-surface-variant border border-outline-variant rounded px-sm py-1.5 text-body-md placeholder:text-on-surface-variant/40 focus:outline-none focus:border-tanstack-blue"
                style={{ color: "var(--fg)" }}
                placeholder="SEO title"
              />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-xs">Meta Description</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                className="w-full bg-surface-variant border border-outline-variant rounded px-sm py-1.5 text-body-md placeholder:text-on-surface-variant/40 focus:outline-none focus:border-tanstack-blue resize-none"
                style={{ color: "var(--fg)" }}
                placeholder="SEO description"
              />
            </div>
          </div>

          {/* Word count */}
          <p className="text-label-md text-on-surface-variant/50 text-right">
            {md.trim().split(/\s+/).filter(Boolean).length} words
          </p>
        </div>
      </div>
    </>
  );
}
