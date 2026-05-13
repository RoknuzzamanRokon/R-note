"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, removeAccessToken } from "@/lib/api";
import { useSidebar } from "./SidebarContext";

const TopAppBar = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [dark, setDark] = useState(true);
  const router = useRouter();
  const { toggle } = useSidebar();

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : true;
    setDark(isDark);
    // Don't call applyTheme here — the blocking script already set it
  }, []);

  const applyTheme = (isDark: boolean) => {
    const html = document.documentElement;
    if (isDark) {
      html.removeAttribute("data-theme");
    } else {
      html.setAttribute("data-theme", "light");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    applyTheme(next);
  };

  const handleLogout = () => {
    removeAccessToken();
    setLoggedIn(false);
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-nav-bg border-b border-outline-variant flex items-center justify-between px-lg z-50 transition-colors duration-300">
      {/* Left: sidebar toggle + logo */}
      <div className="flex items-center gap-md">
        <button
          onClick={toggle}
          className="text-on-surface-variant hover:text-white p-1.5 rounded hover:bg-surface-variant transition-colors"
          title="Toggle sidebar"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <div className="flex items-center gap-sm">
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-white shrink-0"
            style={{ background: "#3b82f6" }}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              domain
            </span>
          </div>
          <span
            className="text-title-lg font-bold tracking-tight"
            style={{ color: "var(--fg)" }}
          >
            R-Note
          </span>
        </div>
      </div>

      {/* Right: theme toggle + logout */}
      <div className="flex items-center gap-xs">
        {/* Theme toggle switch */}
        <button
          onClick={toggleTheme}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          className="relative w-14 h-7 rounded-full border transition-all duration-300 flex items-center px-1 shrink-0"
          style={{
            background: dark ? "#1e293b" : "#e2e8f0",
            borderColor: dark ? "#334155" : "#cbd5e1",
          }}
        >
          {/* Sun icon (left) */}
          <span
            className="material-symbols-outlined absolute left-1.5 text-[14px] transition-opacity duration-300"
            style={{
              color: "#f59e0b",
              opacity: dark ? 0.3 : 1,
              fontVariationSettings: '"FILL" 1',
            }}
          >
            light_mode
          </span>
          {/* Moon icon (right) */}
          <span
            className="material-symbols-outlined absolute right-1.5 text-[14px] transition-opacity duration-300"
            style={{
              color: "#818cf8",
              opacity: dark ? 1 : 0.3,
              fontVariationSettings: '"FILL" 1',
            }}
          >
            dark_mode
          </span>
          {/* Sliding thumb */}
          <span
            className="w-5 h-5 rounded-full shadow-md transition-all duration-300 flex items-center justify-center shrink-0"
            style={{
              background: dark ? "#6366f1" : "#f59e0b",
              transform: dark ? "translateX(28px)" : "translateX(0px)",
            }}
          >
            <span
              className="material-symbols-outlined text-white"
              style={{ fontSize: "12px", fontVariationSettings: '"FILL" 1' }}
            >
              {dark ? "dark_mode" : "light_mode"}
            </span>
          </span>
        </button>

        {/* Logout */}
        {loggedIn && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-xs px-md py-1.5 rounded text-label-md font-bold transition-colors"
            style={{
              background: "rgba(236,72,153,0.08)",
              color: "#ec4899",
              border: "1px solid rgba(236,72,153,0.3)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(236,72,153,0.15)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(236,72,153,0.08)")
            }
          >
            <span className="material-symbols-outlined text-[16px]">
              logout
            </span>
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default TopAppBar;
