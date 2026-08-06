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
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPosts("notices").then((data) => {
        const pinned = data.filter((p) => p.is_pinned);
        const unpinned = data.filter((p) => !p.is_pinned);
        setNotices([...pinned, ...unpinned].slice(0, 3));
      }),
      getPosts("reviews").then((data) => setReviews(data.slice(0, 6))),
      getPromotions().then(setPromotions),
    ]).finally(() => setDataLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {dataLoading ? (
        <div className="min-h-[50vh]" />
      ) : (<>
      {!loading && user && isPending && (
        <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-xl">
          <p className="text-sm font-semibold text-secondary">승인 대기 중입니다</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            오픈채팅방에서 관리자에게 승인을 요청해주세요. 승인 후 게시판 이용이 가능합니다.
          </p>
        </div>
      )}

      {promotions.length > 0 && (
        <section className="space-y-3">
          {promotions.map((promo) => (
            <div key={promo.id} className="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-xl p-5 border border-primary/20 dark:border-primary/30">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">📣</span>
                <div>
                  <h3 className="font-bold text-sm text-primary">{promo.title}</h3>
                  <div className="post-content text-xs text-gray-600 dark:text-gray-300 mt-1" dangerouslySetInnerHTML={{ __html: promo.content }} />
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-1 h-5 bg-danger rounded-full inline-block" />
            공지사항
          </h2>
          <Link href="/board/notices" className="text-sm text-gray-400 hover:text-primary transition-colors">
            전체보기 &rarr;
          </Link>
        </div>
        <div className="flex gap-4">
          <div className="flex-[8] space-y-2">
            {dataLoading ? null : notices.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">등록된 공지사항이 없습니다.</p>
            ) : (
              notices.map((post) => (
                <Link
                  key={post.id}
                  href={`/board/notices/${post.id}`}
                  className="block bg-white dark:bg-dark-card rounded-xl px-5 py-4 border border-gray-100 dark:border-dark-border hover:border-primary/30 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                        {post.is_pinned && <span className="text-xs text-danger font-bold">[고정]</span>}
                        {post.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                        {truncate(stripHtml(post.content), 80)}
                      </p>
                    </div>
                    <span className="text-xs text-gray-300 dark:text-gray-500 whitespace-nowrap shrink-0">
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                </Link>
            ))
          )}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full inline-block" />
            모임 후기
          </h2>
          <Link href="/board/reviews" className="text-sm text-gray-400 hover:text-primary transition-colors">
            전체보기 &rarr;
          </Link>
        </div>
        {dataLoading ? null : reviews.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">등록된 후기가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((post) => (
              <Link
                key={post.id}
                href={`/board/reviews/${post.id}`}
                className="bg-white dark:bg-dark-card rounded-xl overflow-hidden border border-gray-100 dark:border-dark-border hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                {post.thumbnail_url ? (
                  <div className="aspect-[16/10] bg-gray-100 dark:bg-dark-border">
                    <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-primary/5 via-cream dark:via-dark-border to-accent/10 flex items-center justify-center">
                    <span className="text-3xl opacity-20">📸</span>
                  </div>
                )}
                <div className="p-4">
                  {post.tag && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        post.tag === "보드게임"
                          ? "bg-tag-board/15 text-tag-board"
                          : post.tag === "외부활동"
                          ? "bg-tag-outdoor/15 text-tag-outdoor"
                          : "bg-tag-all/15 text-tag-all"
                      }`}
                    >
                      {post.tag}
                    </span>
                  )}
                  <h3 className="font-semibold text-sm mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {truncate(stripHtml(post.content), 60)}
                  </p>
                  <div className="flex justify-between items-center mt-3 text-[11px] text-gray-300 dark:text-gray-500">
                    <span>{post.author_name}</span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { href: "/board/introductions", icon: "👋", label: "자기소개방" },
            { href: "/board/tournaments", icon: "🏆", label: "대회 기록" },
            { href: "/board/events", icon: "🎉", label: "이벤트" },
            { href: "/board/chat", icon: "💬", label: "잡담방" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-cream dark:hover:bg-dark-border transition-colors text-sm"
            >
              <span className="text-lg">{link.icon}</span>
              <span className="font-medium text-gray-600 dark:text-gray-300">{link.label}</span>
            </Link>
          ))}
          <a
            href="https://open.kakao.com/o/gBomGhqi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-cream dark:hover:bg-dark-border transition-colors text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.44 4.08 3.62 5.17-.16.56-.57 2.03-.66 2.35-.1.39.14.39.3.28.13-.08 2.01-1.36 2.82-1.91.6.09 1.23.13 1.87.13 4.42 0 8-2.79 8-6.23C17 3.79 13.42 1 9 1z" className="fill-gray-800 dark:fill-gray-200"/>
            </svg>
            <span className="font-medium text-gray-600 dark:text-gray-300">오픈채팅</span>
          </a>
        </div>
      </section>
      </>)}
    </div>
  );
}
