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

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-1.5 rounded-lg hover:bg-cream dark:hover:bg-dark-border transition-colors"
      title={theme === "system" ? "시스템 설정" : isDark ? "다크 모드" : "라이트 모드"}
    >
      {theme === "system" ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ) : isDark ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
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
    <header className="sticky top-0 z-50 bg-[#FAF8F4] dark:bg-dark-bg border-b border-primary/20 dark:border-dark-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/meeplez.jpg" alt="미플즈" className="w-10 h-10 rounded-lg object-cover" />
          <span className="text-xl font-bold text-primary">{SITE_NAME}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/board/${cat.slug}`}
              className="px-3 py-2 text-sm rounded-lg hover:bg-cream dark:hover:bg-dark-border transition-colors"
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="ml-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              관리
            </Link>
          )}

          <ThemeToggle />

          {!loading && (
            <div className="ml-2 pl-3 border-l border-gray-200 dark:border-dark-border flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{profile?.nickname}</span>
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  로그인
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* Mobile */}
        <div className="lg:hidden flex items-center gap-1">
          <ThemeToggle />
          <button
            className="p-2 rounded-lg hover:bg-cream dark:hover:bg-dark-border"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="lg:hidden bg-white dark:bg-dark-card border-t border-gray-100 dark:border-dark-border py-2 px-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/board/${cat.slug}`}
              className="block px-3 py-3 text-sm rounded-lg hover:bg-cream dark:hover:bg-dark-border transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="block px-3 py-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setMenuOpen(false)}
            >
              관리자
            </Link>
          )}
          <div className="border-t border-gray-100 dark:border-dark-border mt-2 pt-2">
            {user ? (
              <div className="px-3 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">{profile?.nickname}</span>
                <button
                  onClick={() => { handleSignOut(); setMenuOpen(false); }}
                  className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="block px-3 py-3 text-sm text-primary font-medium"
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
