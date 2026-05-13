"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPostById, isLoggedIn, type Post } from "@/lib/api";

type FullPost = Post & { content: string };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [post, setPost] = useState<FullPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    if (!id) return;
    getPostById(id)
      .then(setPost)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, router]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-xs text-on-surface-variant hover:text-white transition-colors mb-lg text-body-md"
      >
        <span className="material-symbols-outlined text-[18px]">
          arrow_back
        </span>
        Back to Documents
      </button>

      {/* Loading */}
      {loading && (
        <div className="animate-pulse space-y-md">
          <div className="h-4 bg-surface-variant rounded w-1/4" />
          <div className="h-8 bg-surface-variant rounded w-3/4" />
          <div className="h-3 bg-surface-variant rounded w-1/3" />
          <div className="mt-xl space-y-sm">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-3 bg-surface-variant rounded"
                style={{ width: `${70 + (i % 4) * 8}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-sm p-lg rounded border border-tanstack-pink/30 bg-tanstack-pink/5 text-tanstack-pink">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="text-body-md">Failed to load document.</span>
        </div>
      )}

      {/* Post */}
      {!loading && !error && post && (
        <>
          {/* Header */}
          <div className="mb-xl pb-xl border-b border-outline-variant">
            {/* Category badge */}
            {post.category && (
              <span className="inline-flex items-center gap-xs text-[10px] font-bold text-tanstack-green border border-tanstack-green/30 bg-tanstack-green/5 px-2 py-0.5 rounded mb-md">
                <span className="w-1.5 h-1.5 rounded-full bg-tanstack-green" />
                {post.category.name.toUpperCase()}
              </span>
            )}

            {/* Title */}
            <h1 className="text-headline-lg font-bold text-white mb-md leading-tight">
              {post.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-md text-label-md text-on-surface-variant">
              {post.author && (
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px]">
                    person
                  </span>
                  {post.author}
                </span>
              )}
              {post.read_time && (
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px]">
                    schedule
                  </span>
                  {post.read_time} min read
                </span>
              )}
              {post.view_count !== undefined && (
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px]">
                    visibility
                  </span>
                  {post.view_count} views
                </span>
              )}
              <span className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px]">
                  update
                </span>
                {timeAgo(post.updated_at)}
              </span>
              <span
                className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  post.status === "published"
                    ? "bg-tanstack-green/10 text-tanstack-green border border-tanstack-green/30"
                    : "bg-surface-variant text-on-surface-variant border border-outline-variant"
                }`}
              >
                {post.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Markdown content */}
          <div className="prose-dark">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>
        </>
      )}
    </div>
  );
}
