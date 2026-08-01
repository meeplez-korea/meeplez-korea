"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { SITE_NAME } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { signOut } from "@/lib/storage";

function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
    >
      {isDark ? (
        <svg className="w-[18px] h-[18px] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-[18px] h-[18px] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, profile, isAdmin, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 bg-cream/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/meeplez.jpg" alt="미플즈" className="w-8 h-8 rounded-lg object-cover" />
          <span className="text-lg font-semibold tracking-tight text-primary">{SITE_NAME}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/board/${cat.slug}`}
              className="px-3 py-1.5 text-[13px] text-gray-500 dark:text-gray-400 rounded-md hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
            >
              {cat.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-1.5 text-[13px] text-gray-400 dark:text-gray-500 rounded-md hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
            >
              관리
            </Link>
          )}

          <div className="ml-1 pl-2 border-l border-black/[0.06] dark:border-white/[0.06] flex items-center gap-1">
            <ThemeToggle />
            {!loading && (
              <>
                {user ? (
                  <>
                    <span className="text-[13px] text-gray-500 dark:text-gray-400 ml-1">{profile?.nickname}</span>
                    <button
                      onClick={handleSignOut}
                      className="text-[13px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-1"
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="ml-1 px-3 py-1.5 text-[13px] bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                  >
                    로그인
                  </Link>
                )}
              </>
            )}
          </div>
        </nav>

        {/* Mobile */}
        <div className="lg:hidden flex items-center gap-0.5">
          <ThemeToggle />
          <button
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="lg:hidden bg-cream dark:bg-dark-card border-t border-black/[0.04] dark:border-white/[0.04] py-1 px-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/board/${cat.slug}`}
              className="block px-3 py-2.5 text-[14px] text-gray-600 dark:text-gray-300 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {cat.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="block px-3 py-2.5 text-[13px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setMenuOpen(false)}
            >
              관리자
            </Link>
          )}
          <div className="border-t border-black/[0.04] dark:border-white/[0.04] mt-1 pt-1">
            {user ? (
              <div className="px-3 py-2.5 flex items-center justify-between">
                <span className="text-[14px] text-gray-500 dark:text-gray-400">{profile?.nickname}</span>
                <button
                  onClick={() => { handleSignOut(); setMenuOpen(false); }}
                  className="text-[13px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="block px-3 py-2.5 text-[14px] text-primary font-medium"
                onClick={() => setMenuOpen(false)}
              >
                로그인
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
