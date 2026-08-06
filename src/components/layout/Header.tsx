"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { SITE_NAME } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { signOut } from "@/lib/storage";

function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme();

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-cream-dark dark:hover:bg-dark-hover"
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {isDark ? (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, isAdmin, loading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#F7F4EE]/85 dark:bg-[#161618]/85 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)]"
          : "bg-[#F7F4EE] dark:bg-[#161618]"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/meeplez.jpg"
            alt="미플즈"
            className="w-9 h-9 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-primary/30 transition-all"
          />
          <span className="text-lg font-bold tracking-tight text-gray-800 dark:text-gray-100">{SITE_NAME}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/board/${cat.slug}`}
              className="px-3 py-1.5 text-[13px] font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-cream-dark dark:hover:bg-dark-hover"
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="ml-1 px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-cream-dark dark:hover:bg-dark-hover"
            >
              관리
            </Link>
          )}

          <div className="w-px h-5 bg-gray-200 dark:bg-dark-border mx-1.5" />

          <ThemeToggle />

          {!loading && (
            <div className="ml-1 flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{profile?.nickname}</span>
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark active:bg-primary-dark"
                >
                  로그인
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* Mobile */}
        <div className="lg:hidden flex items-center gap-0.5">
          <ThemeToggle />
          <button
            className="p-2 rounded-lg hover:bg-cream-dark dark:hover:bg-dark-hover"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
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

      {/* Mobile menu overlay */}
      <div
        className={`lg:hidden fixed inset-0 top-14 bg-black/20 dark:bg-black/40 z-40 transition-opacity duration-300 ${
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile menu panel */}
      <nav
        className={`lg:hidden fixed top-14 left-0 right-0 z-50 bg-[#F7F4EE] dark:bg-dark-card border-b border-gray-200/50 dark:border-dark-border shadow-card-hover dark:shadow-card-dark-hover transition-all duration-300 ease-out-expo ${
          menuOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/board/${cat.slug}`}
              className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-cream-dark dark:hover:bg-dark-hover"
              onClick={() => setMenuOpen(false)}
            >
              <span className="text-base">{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-3 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setMenuOpen(false)}
            >
              관리자
            </Link>
          )}
          <div className="border-t border-gray-200/50 dark:border-dark-border my-1" />
          {user ? (
            <div className="px-3 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{profile?.nickname}</span>
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
              className="block px-3 py-3 text-sm font-medium text-primary"
              onClick={() => setMenuOpen(false)}
            >
              로그인
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
