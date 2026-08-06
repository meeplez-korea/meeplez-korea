"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCategoryBySlug } from "@/lib/categories";
import { getPost, incrementViewCount, deletePost, updatePost, getComments, addComment, deleteComment, createNotification, toggleLike, getLikeStatus } from "@/lib/storage";
import { Post, Comment } from "@/lib/types";
import { formatDate, autoLinkUrls, addLazyLoading, sanitizeHtml } from "@/lib/utils";
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
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);
    Promise.all([
      getPost(postId).then((p) => {
        if (p && !cancelled) {
          incrementViewCount(postId).catch(() => {});
          setPost({ ...p, view_count: p.view_count + 1 });
        }
      }),
      getComments(postId).then((c) => { if (!cancelled) setComments(c); }),
    ]).finally(() => { if (!cancelled) setDataLoading(false); });
    return () => { cancelled = true; };
  }, [postId]);

  useEffect(() => {
    getLikeStatus(postId, user?.id).then(({ count, liked: l }) => {
      setLikeCount(count);
      setLiked(l);
    }).catch(() => {});
  }, [postId, user?.id]);

  const handleLike = async () => {
    if (!user) return;
    setLikeAnimating(true);
    const nowLiked = await toggleLike(postId, user.id);
    setLiked(nowLiked);
    setLikeCount((prev) => prev + (nowLiked ? 1 : -1));
    setTimeout(() => setLikeAnimating(false), 300);
  };

  const handleDelete = async () => {
    if (!post || deleting) return;
    setDeleting(true);
    try {
      const result = await deletePost(post.id);
      if (result.error) {
        alert("삭제에 실패했습니다. 다시 시도해주세요.");
        setDeleting(false);
        return;
      }
      router.push(`/board/${categorySlug}`);
    } catch {
      alert("삭제에 실패했습니다. 다시 시도해주세요.");
      setDeleting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !user || !profile || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      const result = await addComment(postId, user.id, profile.nickname, commentContent);
      if (result.error) {
        alert("댓글 등록에 실패했습니다. 다시 시도해주세요.");
      } else {
        setCommentContent("");
        // 글 작성자에게 알림 (본인 댓글 제외)
        if (post && post.author_id !== user.id) {
          createNotification(
            post.author_id,
            "comment",
            "새 댓글",
            `${profile.nickname}님이 "${post.title}"에 댓글을 남겼습니다.`,
            `/board/${categorySlug}/${postId}`
          ).catch(() => {});
        }
        const updated = await getComments(postId);
        setComments(updated);
      }
    } catch {
      alert("댓글 등록에 실패했습니다. 다시 시도해주세요.");
    }
    setCommentSubmitting(false);
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !user || !profile || !replyTo || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      const result = await addComment(postId, user.id, profile.nickname, replyContent, replyTo.id);
      if (result.error) {
        alert("답글 등록에 실패했습니다. 다시 시도해주세요.");
      } else {
        setReplyContent("");
        setReplyTo(null);
        if (replyTo.author_id !== user.id) {
          createNotification(
            replyTo.author_id,
            "reply",
            "새 답글",
            `${profile.nickname}님이 회원님의 댓글에 답글을 남겼습니다.`,
            `/board/${categorySlug}/${postId}`
          ).catch(() => {});
        }
        const updated = await getComments(postId);
        setComments(updated);
      }
    } catch {
      alert("답글 등록에 실패했습니다. 다시 시도해주세요.");
    }
    setCommentSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const result = await deleteComment(commentId);
      if (result.error) {
        alert("댓글 삭제에 실패했습니다.");
        return;
      }
      const updated = await getComments(postId);
      setComments(updated);
    } catch {
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  const topComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  if (dataLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-16" />;
  }

  if (!post || !category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400">
        게시글을 찾을 수 없습니다.
      </div>
    );
  }

  const isAuthor = user?.id === post.author_id;
  const canEdit = isAuthor || isAdmin;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-primary">홈</Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <Link href={`/board/${categorySlug}`} className="hover:text-primary">{category.label}</Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{post.title}</span>
      </nav>

      {/* Non-member restriction */}
      {!isMember && categorySlug !== "notices" && (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-card dark:shadow-card-dark p-10 text-center">
          <div className="p-6 bg-cream/50 dark:bg-dark-hover rounded-xl">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">회원만 전체 내용을 볼 수 있습니다.</p>
            {!user ? (
              <Link href="/login" className="inline-block px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg">
                로그인하기
              </Link>
            ) : (
              <p className="text-xs text-gray-400">관리자 승인 후 열람이 가능합니다.</p>
            )}
          </div>
        </div>
      )}

      {/* Post */}
      {(isMember || categorySlug === "notices") && (
      <article className="bg-white dark:bg-dark-card rounded-2xl shadow-card dark:shadow-card-dark overflow-hidden">
        <div className="p-6 pb-5 border-b border-gray-100 dark:border-dark-border">
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
          <h1 className="text-xl font-bold tracking-tight mt-2 mb-3">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="font-medium text-gray-600 dark:text-gray-300">{post.author_name}</span>
            <span className="w-px h-3 bg-gray-200 dark:bg-dark-border" />
            <span className="tabular-nums">{formatDate(post.created_at)}</span>
            <span className="w-px h-3 bg-gray-200 dark:bg-dark-border" />
            <span className="tabular-nums">조회 {post.view_count}</span>
          </div>
        </div>

        <div className="p-6">
          <div
            className="post-content text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(addLazyLoading(autoLinkUrls(post.content))) }}
          />
        </div>

        <div className="px-6 pb-4 flex items-center gap-4 border-t border-gray-100 dark:border-dark-border pt-4">
          <button
            onClick={handleLike}
            disabled={!user}
            className="flex items-center gap-1.5 group disabled:opacity-40 disabled:cursor-default"
            title={user ? (liked ? "좋아요 취소" : "좋아요") : "로그인 후 이용 가능"}
          >
            <svg
              className={`w-5 h-5 transition-all duration-200 ${liked ? "text-red-500 fill-red-500" : "text-gray-400 group-hover:text-red-400"} ${likeAnimating ? "scale-125" : "scale-100"}`}
              viewBox="0 0 24 24"
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <span className={`text-sm tabular-nums ${liked ? "text-red-500 font-semibold" : "text-gray-400"}`}>
              {likeCount > 0 ? likeCount : ""}
            </span>
          </button>
        </div>

        {canEdit && (
          <div className="px-6 pb-6 flex gap-2 flex-wrap">
            <Link
              href={`/board/write?category=${categorySlug}&edit=${post.id}`}
              className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover"
            >
              수정
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm font-medium border border-danger/20 text-danger rounded-lg hover:bg-danger/5"
            >
              삭제
            </button>
            {isAdmin && (
              <button
                onClick={async () => {
                  await updatePost(post.id, { is_pinned: !post.is_pinned });
                  setPost({ ...post, is_pinned: !post.is_pinned });
                }}
                className={`px-4 py-2 text-sm font-medium border rounded-lg ${
                  post.is_pinned
                    ? "border-danger/20 text-danger hover:bg-danger/5"
                    : "border-primary/20 text-primary hover:bg-primary/5"
                }`}
              >
                {post.is_pinned ? "고정 해제" : "상단 고정"}
              </button>
            )}
          </div>
        )}
      </article>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl p-6 w-full max-w-sm shadow-card-hover dark:shadow-card-dark-hover animate-slide-up">
            <h3 className="font-bold mb-2">게시글 삭제</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium bg-danger text-white rounded-lg hover:brightness-95 disabled:opacity-50"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      {(isMember || categorySlug === "notices") && (
      <section className="mt-6 bg-white dark:bg-dark-card rounded-2xl shadow-card dark:shadow-card-dark p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          댓글
          <span className="text-sm font-medium text-gray-400 tabular-nums">{comments.length}</span>
        </h3>

        {topComments.length > 0 && (
          <div className="space-y-2 mb-6">
            {topComments.map((comment) => {
              const replies = getReplies(comment.id);
              return (
                <div key={comment.id}>
                  <div className="flex justify-between items-start p-3.5 bg-cream/30 dark:bg-dark-hover rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{comment.author_name}</span>
                        <span className="text-[11px] text-gray-400 tabular-nums">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{comment.content}</p>
                      {isMember && (
                        <button
                          onClick={() => { setReplyTo(replyTo?.id === comment.id ? null : comment); setReplyContent(""); }}
                          className="text-xs text-gray-400 hover:text-primary mt-1.5"
                        >
                          답글
                        </button>
                      )}
                    </div>
                    {(user?.id === comment.author_id || isAdmin) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-gray-400 hover:text-danger shrink-0 ml-3"
                      >
                        삭제
                      </button>
                    )}
                  </div>

                  {/* Reply form */}
                  {replyTo?.id === comment.id && (
                    <form onSubmit={handleAddReply} className="ml-6 mt-2 flex gap-2">
                      <textarea
                        autoFocus
                        placeholder={`${comment.author_name}님에게 답글...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-dark-border dark:bg-dark-card rounded-lg text-sm resize-none h-16"
                      />
                      <div className="flex flex-col gap-1 self-end">
                        <button
                          type="submit"
                          disabled={commentSubmitting || !replyContent.trim()}
                          className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50"
                        >
                          {commentSubmitting ? "등록 중..." : "등록"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyTo(null)}
                          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          취소
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Replies */}
                  {replies.length > 0 && (
                    <div className="ml-6 mt-1.5 space-y-1.5">
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex justify-between items-start p-3 bg-cream/20 dark:bg-dark-hover/60 rounded-lg border-l-2 border-gray-200 dark:border-dark-border">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold">{reply.author_name}</span>
                              <span className="text-[11px] text-gray-400 tabular-nums">{formatDate(reply.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{reply.content}</p>
                          </div>
                          {(user?.id === reply.author_id || isAdmin) && (
                            <button
                              onClick={() => handleDeleteComment(reply.id)}
                              className="text-xs text-gray-400 hover:text-danger shrink-0 ml-3"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isMember ? (
          <form onSubmit={handleAddComment} className="flex gap-2">
            <textarea
              placeholder="댓글을 작성하세요..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300)}
              className="flex-1 px-3.5 py-2.5 border border-gray-200 dark:border-dark-border dark:bg-dark-card rounded-xl text-sm resize-none h-20"
            />
            <button
              type="submit"
              disabled={commentSubmitting || !commentContent.trim()}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark self-end disabled:opacity-50"
            >
              {commentSubmitting ? "등록 중..." : "등록"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-400">
            {user ? "관리자 승인 후 댓글 작성이 가능합니다." : "로그인 후 댓글을 작성할 수 있습니다."}
          </p>
        )}
      </section>
      )}

      <div className="mt-6">
        <Link
          href={`/board/${categorySlug}`}
          className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover inline-block"
        >
          목록으로
        </Link>
      </div>
    </div>
  );
}
