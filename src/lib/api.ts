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
  // 30-day expiry
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

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed: ${response.status}`);
  }
  return response.json();
};

// ── Auth ─────────────────────────────────────────────────────────────────────

export const login = async (username: string, password: string): Promise<string> => {
  const response = await fetch(`${BASE_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Invalid username or password");
  }

  const data = await response.json();
  const token: string = data.access_token;
  setAccessToken(token);
  return token;
};

// ── User ─────────────────────────────────────────────────────────────────────

export const getUserProfile = async () => {
  return fetchApi("/user/check-me", { method: "GET" });
};

// ── Blog ─────────────────────────────────────────────────────────────────────

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
}

export const getAllPosts = async (): Promise<Post[]> => {
  const res = await fetchApi("/blog/posts", { method: "GET" });
  if (Array.isArray(res?.data?.posts)) return res.data.posts;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
};

export const getPostById = async (id: string): Promise<Post & { content: string }> => {
  const res = await fetchApi(`/blog/posts/${id}`, { method: "GET" });
  // response shape: { success: true, data: { ...post } }
  if (res?.data) return res.data;
  return res;
};
