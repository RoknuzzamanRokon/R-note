/* src/lib/api.ts */

const BASE_URL = "https://www.testcontent.innovatedemo.com/api/v1.0";

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
  document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
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
  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${response.status}`);
  }
  return response.json();
};

// ── In-memory cache ───────────────────────────────────────────────────────────
// Keyed by endpoint. Stores { data, ts }. TTL = 5 minutes.

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; ts: number }>();

const cachedFetch = async <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
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

export const login = async (username: string, password: string): Promise<string> => {
  const response = await fetch(`${BASE_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Invalid username or password");
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
}

// ── Blog ─────────────────────────────────────────────────────────────────────

export const getAllPosts = (): Promise<Post[]> =>
  cachedFetch("posts", async () => {
    const res = await fetchApi("/blog/posts", { method: "GET" });
    if (Array.isArray(res?.data?.posts)) return res.data.posts;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  });

// Single post — cached individually
export const getPostById = (id: string): Promise<Post> =>
  cachedFetch(`post:${id}`, async () => {
    const res = await fetchApi(`/blog/posts/${id}`, { method: "GET" });
    if (res?.data) return res.data;
    return res;
  });
