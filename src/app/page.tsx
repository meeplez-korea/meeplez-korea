"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPosts, seedData } from "@/lib/storage";
import { Post } from "@/lib/types";
import { formatDate, truncate } from "@/lib/utils";

export default function Home() {
  const [notices, setNotices] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Post[]>([]);

  useEffect(() => {
    seedData();
    setNotices(getPosts("notices").slice(0, 3));
    setReviews(getPosts("reviews").slice(0, 6));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Notices */}
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
        <div className="space-y-2">
          {notices.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">등록된 공지사항이 없습니다.</p>
          ) : (
            notices.map((post) => (
              <Link
                key={post.id}
                href={`/board/notices/${post.id}`}
                className="block bg-white rounded-xl px-5 py-4 border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                      {truncate(post.content.replace(/\n/g, " "), 80)}
                    </p>
                  </div>
                  <span className="text-xs text-gray-300 whitespace-nowrap shrink-0">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Reviews */}
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
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">등록된 후기가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((post) => (
              <Link
                key={post.id}
                href={`/board/reviews/${post.id}`}
                className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                {post.thumbnailUrl ? (
                  <div className="aspect-[16/10] bg-gray-100">
                    <img src={post.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-primary/5 via-cream to-accent/10 flex items-center justify-center">
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
                    {truncate(post.content.replace(/\n/g, " "), 60)}
                  </p>
                  <div className="flex justify-between items-center mt-3 text-[11px] text-gray-300">
                    <span>{post.author}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/board/introductions", icon: "👋", label: "자기소개방" },
            { href: "/board/tournaments", icon: "🏆", label: "대회 기록" },
            { href: "/board/events", icon: "🎉", label: "이벤트" },
            { href: "/board/chat", icon: "💬", label: "잡담방" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-cream transition-colors text-sm"
            >
              <span className="text-lg">{link.icon}</span>
              <span className="font-medium text-gray-600">{link.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
