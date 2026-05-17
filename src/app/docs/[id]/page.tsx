"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPostById, isLoggedIn, type Post } from "@/lib/api";
import { useSidebar } from "@/app/components/SidebarContext";

// Lazy-load the heavy markdown bundle — only fetched when content is ready
const MarkdownRenderer = lazy(() => import("./MarkdownRenderer"));

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
  const { open } = useSidebar();

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
      .then((p) => setPost(p as FullPost))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, router]);

  return (
    <>
      {/* Back — fixed below navbar, respects sidebar width */}
      <div
        className="fixed top-14 z-30 transition-all duration-300 px-xl py-sm bg-nav-bg border-b border-outline-variant"
        style={{ left: open ? "16rem" : "0", right: 0 }}
      >
        <button
          onClick={() => router.push("/docs")}
          className="flex items-center gap-xs text-on-surface-variant hover:text-white transition-colors text-body-md"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Back to Documents
        </button>
      </div>

      <div className="max-w-4xl mx-auto mt-12">
        {/* Loading skeleton */}
        {loading && (
          <div className="animate-pulse space-y-md">
            <div className="h-4 bg-surface-variant rounded w-1/4" />
            <div className="h-8 bg-surface-variant rounded w-3/4" />
            <div className="h-3 bg-surface-variant rounded w-1/3" />
            <div className="mt-xl space-y-sm">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="h-3 bg-surface-variant rounded"
                  style={{ width: `${65 + (i % 5) * 7}%` }}
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
              <h1
                className="text-headline-lg font-bold mb-md leading-tight"
                style={{ color: "var(--fg)" }}
              >
                {post.title}
              </h1>
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

            {/* Markdown — lazy loaded */}
            <div className="prose-dark">
              <Suspense
                fallback={
                  <div className="space-y-sm animate-pulse">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="h-3 bg-surface-variant rounded"
                        style={{ width: `${70 + (i % 4) * 8}%` }}
                      />
                    ))}
                  </div>
                }
              >
                <MarkdownRenderer content={post.content} />
              </Suspense>
            </div>
          </>
        )}
      </div>
    </>
  );
}
