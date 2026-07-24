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

  useEffect(() => {
    if (category) {
      getPosts(category.slug).then(setPosts);
    }
  }, [categorySlug]);

  useEffect(() => {
    let filtered = activeTag === "전체" ? posts : posts.filter((p) => p.tag === activeTag);
    const pinned = filtered.filter((p) => p.is_pinned);
    const unpinned = filtered.filter((p) => !p.is_pinned);
    setFilteredPosts([...pinned, ...unpinned]);
    setPage(1);
  }, [posts, activeTag]);

  if (!category) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">존재하지 않는 게시판입니다.</p>
      </div>
    );
  }

  // 건의방은 관리자만
  if (category.isPrivate && !isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">관리자만 열람할 수 있는 게시판입니다.</p>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>{category.icon}</span>
            {category.label}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{category.description}</p>
        </div>
        {isMember && (
          <Link
            href={`/board/write?category=${category.slug}`}
            className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
          >
            글쓰기
          </Link>
        )}
      </div>

      {/* Tag filter for reviews */}
      {category.hasTags && (
        <div className="flex gap-2 mb-6">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                activeTag === tag
                  ? "bg-primary text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Posts */}
      {currentPosts.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-100">
          게시글이 없습니다.
        </div>
      ) : category.hasPhotos ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentPosts.map((post) => (
            <Link
              key={post.id}
              href={`/board/${category.slug}/${post.id}`}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border border-gray-100"
            >
              {post.thumbnail_url ? (
                <div className="aspect-video bg-gray-100">
                  <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <span className="text-4xl opacity-30">📸</span>
                </div>
              )}
              <div className="p-4">
                {post.tag && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      post.tag === "보드게임"
                        ? "bg-tag-board/20 text-tag-board"
                        : post.tag === "외부활동"
                        ? "bg-tag-outdoor/20 text-tag-outdoor"
                        : "bg-tag-all/20 text-tag-all"
                    }`}
                  >
                    {post.tag}
                  </span>
                )}
                <h3 className="font-semibold text-sm mt-2 line-clamp-2">{post.title}</h3>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                  <span>{post.author_name}</span>
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-cream/50">
              <tr className="text-xs text-gray-500">
                <th className="py-3 px-4 text-left font-medium w-12">No.</th>
                <th className="py-3 px-4 text-left font-medium">제목</th>
                <th className="py-3 px-4 text-left font-medium w-20">작성자</th>
                <th className="py-3 px-4 text-left font-medium w-32">날짜</th>
                <th className="py-3 px-4 text-center font-medium w-16">조회</th>
              </tr>
            </thead>
            <tbody>
              {currentPosts.map((post, i) => (
                <tr key={post.id} className="border-t border-gray-50 hover:bg-cream/30 transition-colors">
                  <td className="py-3 px-4 text-xs text-gray-400">
                    {filteredPosts.length - ((page - 1) * perPage + i)}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/board/${category.slug}/${post.id}`}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {post.is_pinned && <span className="text-xs text-danger font-bold mr-1">[고정]</span>}
                      {post.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">{post.author_name}</td>
                  <td className="py-3 px-4 text-xs text-gray-400">{formatDate(post.created_at)}</td>
                  <td className="py-3 px-4 text-xs text-gray-400 text-center">{post.view_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                page === p
                  ? "bg-primary text-white"
                  : "bg-white border border-gray-200 hover:border-primary text-gray-600"
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
