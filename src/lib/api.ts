/* src/lib/api.ts */

const BASE_URL = "https://testcontent.innovatedemo.com/api/v1.0";

// ── Token helpers ────────────────────────────────────────────────────────────

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const name = "access_token=";
  const decodedCookie = decodeURIComponent(document.cookie);
  for (const part of decodedCookie.split(";")) {
    const c = part.trim();
    if (c.startsWith(name)) return c.substring(name.length);
  }
  return null;
};

export const setAccessToken = (token: string) => {
  if (typeof window === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000);
  document.cookie = `access_token=${token}; expires=${date.toUTCString()}; path=/`;
};

export const removeAccessToken = () => {
  if (typeof window === "undefined") return;
  document.cookie =
    "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
};

export const isLoggedIn = (): boolean => !!getAccessToken();

// ── Generic authenticated fetch ──────────────────────────────────────────────

const fetchApi = async (endpoint: string, options?: RequestInit) => {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string>),
  };
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let detail = `Request failed: ${response.status}`;
    try {
      const err = JSON.parse(text);
      detail = err.detail || err.message || detail;
    } catch {
      if (text) detail = text;
    }
    throw new Error(detail);
  }
  return response.json();
};

// ── In-memory cache ───────────────────────────────────────────────────────────
// Keyed by endpoint. Stores { data, ts }. TTL = 5 minutes.

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; ts: number }>();

const cachedFetch = async <T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data as T;
  const data = await fetcher();
  cache.set(key, { data, ts: Date.now() });
  return data;
};

export const bustCache = (key?: string) => {
  if (key) cache.delete(key);
  else cache.clear();
};

// ── Auth ─────────────────────────────────────────────────────────────────────

export const login = async (
  username: string,
  password: string,
): Promise<string> => {
  const response = await fetch(`${BASE_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let detail = "Invalid username or password";
    try {
      const err = JSON.parse(text);
      detail = err.detail || err.message || detail;
    } catch {
      if (text) detail = text;
    }
    throw new Error(detail);
  }
  const data = await response.json();
  const token: string = data.access_token;
  setAccessToken(token);
  bustCache(); // clear stale data on login
  return token;
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  author?: string;
  category: { id: string; name: string; slug: string } | null;
  tags?: string[];
  featured_image?: string;
  status: string;
  view_count?: number;
  read_time?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  content?: string;
  meta_title?: string;
  meta_description?: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  post_count: number;
}

export interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  category_summary: CategorySummary[];
}

export interface CreatePostPayload {
  title: string;
  author: string;
  content?: string;
  excerpt?: string;
  category_id?: string;
  featured_image?: string;
  status?: string;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface GetPostsParams {
  category?: string; // category name e.g. "Development"
  page?: number;
  limit?: number;
}

// ── Blog ─────────────────────────────────────────────────────────────────────

export const getPosts = (
  params: GetPostsParams = {},
): Promise<PostsResponse> => {
  const { category, page = 1, limit = 10 } = params;
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  query.set("page", String(page));
  query.set("limit", String(limit));
  const endpoint = `/blog/posts?${query.toString()}`;
  const cacheKey = `posts:${endpoint}`;

  return cachedFetch(cacheKey, async () => {
    const res = await fetchApi(endpoint, { method: "GET" });
    const data = res?.data ?? res;
    return {
      posts: Array.isArray(data?.posts) ? data.posts : [],
      total: data?.total ?? 0,
      page: data?.page ?? page,
      limit: data?.limit ?? limit,
      total_pages: data?.total_pages ?? 1,
      category_summary: Array.isArray(data?.category_summary)
        ? data.category_summary
        : [],
    } satisfies PostsResponse;
  });
};

/** Fetch ALL pages for a given category (used by sidebar / store). */
export const getAllPostsByCategory = async (
  category: string,
): Promise<Post[]> => {
  const cacheKey = `posts:all:${category}`;
  return cachedFetch(cacheKey, async () => {
    const first = await getPosts({ category, page: 1, limit: 100 });
    if (first.total_pages <= 1) return first.posts;
    const rest = await Promise.all(
      Array.from({ length: first.total_pages - 1 }, (_, i) =>
        getPosts({ category, page: i + 2, limit: 100 }).then((r) => r.posts),
      ),
    );
    return [...first.posts, ...rest.flat()];
  });
};

/** Kept for backwards-compat — fetches all posts without category filter. */
export const getAllPosts = (): Promise<Post[]> =>
  cachedFetch("posts:all", async () => {
    const res = await getPosts({ limit: 100 });
    return res.posts;
  });

// Single post — cached individually
export const getPostById = (id: string): Promise<Post> =>
  cachedFetch(`post:${id}`, async () => {
    const res = await fetchApi(`/blog/posts/${id}`, { method: "GET" });
    if (res?.data) return res.data;
    return res;
  });

// ── Blog: Create ──────────────────────────────────────────────────────────────

export const createPost = async (data: CreatePostPayload): Promise<Post> => {
  const res = await fetchApi("/blog/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res?.data ?? res;
};

export const createCategory = (
  data: CreateCategoryPayload,
): Promise<{ id: string; name: string; slug: string }> =>
  fetchApi("/blog/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });

const IMAGE_UPLOAD_URL = "http://localhost:8000/upload-blog-image";

export const uploadBlogImage = async (file: File): Promise<{ url: string }> => {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(IMAGE_UPLOAD_URL, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Upload failed: ${response.status}`);
  }
  return response.json();
};
