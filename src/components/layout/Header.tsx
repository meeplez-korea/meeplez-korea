"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { SITE_NAME } from "@/lib/constants";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-primary/20 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/meeplez.jpg" alt="미플즈" className="w-10 h-10 rounded-lg object-cover" />
          <span className="text-xl font-bold text-primary">{SITE_NAME}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
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
          <Link
            href="/admin"
            className="ml-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            관리
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-cream"
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
        <nav className="md:hidden bg-white border-t border-gray-100 py-2 px-4">
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
          <Link
            href="/admin"
            className="block px-3 py-3 text-xs text-gray-400 hover:text-gray-600"
            onClick={() => setMenuOpen(false)}
          >
            관리자
          </Link>
        </nav>
      )}
    </header>
  );
}
