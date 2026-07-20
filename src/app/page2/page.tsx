"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPosts, seedData } from "@/lib/storage";
import { Post } from "@/lib/types";
import { formatDate, truncate } from "@/lib/utils";

export default function HomeV2() {
  const [notices, setNotices] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Post[]>([]);

  useEffect(() => {
    seedData();
    setNotices(getPosts("notices").slice(0, 3));
    setReviews(getPosts("reviews").slice(0, 6));
  }, []);

  return (
    <div>
      {/* Animated Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white">
        {/* Animated floating shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-[10%] w-20 h-20 rounded-xl bg-primary/20 animate-float" />
          <div className="absolute top-1/3 right-[15%] w-14 h-14 rounded-full bg-secondary/20 animate-float-delay" />
          <div className="absolute bottom-1/4 left-[25%] w-16 h-16 rounded-lg bg-accent/20 animate-float-slow" />
          <div className="absolute top-[60%] right-[30%] w-10 h-10 rounded-full bg-primary/15 animate-float-delay" />
          <div className="absolute top-[15%] left-[50%] w-8 h-8 rounded-md bg-secondary/15 animate-float-slow" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 relative">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs text-white/70 mb-4 backdrop-blur-sm border border-white/10 animate-fade-in">
                보드게임 동아리
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight animate-slide-up">
                <span className="bg-gradient-to-r from-white via-primary/80 to-accent bg-clip-text text-transparent">
                  미플즈
                </span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 animate-slide-up-delay">
                보드게임을 사랑하는 사람들의 모임
              </p>
            </div>
            <div className="shrink-0 animate-fade-in-slow">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-br from-primary/40 to-accent/40 rounded-3xl blur-xl opacity-60 animate-pulse-slow" />
                <img
                  src="/meeplez.jpg"
                  alt="미플즈"
                  className="relative w-44 h-44 md:w-56 md:h-56 rounded-2xl object-cover shadow-2xl ring-2 ring-white/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-cream to-transparent" />
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
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
    </div>
  );
}
