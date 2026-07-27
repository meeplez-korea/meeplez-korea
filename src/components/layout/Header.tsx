"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { SITE_NAME } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/storage";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, profile, isAdmin, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-primary/20 shadow-sm">
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
              className="px-3 py-2 text-sm rounded-lg hover:bg-cream transition-colors"
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="ml-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              관리
            </Link>
          )}

          {/* Auth buttons */}
          {!loading && (
            <div className="ml-3 pl-3 border-l border-gray-200 flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-xs text-gray-500">{profile?.nickname}</span>
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
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

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-cream"
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

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="lg:hidden bg-white border-t border-gray-100 py-2 px-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/board/${cat.slug}`}
              className="block px-3 py-3 text-sm rounded-lg hover:bg-cream transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="block px-3 py-3 text-xs text-gray-400 hover:text-gray-600"
              onClick={() => setMenuOpen(false)}
            >
              관리자
            </Link>
          )}
          <div className="border-t border-gray-100 mt-2 pt-2">
            {user ? (
              <div className="px-3 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">{profile?.nickname}</span>
                <button
                  onClick={() => { handleSignOut(); setMenuOpen(false); }}
                  className="text-sm text-gray-400 hover:text-gray-600"
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
