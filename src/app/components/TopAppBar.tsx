"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, removeAccessToken } from "@/lib/api";

const TopAppBar = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  // Read cookie state on mount (client-only)
  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  const handleLogout = () => {
    removeAccessToken();
    setLoggedIn(false);
    router.push("/login");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-14 bg-background border-b border-outline-variant flex justify-between items-center px-lg z-40">
      {/* Search */}
      <div className="flex items-center gap-lg flex-1">
        <div className="relative w-full max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            className="w-full pl-9 pr-4 py-1.5 bg-[#111] border border-outline-variant rounded text-body-md focus:outline-none focus:border-royal-blue transition-all placeholder-on-surface-variant/50"
            placeholder="Search knowledge..."
            type="text"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-outline font-mono border border-outline-variant px-1 rounded">
            ⌘ K
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-md">
        <div className="flex items-center gap-xs">
          <button className="text-on-surface-variant hover:text-white p-2 transition-colors">
            <span className="material-symbols-outlined text-[20px]">
              notifications
            </span>
          </button>

          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-xs bg-tanstack-pink/10 text-tanstack-pink border border-tanstack-pink/30 px-md py-1.5 rounded text-label-md font-bold hover:bg-tanstack-pink/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                logout
              </span>
              Logout
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-[#222] text-white px-md py-1.5 rounded text-label-md font-bold hover:bg-[#333] transition-colors border border-[#444]"
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopAppBar;
