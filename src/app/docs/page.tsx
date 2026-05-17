"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { prefetchPosts, getCachedPosts } from "@/lib/postsStore";
import { isLoggedIn, type Post } from "@/lib/api";

const DEV_COLOR = {
  text: "text-tanstack-green",
  border: "border-tanstack-green/30",
  bg: "bg-tanstack-green/5",
};

// Rotating title colours for each card
const TITLE_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#06b6d4", // cyan
  "#f59e0b", // yellow
  "#ec4899", // pink
  "#a78bfa", // violet
  "#f97316", // orange
  "#34d399", // emerald
];

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

export default function DocsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(() => {
    const cached =
      getCachedPosts()?.filter((p) => p.category?.slug === "development") ?? [];
    return cached;
  });
  const [filtered, setFiltered] = useState<Post[]>(() => {
    const cached =
      getCachedPosts()?.filter((p) => p.category?.slug === "development") ?? [];
    return cached;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const cached =
      getCachedPosts()?.filter((p) => p.category?.slug === "development") ?? [];
    return cached.length === 0;
  });
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  // Fetch — uses cache instantly if available, otherwise fetches
  useEffect(() => {
    // Already hydrated from cache in useState initializer
    if (posts.length > 0) return;
    // Not cached yet — fetch
    prefetchPosts()
      .then((list) => {
        const devOnly = list.filter((p) => p.category?.slug === "development");
        setPosts(devOnly);
        setFiltered(devOnly);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search filter
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(posts);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q),
      ),
    );
  }, [search, posts]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      {/* <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 className="text-headline-lg font-bold text-white">Development</h2>
          <p className="text-body-md text-on-surface-variant mt-xs">
            {loading ? "Loading…" : `${filtered.length} documents`}
          </p>
        </div>
      </div> */}

      {/* Search */}
      {/* <div className="mb-lg">
        <div className="relative max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-sm bg-surface-variant border border-outline-variant rounded text-body-md text-white focus:outline-none focus:border-royal-blue transition-colors placeholder:text-on-surface-variant/50"
          />
        </div>
      </div> */}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-card-bg border border-card-border rounded-arch p-lg animate-pulse"
            >
              <div className="h-3 bg-surface-variant rounded w-1/3 mb-md" />
              <div className="h-4 bg-surface-variant rounded w-4/5 mb-sm" />
              <div className="h-3 bg-surface-variant rounded w-full mb-xs" />
              <div className="h-3 bg-surface-variant rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-sm p-lg rounded border border-tanstack-pink/30 bg-tanstack-pink/5 text-tanstack-pink">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="text-body-md">
            Failed to load documents. Please try again.
          </span>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-[80px] text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] mb-md opacity-30">
            search_off
          </span>
          <p className="text-body-lg">No documents found.</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {filtered.map((post, idx) => {
            const titleColor = TITLE_COLORS[idx % TITLE_COLORS.length];
            return (
              <a
                key={post.id}
                href={`/docs/${post.id}`}
                className="bg-card-bg border border-card-border p-lg rounded-arch card-glow transition-all group relative overflow-hidden cursor-pointer block no-underline"
              >
                {/* Top row */}
                <div className="flex justify-between items-start mb-md">
                  <div className="flex items-center gap-sm">
                    <span
                      className={`material-symbols-outlined ${DEV_COLOR.text} text-[20px]`}
                    >
                      description
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      post.status === "published"
                        ? "bg-tanstack-green/10 text-tanstack-green border border-tanstack-green/30"
                        : "bg-surface-variant text-on-surface-variant border border-outline-variant"
                    }`}
                  >
                    {post.status.toUpperCase()}
                  </span>
                </div>

                {/* Title */}
                <h4
                  className="text-body-lg font-semibold mb-sm line-clamp-2 transition-colors doc-title"
                  style={
                    {
                      ["--title-color" as string]: titleColor,
                    } as React.CSSProperties
                  }
                >
                  {post.title}
                </h4>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-body-md text-on-surface-variant mb-md leading-relaxed line-clamp-3">
                    {post.excerpt.replace(/^#+\s*/gm, "").substring(0, 120)}…
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-label-md text-on-surface-variant mt-auto pt-md border-t border-outline-variant">
                  <div className="flex items-center gap-sm">
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
                        {post.read_time}m
                      </span>
                    )}
                  </div>
                  <span>{timeAgo(post.updated_at)}</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
