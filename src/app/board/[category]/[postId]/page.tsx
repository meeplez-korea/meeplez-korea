"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCategoryBySlug } from "@/lib/categories";
import { getPost, incrementViewCount, deletePost, getComments, addComment, deleteComment } from "@/lib/storage";
import { Post, Comment } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.category as string;
  const postId = params.postId as string;
  const category = getCategoryBySlug(categorySlug);
  const { user, profile, isAdmin, isMember } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    getPost(postId).then((p) => {
      if (p) {
        incrementViewCount(postId);
        setPost({ ...p, view_count: p.view_count + 1 });
      }
    });
    getComments(postId).then(setComments);
  }, [postId]);

  const handleDelete = async () => {
    if (!post) return;
    await deletePost(post.id);
    router.push(`/board/${categorySlug}`);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !user || !profile) return;
    await addComment(postId, user.id, profile.nickname, commentContent);
    setCommentContent("");
    getComments(postId).then(setComments);
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
    getComments(postId).then(setComments);
  };

  if (!post || !category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">
        게시글을 찾을 수 없습니다.
      </div>
    );
  }

  const isAuthor = user?.id === post.author_id;
  const canEdit = isAuthor || isAdmin;

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
        <div className="p-6 border-b border-gray-100">
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
          <h1 className="text-xl font-bold mt-2 mb-3">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="font-medium text-gray-600">{post.author_name}</span>
            <span>{formatDate(post.created_at)}</span>
            <span>조회 {post.view_count}</span>
          </div>
        </div>

        <div className="p-6">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</div>

          {post.images && post.images.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {post.images.map((img, i) => (
                <img key={i} src={img} alt={`첨부 이미지 ${i + 1}`} className="rounded-lg w-full object-cover" />
              ))}
            </div>
          )}
        </div>

        {canEdit && (
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
        )}
      </article>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-bold mb-3">게시글 삭제</h3>
            <p className="text-sm text-gray-500 mb-4">정말 삭제하시겠습니까?</p>
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
        <h3 className="font-bold mb-4">댓글 {comments.length}개</h3>

        {comments.length > 0 && (
          <div className="space-y-3 mb-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex justify-between items-start p-3 bg-cream/30 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{comment.author_name}</span>
                    <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{comment.content}</p>
                </div>
                {(user?.id === comment.author_id || isAdmin) && (
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

        {isMember ? (
          <form onSubmit={handleAddComment} className="flex gap-2">
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
          </form>
        ) : (
          <p className="text-sm text-gray-400">
            {user ? "관리자 승인 후 댓글 작성이 가능합니다." : "로그인 후 댓글을 작성할 수 있습니다."}
          </p>
        )}
      </section>

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
