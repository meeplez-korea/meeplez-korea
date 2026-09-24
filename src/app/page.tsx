"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPosts, getPromotions, getReadPostIds, NEW_FEATURE_BASELINE } from "@/lib/storage";
import { Post, Promotion } from "@/lib/types";
import { formatDateShort, truncate, stripHtml, sanitizeHtml } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, profile, isPending, loading } = useAuth();
  const [notices, setNotices] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Post[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [readPostIds, setReadPostIds] = useState<Set<string>>(new Set());
  const [readLoaded, setReadLoaded] = useState(false);

  const isNew = (post: Post) =>
    readLoaded &&
    !!user &&
    new Date(post.created_at) > new Date(NEW_FEATURE_BASELINE) &&
    !readPostIds.has(post.id);

  useEffect(() => {
    if (loading) return;
    if (!user) { setReadLoaded(true); return; }
    if (dataLoading) return;
    const allPosts = [...notices, ...reviews].filter(p => new Date(p.created_at) > new Date(NEW_FEATURE_BASELINE));
    if (allPosts.length === 0) { setReadLoaded(true); return; }
    setReadLoaded(false);
    getReadPostIds(user.id, allPosts.map(p => p.id))
      .then(setReadPostIds)
      .catch(() => {})
      .finally(() => setReadLoaded(true));
  }, [notices, reviews, user, dataLoading, loading]);

  useEffect(() => {
    Promise.all([
      getPosts("notices").then((data) => {
        const pinned = data.filter((p) => p.is_pinned);
        const unpinned = data.filter((p) => !p.is_pinned);
        setNotices([...pinned, ...unpinned].slice(0, 3));
      }),
      getPosts("reviews").then((data) => setReviews(data.slice(0, 3))),
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
          <div className="bg-white dark:bg-dark-card rounded-xl px-5 py-4 space-y-3 shadow-card dark:shadow-card-dark">
            {promotions.map((promo, i) => (
              <div key={promo.id}>
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5 shrink-0">{promo.icon || "📣"}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200">{promo.title}</h3>
                    <div className="post-content text-xs text-gray-500 dark:text-gray-400 mt-0.5" dangerouslySetInnerHTML={{ __html: sanitizeHtml(promo.content) }} />
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
        <div className="mb-5">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2.5">
            <span className="w-1 h-5 bg-danger rounded-full inline-block" />
            공지사항
          </h2>
        </div>
        <div className="space-y-2">
          {notices.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">등록된 공지사항이 없습니다.</p>
          ) : (
            notices.map((post) => (
              <Link
                key={post.id}
                href={`/board/notices/${post.id}`}
                className="block bg-white dark:bg-dark-card rounded-xl px-5 py-4 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-dark-hover transition-all duration-200 group"
              >
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-1.5 flex-wrap">
                  {post.is_pinned && <span className="text-[11px] text-danger font-bold">[고정]</span>}
                  {isNew(post) && <span className="text-[10px] font-bold text-white bg-red-400 rounded px-1.5 py-0.5 leading-none">NEW</span>}
                  {post.title}
                  {(post.comment_count ?? 0) > 0 && (
                    <span className="text-primary text-xs font-semibold">[{post.comment_count}]</span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed whitespace-pre-line">
                  {stripHtml(post.content.replace(/<\/p>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")).trim()}
                </p>
                <span className="text-[11px] text-gray-300 dark:text-gray-600 mt-2 block tabular-nums">
                  {formatDateShort(post.created_at)}
                </span>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Reviews */}
      <section className="animate-slide-up-delay">
        <div className="mb-5">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2.5">
            <span className="w-1 h-5 bg-primary rounded-full inline-block" />
            모임 후기
          </h2>
        </div>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">등록된 후기가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((post) => (
              <Link
                key={post.id}
                href={`/board/reviews/${post.id}`}
                className="bg-white dark:bg-dark-card rounded-xl overflow-hidden shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-dark-hover transition-all duration-200 group"
              >
                {post.thumbnail_url ? (
                  <div className="aspect-[16/10] bg-gray-100 dark:bg-dark-border overflow-hidden">
                    <img
                      src={post.thumbnail_url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gray-100 dark:bg-dark-border flex items-center justify-center">
                    <span className="text-3xl opacity-20">📸</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
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
                    {isNew(post) && (
                      <span className="text-[10px] font-bold text-white bg-red-400 rounded px-1.5 py-0.5 leading-none">NEW</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                    {(post.comment_count ?? 0) > 0 && (
                      <span className="text-primary text-xs font-semibold ml-1">[{post.comment_count}]</span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5 line-clamp-4 leading-relaxed whitespace-pre-line">
                    {stripHtml(post.content.replace(/<\/p>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")).trim()}
                  </p>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-dark-border text-[11px] text-gray-400 dark:text-gray-500">
                    <span className="font-medium">{post.author_name}</span>
                    <span className="tabular-nums">{formatDateShort(post.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {reviews.length > 0 && (
          <div className="flex justify-end mt-4">
            <Link href="/board/reviews" className="text-sm text-gray-400 hover:text-primary font-medium">
              전체보기 &rarr;
            </Link>
          </div>
        )}
      </section>

      </>)}
    </div>
  );
}
