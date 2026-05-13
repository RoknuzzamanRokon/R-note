"use client";

import { useEffect, useState } from "react";
import { getAllPosts, type Post } from "@/lib/api";
import { useSidebar } from "./SidebarContext";

// ── Helpers ──────────────────────────────────────────────────────────────────

const ICON_COLORS: Record<string, string> = {
  tutorial: "text-tanstack-cyan",
  development: "text-tanstack-green",
  performance: "text-tanstack-yellow",
  security: "text-tanstack-pink",
};
const DOT_COLORS: Record<string, string> = {
  tutorial: "bg-tanstack-cyan",
  development: "bg-tanstack-green",
  performance: "bg-tanstack-yellow",
  security: "bg-tanstack-pink",
};
const TEXT_COLORS: Record<string, string> = {
  tutorial: "text-tanstack-cyan",
  development: "text-tanstack-green",
  performance: "text-tanstack-yellow",
  security: "text-tanstack-pink",
};

const iconColor = (slug?: string) =>
  ICON_COLORS[slug ?? ""] ?? "text-tanstack-blue";
const dotColor = (slug?: string) =>
  DOT_COLORS[slug ?? ""] ?? "bg-tanstack-blue";
const textColor = (slug?: string) =>
  TEXT_COLORS[slug ?? ""] ?? "text-tanstack-blue";

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

// ── Component ────────────────────────────────────────────────────────────────

const Sidebar = () => {
  const { open } = useSidebar();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getAllPosts()
      .then((list) =>
        setPosts(list.filter((p) => p.category?.slug === "development")),
      )
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <aside
      className="fixed left-0 bottom-0 flex flex-col bg-nav-bg border-r border-outline-variant z-40 transition-all duration-300 overflow-hidden"
      style={{
        top: "3.5rem", // below navbar (56px)
        width: open ? "16rem" : "0",
        borderRightWidth: open ? "1px" : "0",
      }}
    >
      <div className="w-64 flex flex-col h-full py-lg px-md">
        {/* Section label */}
        <div className="flex items-center justify-between px-sm mb-sm shrink-0">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
            Documentation
          </span>
          {!loading && !error && (
            <span className="text-[10px] text-on-surface-variant bg-surface-variant px-1.5 py-0.5 rounded">
              {posts.length}
            </span>
          )}
        </div>

        {/* Document list */}
        <div className="grow overflow-y-auto custom-scrollbar space-y-[2px]">
          {/* Skeletons */}
          {loading && (
            <div className="flex flex-col gap-sm px-md py-sm">
              {[75, 55, 90, 65, 80, 50].map((w, i) => (
                <div key={i} className="flex items-center gap-sm">
                  <div className="w-4 h-4 bg-surface-variant rounded animate-pulse shrink-0" />
                  <div
                    className="h-3 bg-surface-variant rounded animate-pulse"
                    style={{ width: `${w}%` }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-md py-sm flex items-center gap-sm">
              <span className="material-symbols-outlined text-[16px] text-tanstack-pink">
                error
              </span>
              <span className="text-body-md text-on-surface-variant whitespace-nowrap">
                Failed to load
              </span>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && posts.length === 0 && (
            <p className="px-md py-sm text-body-md text-on-surface-variant whitespace-nowrap">
              No documents found.
            </p>
          )}

          {/* Posts */}
          {!loading &&
            !error &&
            posts.map((post) => (
              <a
                key={post.id}
                href={`/docs#${post.slug}`}
                className="flex items-start gap-sm px-md py-sm rounded hover:bg-surface-variant transition-all cursor-pointer group"
              >
                <span
                  className={`material-symbols-outlined ${iconColor(post.category?.slug)} text-[16px] mt-[2px] shrink-0`}
                >
                  description
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body-md text-on-surface-variant group-hover:text-white leading-snug line-clamp-2">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-xs mt-[3px]">
                    {post.category && (
                      <>
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${dotColor(post.category.slug)} shrink-0`}
                        />
                        <span
                          className={`text-[10px] ${textColor(post.category.slug)} font-medium truncate`}
                        >
                          {post.category.name}
                        </span>
                      </>
                    )}
                    <span className="text-[10px] text-on-surface-variant/50 shrink-0 ml-auto">
                      {timeAgo(post.updated_at)}
                    </span>
                  </div>
                </div>
              </a>
            ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
