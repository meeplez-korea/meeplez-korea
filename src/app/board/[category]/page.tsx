"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCategoryBySlug } from "@/lib/categories";
import { getPosts } from "@/lib/storage";
import { Post, ReviewTag } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { POSTS_PER_PAGE, CARDS_PER_PAGE } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

export default function BoardPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const category = getCategoryBySlug(categorySlug);
  const { user, isMember, isAdmin } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [activeTag, setActiveTag] = useState<ReviewTag | "전체">("전체");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (category) {
      setDataLoading(true);
      getPosts(category.slug).then((data) => {
        if (category.isPrivate && !isAdmin && user) {
          setPosts(data.filter((p) => p.author_id === user.id));
        } else {
          setPosts(data);
        }
      }).finally(() => setDataLoading(false));
    }
  }, [categorySlug, isAdmin, user]);

  useEffect(() => {
    let filtered = activeTag === "전체" ? posts : posts.filter((p) => p.tag === activeTag);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.title.toLowerCase().includes(q) || p.author_name.toLowerCase().includes(q)
      );
    }
    const pinned = filtered.filter((p) => p.is_pinned);
    const unpinned = filtered.filter((p) => !p.is_pinned);
    setFilteredPosts([...pinned, ...unpinned]);
    setPage(1);
  }, [posts, activeTag, searchQuery]);

  if (!category) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400">존재하지 않는 게시판입니다.</p>
      </div>
    );
  }

  if (category.isPrivate && !isMember) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400">회원만 이용할 수 있는 게시판입니다.</p>
        {!user && (
          <Link href="/login" className="inline-block mt-4 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg">
            로그인하기
          </Link>
        )}
      </div>
    );
  }

  const perPage = category.hasPhotos ? CARDS_PER_PAGE : POSTS_PER_PAGE;
  const totalPages = Math.ceil(filteredPosts.length / perPage);
  const currentPosts = filteredPosts.slice((page - 1) * perPage, page * perPage);

  const tags: (ReviewTag | "전체")[] = ["전체", "보드게임", "외부활동"];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span>{category.icon}</span>
            {category.label}
          </h1>
          {category.description && (
            <p className="text-sm text-gray-400 mt-1.5">{category.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색"
              className="w-36 sm:w-44 pl-8 pr-3 py-2 text-xs bg-white dark:bg-dark-card rounded-lg shadow-card dark:shadow-card-dark border-0 focus:ring-1 focus:ring-primary/30 placeholder:text-gray-400"
            />
          </div>
          {isMember && (category.slug !== "notices" || isAdmin) && (
            <Link
              href={`/board/write?category=${category.slug}`}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark shrink-0"
            >
              글쓰기
            </Link>
          )}
        </div>
      </div>

      {/* Tag filter */}
      {category.hasTags && (
        <div className="flex gap-2 mb-6">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTag === tag
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 shadow-card dark:shadow-card-dark"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Posts */}
      {dataLoading ? null : currentPosts.length === 0 ? (
        <div className="bg-white dark:bg-dark-card rounded-xl p-16 text-center text-gray-400 shadow-card dark:shadow-card-dark">
          게시글이 없습니다.
        </div>
      ) : category.hasPhotos ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentPosts.map((post) => (
            <Link
              key={post.id}
              href={`/board/${category.slug}/${post.id}`}
              className="bg-white dark:bg-dark-card rounded-xl overflow-hidden shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-1 transition-all duration-300 group"
            >
              {post.thumbnail_url ? (
                <div className="aspect-video bg-gray-100 dark:bg-dark-border overflow-hidden">
                  <img
                    src={post.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                  <span className="text-4xl opacity-15">📸</span>
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
                <h3 className="font-semibold text-sm mt-2 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-dark-border text-[11px] text-gray-400">
                  <span className="font-medium">{post.author_name}</span>
                  <span className="tabular-nums">{formatDate(post.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-card-dark overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-border text-xs text-gray-400 dark:text-gray-500">
                <th className="py-3 px-4 text-left font-medium w-12 hidden md:table-cell">No.</th>
                <th className="py-3 px-4 text-left font-medium">제목</th>
                <th className="py-3 px-4 text-left font-medium w-20">작성자</th>
                <th className="py-3 px-4 text-left font-medium w-32 hidden md:table-cell">날짜</th>
                <th className="py-3 px-4 text-center font-medium w-16 hidden md:table-cell">조회</th>
              </tr>
            </thead>
            <tbody>
              {currentPosts.map((post, i) => (
                <tr key={post.id} className="border-t border-gray-50 dark:border-dark-border/50 hover:bg-cream/40 dark:hover:bg-dark-hover transition-colors">
                  <td className="py-3.5 px-4 text-xs text-gray-400 hidden md:table-cell tabular-nums">
                    {filteredPosts.length - ((page - 1) * perPage + i)}
                  </td>
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/board/${category.slug}/${post.id}`}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {post.is_pinned && <span className="text-[11px] text-danger font-bold mr-1">[고정]</span>}
                      {post.title}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400 font-medium">{post.author_name}</td>
                  <td className="py-3.5 px-4 text-xs text-gray-400 hidden md:table-cell tabular-nums">{formatDate(post.created_at)}</td>
                  <td className="py-3.5 px-4 text-xs text-gray-400 text-center hidden md:table-cell tabular-nums">{post.view_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 text-sm font-medium rounded-lg transition-all ${
                page === p
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white dark:bg-dark-card shadow-card dark:shadow-card-dark text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
