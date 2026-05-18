"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  prefetchCategories,
  prefetchPosts,
  getCachedCategories,
  getCachedPosts,
} from "@/lib/postsStore";
import { type Post, type CategorySummary } from "@/lib/api";
import { useSidebar } from "./SidebarContext";

// ── Category styling ──────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<
  string,
  { icon: string; color: string; bg: string }
> = {
  development: {
    icon: "code",
    color: "text-tanstack-green",
    bg: "bg-tanstack-green/10",
  },
  tutorial: {
    icon: "school",
    color: "text-tanstack-cyan",
    bg: "bg-tanstack-cyan/10",
  },
  performance: {
    icon: "speed",
    color: "text-tanstack-yellow",
    bg: "bg-tanstack-yellow/10",
  },
  security: {
    icon: "shield_lock",
    color: "text-tanstack-pink",
    bg: "bg-tanstack-pink/10",
  },
};

const getStyle = (slug: string) =>
  CATEGORY_STYLE[slug.toLowerCase()] ?? {
    icon: "folder",
    color: "text-tanstack-blue",
    bg: "bg-tanstack-blue/10",
  };

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
  const router = useRouter();
  const pathname = usePathname();

  // categories list
  const [categories, setCategories] = useState<CategorySummary[]>(
    () => getCachedCategories() ?? [],
  );
  const [catLoading, setCatLoading] = useState(
    () => (getCachedCategories() ?? []).length === 0,
  );
  const [catError, setCatError] = useState(false);

  // which category is expanded
  const [expanded, setExpanded] = useState<string | null>(null);

  // posts per expanded category
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(false);

  // load categories once
  useEffect(() => {
    if (categories.length > 0) return;
    prefetchCategories()
      .then(setCategories)
      .catch(() => setCatError(true))
      .finally(() => setCatLoading(false));
  }, []);

  // load posts when a category is expanded
  useEffect(() => {
    if (!expanded) {
      setPosts([]);
      return;
    }
    const cached = getCachedPosts(expanded);
    if (cached) {
      setPosts(cached);
      return;
    }
    setPostsLoading(true);
    setPostsError(false);
    prefetchPosts(expanded)
      .then(setPosts)
      .catch(() => setPostsError(true))
      .finally(() => setPostsLoading(false));
  }, [expanded]);

  const handleCategoryClick = (name: string) => {
    setExpanded((prev) => (prev === name ? null : name));
  };

  const activePostId = pathname?.startsWith("/docs/")
    ? pathname.split("/docs/")[1]
    : null;

  return (
    <aside
      className="fixed left-0 bottom-0 flex flex-col bg-nav-bg border-r border-outline-variant z-40 transition-all duration-300 overflow-hidden"
      style={{
        top: "3.5rem",
        width: open ? "16rem" : "0",
        borderRightWidth: open ? "1px" : "0",
      }}
    >
      <div className="w-64 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-lg py-md shrink-0 border-b border-outline-variant">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
            Documentation
          </span>
        </div>

        {/* Scrollable body */}
        <div className="grow overflow-y-auto custom-scrollbar py-sm">
          {/* Category skeleton */}
          {catLoading && (
            <div className="flex flex-col gap-xs px-md py-sm">
              {[60, 80, 55, 70].map((w, i) => (
                <div key={i} className="flex items-center gap-sm py-sm">
                  <div className="w-5 h-5 bg-surface-variant rounded animate-pulse shrink-0" />
                  <div
                    className="h-3 bg-surface-variant rounded animate-pulse"
                    style={{ width: `${w}%` }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Category error */}
          {catError && (
            <div className="px-md py-sm flex items-center gap-sm text-tanstack-pink">
              <span className="material-symbols-outlined text-[16px]">
                error
              </span>
              <span className="text-body-md whitespace-nowrap">
                Failed to load
              </span>
            </div>
          )}

          {/* Category list */}
          {!catLoading &&
            !catError &&
            categories.map((cat) => {
              const style = getStyle(cat.slug);
              const isOpen = expanded === cat.name;

              return (
                <div key={cat.id}>
                  {/* Category row */}
                  <button
                    onClick={() => handleCategoryClick(cat.name)}
                    className="w-full flex items-center gap-sm px-md py-[9px] hover:bg-surface-variant transition-colors group"
                  >
                    <span
                      className={`material-symbols-outlined ${style.color} text-[17px] shrink-0`}
                    >
                      {style.icon}
                    </span>
                    <span className="flex-1 text-left text-body-md text-on-surface-variant group-hover:text-white whitespace-nowrap truncate">
                      {cat.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${style.bg} ${style.color} shrink-0`}
                    >
                      {cat.post_count}
                    </span>
                    <span
                      className={`material-symbols-outlined text-[14px] text-on-surface-variant/50 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Posts under this category */}
                  {isOpen && (
                    <div className="border-l border-outline-variant ml-[28px] mb-xs">
                      {/* Posts loading */}
                      {postsLoading && (
                        <div className="flex flex-col gap-xs px-sm py-xs">
                          {[70, 90, 60, 80].map((w, i) => (
                            <div
                              key={i}
                              className="h-3 bg-surface-variant rounded animate-pulse my-[3px]"
                              style={{ width: `${w}%` }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Posts error */}
                      {postsError && (
                        <p className="px-sm py-xs text-body-md text-tanstack-pink">
                          Failed to load
                        </p>
                      )}

                      {/* Posts empty */}
                      {!postsLoading && !postsError && posts.length === 0 && (
                        <p className="px-sm py-xs text-body-md text-on-surface-variant/50">
                          No posts
                        </p>
                      )}

                      {/* Post links */}
                      {!postsLoading &&
                        !postsError &&
                        posts.map((post) => {
                          const isActive = activePostId === post.id;
                          return (
                            <button
                              key={post.id}
                              onClick={() => router.push(`/docs/${post.id}`)}
                              className={`w-full text-left flex items-start gap-xs px-sm py-[7px] transition-colors group ${
                                isActive
                                  ? "bg-surface-variant"
                                  : "hover:bg-surface-variant/60"
                              }`}
                            >
                              <span
                                className={`material-symbols-outlined text-[13px] mt-[2px] shrink-0 ${isActive ? style.color : "text-on-surface-variant/40"}`}
                              >
                                article
                              </span>
                              <span
                                className={`text-body-md leading-snug line-clamp-2 ${isActive ? "text-white" : "text-on-surface-variant group-hover:text-white/80"}`}
                              >
                                {post.title}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
