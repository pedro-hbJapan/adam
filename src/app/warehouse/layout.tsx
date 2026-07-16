"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard/warehouse", label: "ダッシュボード" },
];

export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-gradient-to-r from-[#667eea] to-[#764ba2] px-4 py-3 text-white lg:hidden">
        <button
          onClick={() => setMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20"
          aria-label="メニューを開く"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h16M3 11h16M3 16h16" />
          </svg>
        </button>
        <span className="text-xl font-extrabold tracking-tight">Adam</span>
        <div className="w-10" />
      </header>

      {/* Mobile overlay nav */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="absolute left-0 top-0 flex h-full w-64 flex-col bg-gradient-to-b from-[#667eea] to-[#764ba2] p-5 text-white">
            <div className="mb-6 text-2xl font-extrabold">Adam</div>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`mb-1 block rounded-md px-3 py-3 text-base no-underline transition-colors ${
                  pathname === item.href
                    ? "bg-white/25 font-semibold text-white"
                    : "text-white/85 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-auto rounded-md border border-white/30 bg-white/20 px-3 py-3 text-left text-sm text-white"
            >
              ログアウト
            </button>
          </nav>
        </div>
      )}

      {/* Desktop layout */}
      <div className="hidden lg:flex lg:min-h-screen">
        <aside className="flex w-60 shrink-0 flex-col bg-gradient-to-b from-[#667eea] to-[#764ba2] p-5 text-white">
          <div className="mb-6 text-2xl font-extrabold tracking-tight">Adam</div>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2.5 text-sm no-underline transition-colors ${
                  pathname === item.href
                    ? "bg-white/25 font-semibold text-white"
                    : "text-white/85 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md border border-white/30 bg-white/20 px-3 py-2.5 text-left text-sm text-white"
          >
            ログアウト
          </button>
        </aside>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>

      {/* Mobile main content */}
      <main className="p-4 lg:hidden">{children}</main>
    </div>
  );
}
