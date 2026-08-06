"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getMyPosts, getMyComments } from "@/lib/storage";
import { Post, Comment } from "@/lib/types";
import { formatDate, truncate, stripHtml } from "@/lib/utils";
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

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-16" />;

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 mb-4">로그인이 필요합니다.</p>
        <Link href="/login" className="inline-block px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg">
          로그인하기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-card dark:shadow-card-dark p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
            {profile?.nickname?.charAt(0) || "?"}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{profile?.nickname}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              가입일: {profile?.created_at ? formatDate(profile.created_at) : "-"}
            </p>
          </div>
        </div>
        <div className="flex gap-6 mt-5 pt-4 border-t border-gray-100 dark:border-dark-border">
          <div className="text-center">
            <p className="text-lg font-bold tabular-nums">{posts.length}</p>
            <p className="text-xs text-gray-400">작성 글</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold tabular-nums">{comments.length}</p>
            <p className="text-xs text-gray-400">작성 댓글</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-dark-card rounded-xl p-1 shadow-card dark:shadow-card-dark">
        <button
          onClick={() => setTab("posts")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            tab === "posts" ? "bg-primary text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:bg-cream/50 dark:hover:bg-dark-hover"
          }`}
        >
          내 글 ({posts.length})
        </button>
        <button
          onClick={() => setTab("comments")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            tab === "comments" ? "bg-primary text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:bg-cream/50 dark:hover:bg-dark-hover"
          }`}
        >
          내 댓글 ({comments.length})
        </button>
      </div>

      {dataLoading ? (
        <div className="py-12" />
      ) : tab === "posts" ? (
        <div className="space-y-2">
          {posts.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">작성한 글이 없습니다.</p>
          ) : (
            posts.map((post) => {
              const cat = getCategoryBySlug(post.category);
              return (
                <Link
                  key={post.id}
                  href={`/board/${post.category}/${post.id}`}
                  className="block bg-white dark:bg-dark-card rounded-xl px-5 py-4 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-px transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {cat && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-dark-hover text-gray-500 dark:text-gray-400 font-medium">
                        {cat.icon} {cat.label}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{post.title}</h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{truncate(stripHtml(post.content), 80)}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                    <span className="tabular-nums">{formatDate(post.created_at)}</span>
                    <span>·</span>
                    <span className="tabular-nums">조회 {post.view_count}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">작성한 댓글이 없습니다.</p>
          ) : (
            comments.map((comment) => (
              <Link
                key={comment.id}
                href={`/board/chat/${comment.post_id}`}
                className="block bg-white dark:bg-dark-card rounded-xl px-5 py-4 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-px transition-all duration-200 group"
              >
                {comment.post_title && (
                  <p className="text-[11px] text-gray-400 mb-1 font-medium">
                    원글: {truncate(comment.post_title, 40)}
                  </p>
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 group-hover:text-primary transition-colors">
                  {comment.content}
                </p>
                <p className="text-[11px] text-gray-400 mt-2 tabular-nums">{formatDate(comment.created_at)}</p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
