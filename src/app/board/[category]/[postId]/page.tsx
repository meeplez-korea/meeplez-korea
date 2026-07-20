"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCategoryBySlug } from "@/lib/categories";
import { getPost, incrementViewCount, deletePost, addComment, deleteComment, isAdmin } from "@/lib/storage";
import { Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { AUTHOR_KEY } from "@/lib/constants";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.category as string;
  const postId = params.postId as string;
  const category = getCategoryBySlug(categorySlug);

  const [post, setPost] = useState<Post | null>(null);
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    const p = getPost(postId);
    if (p) {
      incrementViewCount(postId);
      setPost({ ...p, viewCount: p.viewCount + 1 });
    }
    const savedAuthor = localStorage.getItem(AUTHOR_KEY);
    if (savedAuthor) setCommentAuthor(savedAuthor);
  }, [postId]);

  const handleDelete = () => {
    if (!post) return;
    if (deletePassword === post.password || isAdmin()) {
      deletePost(post.id);
      router.push(`/board/${categorySlug}`);
    } else {
      alert("비밀번호가 일치하지 않습니다.");
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentAuthor.trim() || !commentContent.trim()) return;
    localStorage.setItem(AUTHOR_KEY, commentAuthor);
    addComment(postId, commentAuthor, commentContent);
    setCommentContent("");
    setPost(getPost(postId));
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(postId, commentId);
    setPost(getPost(postId));
  };

  if (!post || !category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">
        게시글을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-primary">홈</Link>
        <span>/</span>
        <Link href={`/board/${categorySlug}`} className="hover:text-primary">{category.label}</Link>
        <span>/</span>
        <span className="text-gray-600 truncate">{post.title}</span>
      </div>

      {/* Post */}
      <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Post header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
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
          </div>
          <h1 className="text-xl font-bold mb-3">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="font-medium text-gray-600">{post.author}</span>
            <span>{formatDate(post.createdAt)}</span>
            <span>조회 {post.viewCount}</span>
          </div>
        </div>

        {/* Post content */}
        <div className="p-6">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</div>

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {post.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`첨부 이미지 ${i + 1}`}
                  className="rounded-lg w-full object-cover"
                />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-2">
          <Link
            href={`/board/write?category=${categorySlug}&edit=${post.id}`}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            수정
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-sm border border-danger/30 text-danger rounded-lg hover:bg-danger/5 transition-colors"
          >
            삭제
          </button>
        </div>
      </article>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-bold mb-3">게시글 삭제</h3>
            <p className="text-sm text-gray-500 mb-4">비밀번호를 입력하세요.</p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4"
              placeholder="비밀번호"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-danger text-white rounded-lg hover:bg-danger/90"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      <section className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold mb-4">댓글 {post.comments.length}개</h3>

        {post.comments.length > 0 && (
          <div className="space-y-3 mb-6">
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex justify-between items-start p-3 bg-cream/30 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{comment.author}</span>
                    <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{comment.content}</p>
                </div>
                {isAdmin() && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-xs text-gray-400 hover:text-danger"
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add comment form */}
        <form onSubmit={handleAddComment} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="닉네임"
            value={commentAuthor}
            onChange={(e) => setCommentAuthor(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-40"
          />
          <div className="flex gap-2">
            <textarea
              placeholder="댓글을 작성하세요..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-20"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors self-end"
            >
              등록
            </button>
          </div>
        </form>
      </section>

      {/* Back button */}
      <div className="mt-6">
        <Link
          href={`/board/${categorySlug}`}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors inline-block"
        >
          목록으로
        </Link>
      </div>
    </div>
  );
}
