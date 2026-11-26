"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      router.push("/docs");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center"
    >
      <div
        className="w-full mx-4 rounded-lg border p-8"
        style={{
          maxWidth: "420px",
          background: "#0f0f0f",
          borderColor: "#1a1a1a",
          boxShadow: "0 4px 32px rgba(0,0,0,0.6)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div
            className="w-9 h-9 rounded flex items-center justify-center text-white shrink-0"
            style={{ background: "#3b82f6" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "20px", fontVariationSettings: '"FILL" 1' }}
            >
              domain
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            R-Note
          </h1>
        </div>

        <p className="text-center text-sm mb-8" style={{ color: "#a1a1aa" }}>
          Sign in to your workspace
        </p>

        <form onSubmit={handleLogin} noValidate>
          {/* Username */}
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-2"
              style={{ color: "#a1a1aa" }}
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded px-3 py-2 text-sm text-white focus:outline-none transition-colors disabled:opacity-50"
              style={{
                background: "#111111",
                border: "1px solid #1f1f1f",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1f1f1f")}
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
              style={{ color: "#a1a1aa" }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded px-3 py-2 pr-10 text-sm text-white focus:outline-none transition-colors disabled:opacity-50"
                style={{
                  background: "#111111",
                  border: "1px solid #1f1f1f",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#1f1f1f")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center disabled:opacity-50"
                style={{ color: "#a1a1aa", background: "transparent", border: "none" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "18px" }}
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-4 flex items-center gap-2 rounded px-3 py-2"
              style={{
                background: "rgba(236,72,153,0.05)",
                border: "1px solid rgba(236,72,153,0.3)",
              }}
            >
              <span
                className="material-symbols-outlined shrink-0"
                style={{ fontSize: "16px", color: "#ec4899" }}
              >
                error
              </span>
              <p className="text-sm" style={{ color: "#ec4899" }}>
                {error}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded py-2 font-semibold text-white text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#3b82f6" }}
            onMouseEnter={(e) =>
              !loading && (e.currentTarget.style.background = "#2563eb")
            }
            onMouseLeave={(e) =>
              !loading && (e.currentTarget.style.background = "#3b82f6")
            }
          >
            {loading && (
              <span
                className="material-symbols-outlined animate-spin"
                style={{ fontSize: "18px" }}
              >
                progress_activity
              </span>
            )}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
