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
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {dataLoading ? (
        <div className="min-h-[50vh]" />
      ) : (<>
      {!loading && user && isPending && (
        <div className="p-4 bg-secondary/8 border border-secondary/15 rounded-xl animate-fade-in">
          <p className="text-sm font-semibold text-secondary">승인 대기 중입니다</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            오픈채팅방에서 관리자에게 승인을 요청해주세요. 승인 후 게시판 이용이 가능합니다.
          </p>
        </div>
      )}

      {/* Promotions */}
      {promotions.length > 0 && (
        <section className="animate-fade-in">
          <div className="bg-cream/60 dark:bg-dark-card rounded-xl px-5 py-4 space-y-3">
            {promotions.map((promo, i) => (
              <div key={promo.id}>
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5 shrink-0">{promo.icon || "📣"}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200">{promo.title}</h3>
                    <div className="post-content text-xs text-gray-500 dark:text-gray-400 mt-0.5" dangerouslySetInnerHTML={{ __html: promo.content }} />
                  </div>
                </div>
                {i < promotions.length - 1 && <div className="border-b border-gray-200/50 dark:border-dark-border mt-3" />}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Notices */}
      <section className="animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2.5">
            <span className="w-1 h-5 bg-danger rounded-full inline-block" />
            공지사항
          </h2>
          <Link href="/board/notices" className="text-sm text-gray-400 hover:text-primary font-medium">
            전체보기 &rarr;
          </Link>
        </div>
        <div className="space-y-2">
          {notices.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">등록된 공지사항이 없습니다.</p>
          ) : (
            notices.map((post) => (
              <Link
                key={post.id}
                href={`/board/notices/${post.id}`}
                className="block bg-white dark:bg-dark-card rounded-xl px-5 py-4 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-px transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                      {post.is_pinned && <span className="text-[11px] text-danger font-bold">[고정]</span>}
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">
                      {truncate(stripHtml(post.content), 80)}
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-300 dark:text-gray-600 whitespace-nowrap shrink-0 font-medium tabular-nums">
                    {formatDate(post.created_at)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Reviews */}
      <section className="animate-slide-up-delay">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2.5">
            <span className="w-1 h-5 bg-primary rounded-full inline-block" />
            모임 후기
          </h2>
          <Link href="/board/reviews" className="text-sm text-gray-400 hover:text-primary font-medium">
            전체보기 &rarr;
          </Link>
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">등록된 후기가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((post) => (
              <Link
                key={post.id}
                href={`/board/reviews/${post.id}`}
                className="bg-white dark:bg-dark-card rounded-xl overflow-hidden shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-1 transition-all duration-300 group"
              >
                {post.thumbnail_url ? (
                  <div className="aspect-[16/10] bg-gray-100 dark:bg-dark-border overflow-hidden">
                    <img
                      src={post.thumbnail_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-primary/5 via-cream dark:via-dark-border to-secondary/5 flex items-center justify-center">
                    <span className="text-3xl opacity-15">📸</span>
                  </div>
                )}
                <div className="p-4">
                  {post.tag && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                        post.tag === "보드게임"
                          ? "bg-tag-board/10 text-tag-board"
                          : post.tag === "외부활동"
                          ? "bg-tag-outdoor/10 text-tag-outdoor"
                          : "bg-tag-all/10 text-tag-all"
                      }`}
                    >
                      {post.tag}
                    </span>
                  )}
                  <h3 className="font-semibold text-sm mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {truncate(stripHtml(post.content), 60)}
                  </p>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-dark-border text-[11px] text-gray-400 dark:text-gray-500">
                    <span className="font-medium">{post.author_name}</span>
                    <span className="tabular-nums">{formatDate(post.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      </>)}
    </div>
  );
}
