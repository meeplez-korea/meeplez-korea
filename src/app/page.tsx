"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPosts, getPromotions } from "@/lib/storage";
import { Post, Promotion } from "@/lib/types";
import { formatDate, truncate, stripHtml } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, profile, isPending, loading } = useAuth();
  const [notices, setNotices] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Post[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    getPosts("notices").then((data) => {
      const pinned = data.filter((p) => p.is_pinned);
      const unpinned = data.filter((p) => !p.is_pinned);
      setNotices([...pinned, ...unpinned].slice(0, 3));
    });
    getPosts("reviews").then((data) => setReviews(data.slice(0, 6)));
    getPromotions().then(setPromotions);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-5 py-8 space-y-8">
      {!loading && user && isPending && (
        <div className="px-4 py-3 bg-secondary/10 border-l-2 border-secondary rounded-r-lg">
          <p className="text-sm font-medium text-secondary">승인 대기 중</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            오픈채팅방에서 관리자에게 승인을 요청해주세요.
          </p>
        </div>
      )}

      {promotions.length > 0 && (
        <section className="space-y-2">
          {promotions.map((promo) => (
            <div key={promo.id} className="bg-white dark:bg-dark-card rounded-lg px-5 py-4 border border-black/[0.06] dark:border-white/[0.06]">
              <h3 className="font-medium text-sm">{promo.title}</h3>
              <div className="post-content text-xs text-gray-500 dark:text-gray-400 mt-1" dangerouslySetInnerHTML={{ __html: promo.content }} />
            </div>
          ))}
        </section>
      )}

      {/* Notices */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold tracking-tight">공지사항</h2>
          <Link href="/board/notices" className="text-xs text-gray-400 hover:text-primary transition-colors">
            더보기
          </Link>
        </div>
        <div className="space-y-1.5">
          {notices.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">등록된 공지사항이 없습니다.</p>
          ) : (
            notices.map((post) => (
              <Link
                key={post.id}
                href={`/board/notices/${post.id}`}
                className="block bg-white dark:bg-dark-card rounded-lg px-4 py-3 border border-black/[0.06] dark:border-white/[0.06] hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-[13px] font-medium group-hover:text-primary transition-colors flex items-center gap-1.5 flex-1 min-w-0">
                    {post.is_pinned && <span className="text-[11px] text-danger font-semibold">[고정]</span>}
                    <span className="truncate">{post.title}</span>
                  </h3>
                  <span className="text-[11px] text-gray-300 dark:text-gray-500 whitespace-nowrap shrink-0">
                    {formatDate(post.created_at)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Reviews */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold tracking-tight">모임 후기</h2>
          <Link href="/board/reviews" className="text-xs text-gray-400 hover:text-primary transition-colors">
            더보기
          </Link>
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">등록된 후기가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reviews.map((post) => (
              <Link
                key={post.id}
                href={`/board/reviews/${post.id}`}
                className="bg-white dark:bg-dark-card rounded-lg overflow-hidden border border-black/[0.06] dark:border-white/[0.06] hover:shadow-md hover:-translate-y-px transition-all group"
              >
                {post.thumbnail_url ? (
                  <div className="aspect-[16/10] bg-gray-50 dark:bg-dark-border">
                    <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-primary/[0.03] to-accent/[0.06] flex items-center justify-center">
                    <span className="text-2xl opacity-15">📸</span>
                  </div>
                )}
                <div className="p-3.5">
                  {post.tag && (
                    <span
                      className={`text-[10px] px-1.5 py-px rounded font-medium ${
                        post.tag === "보드게임"
                          ? "bg-tag-board/10 text-tag-board"
                          : "bg-tag-outdoor/10 text-tag-outdoor"
                      }`}
                    >
                      {post.tag}
                    </span>
                  )}
                  <h3 className="text-[13px] font-medium mt-1.5 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <div className="flex justify-between items-center mt-2.5 text-[11px] text-gray-400">
                    <span>{post.author_name}</span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="bg-white dark:bg-dark-card rounded-lg border border-black/[0.06] dark:border-white/[0.06] px-2 py-2">
        <div className="grid grid-cols-2 md:grid-cols-5">
          {[
            { href: "/board/introductions", label: "자기소개방" },
            { href: "/board/tournaments", label: "대회 기록" },
            { href: "/board/events", label: "이벤트" },
            { href: "/board/chat", label: "잡담방" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-center px-3 py-2.5 rounded-md hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://open.kakao.com/o/gBomGhqi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.44 4.08 3.62 5.17-.16.56-.57 2.03-.66 2.35-.1.39.14.39.3.28.13-.08 2.01-1.36 2.82-1.91.6.09 1.23.13 1.87.13 4.42 0 8-2.79 8-6.23C17 3.79 13.42 1 9 1z" className="fill-current"/>
            </svg>
            오픈채팅
          </a>
        </div>
      </section>
    </div>
  );
}
