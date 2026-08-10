"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { SITE_NAME } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { signOut, getUnreadCount, getNotifications, markNotificationsRead } from "@/lib/storage";
import { Notification } from "@/lib/types";

function ThemeToggle() {
  const { setTheme, isDark } = useTheme();
  const debouncing = useRef(false);

  const toggleTheme = () => {
    if (debouncing.current) return;
    debouncing.current = true;
    setTheme(isDark ? "light" : "dark");
    setTimeout(() => { debouncing.current = false; }, 300);
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

function NotificationBell() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    getUnreadCount(user.id).then(setUnread).catch(() => {});
    const interval = setInterval(() => {
      getUnreadCount(user.id).then(setUnread).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = async () => {
    if (!user) return;
    setOpen(!open);
    if (!open) {
      const data = await getNotifications(user.id);
      setNotifications(data);
      if (unread > 0) {
        await markNotificationsRead(user.id);
        setUnread(0);
      }
    }
  };

  if (!user) return <div className="w-[34px] h-[34px]" />;

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="p-2 rounded-lg hover:bg-cream-dark dark:hover:bg-dark-hover relative" aria-label="알림">
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[28rem] overflow-y-auto bg-white dark:bg-dark-card rounded-xl shadow-card-hover dark:shadow-card-dark-hover border border-gray-200/50 dark:border-dark-border z-50 animate-slide-up max-lg:fixed max-lg:top-16 max-lg:left-3 max-lg:right-3 max-lg:w-auto">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
            <h3 className="text-sm font-bold">알림</h3>
            {notifications.length > 0 && (
              <span className="text-[11px] text-gray-400">{notifications.length}건</span>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="py-10 text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-sm text-gray-400">알림이 없습니다</p>
            </div>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 border-b border-gray-100/80 dark:border-dark-border/50 hover:bg-cream/40 dark:hover:bg-dark-hover transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {!n.is_read && (
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                  <div className={n.is_read ? "pl-[18px]" : ""}>
                    <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{n.title}</p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 tabular-nums">{new Date(n.created_at).toLocaleDateString("ko-KR")}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, profile, isAdmin, loading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <>
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#F7F4EE]/85 dark:bg-[#161618]/85 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)]"
          : "bg-[#F7F4EE] dark:bg-[#161618]"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img src="/meeplez.jpg" alt="미플즈" className="w-9 h-9 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-primary/30 transition-all" />
          <span className="text-lg font-bold tracking-tight text-gray-800 dark:text-gray-100">{SITE_NAME}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} href={`/board/${cat.slug}`} className="px-3 py-1.5 text-[13px] font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-cream-dark dark:hover:bg-dark-hover">
              <span className="mr-1">{cat.icon}</span>{cat.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="ml-1 px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-cream-dark dark:hover:bg-dark-hover">관리</Link>
          )}

          <div className="w-px h-5 bg-gray-200 dark:bg-dark-border mx-1.5" />

          <ThemeToggle />
          <NotificationBell />

          <div className="ml-1 flex items-center gap-2">
            {loading ? (
              <div className="w-[60px] h-[28px]" />
            ) : user ? (
              <>
                <Link href="/profile" className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-primary">{profile?.nickname}</Link>
                <button onClick={() => setShowLogoutConfirm(true)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">로그아웃</button>
              </>
            ) : (
              <Link href="/login" className="px-3.5 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark active:bg-primary-dark">로그인</Link>
            )}
          </div>
        </nav>

        {/* Mobile */}
        <div className="lg:hidden flex items-center gap-0.5">
          <NotificationBell />
          <ThemeToggle />
          <button className="p-2 rounded-lg hover:bg-cream-dark dark:hover:bg-dark-hover" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}>
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
      <div className={`lg:hidden fixed inset-0 top-14 bg-black/20 dark:bg-black/40 z-40 transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={() => setMenuOpen(false)} />

      {/* Mobile menu */}
      <nav className={`lg:hidden fixed top-14 left-0 right-0 z-50 bg-[#F7F4EE] dark:bg-dark-card border-b border-gray-200/50 dark:border-dark-border shadow-card-hover dark:shadow-card-dark-hover transition-all duration-300 ease-out-expo ${menuOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0 pointer-events-none"}`}>
        <div className="max-w-6xl mx-auto px-4 py-2">
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} href={`/board/${cat.slug}`} className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-cream-dark dark:hover:bg-dark-hover" onClick={() => setMenuOpen(false)}>
              <span className="text-base">{cat.icon}</span>{cat.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-2.5 px-3 py-3 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onClick={() => setMenuOpen(false)}>관리자</Link>
          )}
          <div className="border-t border-gray-200/50 dark:border-dark-border my-1" />
          {user ? (
            <div className="px-3 py-3 flex items-center justify-between">
              <Link href="/profile" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary" onClick={() => setMenuOpen(false)}>{profile?.nickname}</Link>
              <button onClick={() => { setMenuOpen(false); setShowLogoutConfirm(true); }} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">로그아웃</button>
            </div>
          ) : (
            <Link href="/login" className="block px-3 py-3 text-sm font-medium text-primary" onClick={() => setMenuOpen(false)}>로그인</Link>
          )}
        </div>
      </nav>
    </header>

    {/* Logout confirm */}
    {showLogoutConfirm && (
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 w-full max-w-xs shadow-card-hover dark:shadow-card-dark-hover animate-slide-up">
          <h3 className="font-bold mb-2">로그아웃</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">로그아웃 하시겠습니까?</p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover">취소</button>
            <button onClick={handleSignOut} className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark">로그아웃</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
