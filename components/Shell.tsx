"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("mqa_theme", next ? "dark" : "light");
    } catch {}
  }

  function logout() {
    document.cookie = "mqa_token=; Max-Age=0; path=/";
    router.push("/login");
  }

  const nav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/meetings", label: "Meetings" },
    { href: "/dashboard/attendance", label: "Attendance" },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-gov-800 text-white sticky top-0 z-40 shadow">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/15 flex items-center justify-center font-bold">
              QR
            </div>
            <div>
              <p className="font-bold leading-tight">Meeting QR Attendance</p>
              <p className="text-xs opacity-75">Admin Dashboard</p>
            </div>
          </div>
          <nav className="flex items-center gap-1 flex-wrap">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === n.href
                    ? "bg-white/20"
                    : "hover:bg-white/10 opacity-85"
                }`}
              >
                {n.label}
              </Link>
            ))}
            <button
              onClick={toggleDark}
              className="rounded-lg px-3 py-1.5 text-sm hover:bg-white/10"
              title="Toggle dark mode"
            >
              {dark ? "Light" : "Dark"}
            </button>
            <button
              onClick={logout}
              className="rounded-lg bg-red-500/80 hover:bg-red-500 px-3 py-1.5 text-sm font-medium ml-1"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
