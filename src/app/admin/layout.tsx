"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/live", label: "Live Progress" },
  { href: "/admin/results", label: "Results" },
  { href: "/admin/leaderboard", label: "Leaderboard" },
  { href: "/admin/settings", label: "Game Settings" },
  { href: "/admin/sets", label: "Set Management" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Demo auth: check localStorage. In production use Supabase session + is_admin
    const adminFlag = localStorage.getItem("cq_admin");
    if (adminFlag === "true") {
      setAuthorized(true);
    } else {
      // Allow quick demo access with a secret
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("key") === "admin123") {
        localStorage.setItem("cq_admin", "true");
        setAuthorized(true);
      }
    }
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <div className="text-cyan-400 font-cyber animate-pulse">Checking access...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a] px-4">
        <div className="glass-strong p-8 rounded-2xl max-w-md text-center">
          <h1 className="font-cyber text-2xl text-red-400 mb-4">ACCESS DENIED</h1>
          <p className="text-slate-400 mb-6">
            Admin area is protected. In production this checks Supabase <code>is_admin</code>.
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Demo: open <code className="text-cyan-400">/admin?key=admin123</code>
          </p>
          <button
            onClick={() => router.push("/")}
            className="btn-cyber px-6 py-2 rounded-lg text-white"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Top bar */}
      <header className="border-b border-cyan-500/20 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-cyber text-cyan-400 text-lg tracking-wider">404: Key Not Found</span>
            <span className="text-xs bg-purple-600/40 text-purple-200 px-2 py-0.5 rounded">ADMIN</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-slate-400 hover:text-cyan-300">
              ← Exit Admin
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem("cq_admin");
                router.push("/");
              }}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <nav className="glass rounded-xl p-3 space-y-1 sticky top-20">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2.5 rounded-lg text-sm transition-all",
                    active
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full mb-4 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs whitespace-nowrap",
                    active
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-slate-800 text-slate-400"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
