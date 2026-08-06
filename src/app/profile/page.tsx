"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getMyPosts, getMyComments } from "@/lib/storage";
import { Post, Comment } from "@/lib/types";
import { formatDateShort, truncate, stripHtml } from "@/lib/utils";
import { getCategoryBySlug } from "@/lib/categories";

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState<"posts" | "comments">("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<(Comment & { post_title?: string })[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setDataLoading(true);
      Promise.all([
        getMyPosts(user.id).then(setPosts),
        getMyComments(user.id).then(setComments),
      ]).finally(() => setDataLoading(false));
    }
  }, [user]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16" />;

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 mb-4">로그인이 필요합니다.</p>
        <Link href="/login" className="inline-block px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg">
          로그인하기
        </Link>
      </div>
    );
  }

  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Profile header — minimal, left-aligned */}
      <div className="mb-10 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold tracking-tight">{profile?.nickname}</h1>
          <span className="text-xs text-gray-400 font-medium tabular-nums">{joinDate} 가입</span>
        </div>
        <div className="flex gap-5 text-sm">
          <button
            onClick={() => setTab("posts")}
            className={`transition-colors ${tab === "posts" ? "text-gray-800 dark:text-gray-100 font-semibold" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
          >
            글 <span className="tabular-nums">{posts.length}</span>
          </button>
          <button
            onClick={() => setTab("comments")}
            className={`transition-colors ${tab === "comments" ? "text-gray-800 dark:text-gray-100 font-semibold" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
          >
            댓글 <span className="tabular-nums">{comments.length}</span>
          </button>
        </div>
        <div className="h-px bg-gray-200 dark:bg-dark-border mt-3" />
      </div>

      {/* Content */}
      {dataLoading ? (
        <div className="py-12" />
      ) : tab === "posts" ? (
        <div className="space-y-2 animate-fade-in">
          {posts.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-400 mb-3">아직 작성한 글이 없습니다.</p>
              <Link href="/board/write" className="text-sm text-primary font-medium hover:text-primary-dark">
                첫 글 작성하기 &rarr;
              </Link>
            </div>
          ) : (
            posts.map((post) => {
              const cat = getCategoryBySlug(post.category);
              return (
                <Link
                  key={post.id}
                  href={`/board/${post.category}/${post.id}`}
                  className="block bg-white dark:bg-dark-card rounded-xl px-5 py-4 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-px transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{post.title}</h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{truncate(stripHtml(post.content), 80)}</p>
                    </div>
                    {cat && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-dark-hover text-gray-500 dark:text-gray-400 font-medium shrink-0 mt-0.5">
                        {cat.icon} {cat.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2.5 text-[11px] text-gray-400">
                    <span className="tabular-nums">{formatDateShort(post.created_at)}</span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span className="tabular-nums">조회 {post.view_count}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-2 animate-fade-in">
          {comments.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-400">아직 작성한 댓글이 없습니다.</p>
            </div>
          ) : (
            comments.map((comment) => (
              <Link
                key={comment.id}
                href={`/board/chat/${comment.post_id}`}
                className="block bg-white dark:bg-dark-card rounded-xl px-5 py-4 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-px transition-all duration-200 group"
              >
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 group-hover:text-primary transition-colors">
                  {comment.content}
                </p>
                <div className="flex items-center gap-2 mt-2.5 text-[11px] text-gray-400">
                  {comment.post_title && (
                    <>
                      <span className="truncate max-w-[200px]">{comment.post_title}</span>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                    </>
                  )}
                  <span className="tabular-nums shrink-0">{formatDateShort(comment.created_at)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
