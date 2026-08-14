"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, getCategoryBySlug } from "@/lib/categories";
import { createPost, getPost, updatePost, notifyAdmins, getDrafts, saveDraft, deleteDraft } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { generateId } from "@/lib/utils";
import { CategorySlug, ReviewTag, Draft } from "@/lib/types";
import { MAX_IMAGES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import RichEditor from "@/components/ui/RichEditor";

export default function WritePage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-400">로딩 중...</div>}>
      <WriteForm />
    </Suspense>
  );
}

function WriteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const initialCategory = searchParams.get("category") || "chat";
  const { user, profile, isMember, isAdmin } = useAuth();

  const DRAFT_KEY = "meeplez-write-draft";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CategorySlug>(initialCategory as CategorySlug);
  const [tag, setTag] = useState<ReviewTag>("보드게임");
  const [submitting, setSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftLoaded = useRef(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [showDraftList, setShowDraftList] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const categoryInfo = getCategoryBySlug(category);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  }, []);

  // 임시저장 복원 (새 글 작성 시에만)
  useEffect(() => {
    if (editId || draftLoaded.current) return;
    draftLoaded.current = true;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.title || draft.content) {
          setTitle(draft.title || "");
          setContent(draft.content || "");
          setCategory(draft.category || initialCategory as CategorySlug);
          if (draft.tag) setTag(draft.tag as ReviewTag);
          setDraftRestored(true);
        }
      }
    } catch {}
  }, [editId, initialCategory]);

  // 자동저장 (새 글 작성 시에만, 3초 디바운스)
  useEffect(() => {
    if (editId || !draftLoaded.current) return;
    if (!title.trim() && !content.trim()) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, category, tag }));
        setAutoSaveStatus("임시저장됨");
        setTimeout(() => setAutoSaveStatus(null), 2000);
      } catch {}
    }, 3000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [title, content, category, tag, editId]);

  useEffect(() => {
    if (editId) {
      getPost(editId).then((post) => {
        if (post) {
          setTitle(post.title);
          setContent(post.content);
          setCategory(post.category);
          if (post.tag) setTag(post.tag as ReviewTag);
        }
      });
    }
  }, [editId]);

  // 임시저장 목록 불러오기
  useEffect(() => {
    if (user && !editId) {
      getDrafts(user.id).then(setDrafts);
    }
  }, [user, editId]);

  const handleSaveDraft = async () => {
    if (!user || (!title.trim() && !content.trim())) {
      alert("제목이나 내용을 입력해주세요.");
      return;
    }
    setSavingDraft(true);
    try {
      const result = await saveDraft({
        user_id: user.id,
        title,
        content,
        category,
        tag: categoryInfo?.hasTags ? tag : undefined,
      }, currentDraftId || undefined);
      if (result.data) {
        setCurrentDraftId(result.data.id);
        setDrafts(await getDrafts(user.id));
        setAutoSaveStatus("임시저장 완료");
        setTimeout(() => setAutoSaveStatus(null), 2000);
      }
    } catch {
      alert("임시저장에 실패했습니다.");
    }
    setSavingDraft(false);
  };

  const handleLoadDraft = (draft: Draft) => {
    setTitle(draft.title);
    setContent(draft.content);
    setCategory(draft.category);
    if (draft.tag) setTag(draft.tag as ReviewTag);
    setCurrentDraftId(draft.id);
    setShowDraftList(false);
    setDraftRestored(false);
  };

  const handleDeleteDraft = async (draftId: string) => {
    await deleteDraft(draftId);
    if (user) setDrafts(await getDrafts(user.id));
    if (currentDraftId === draftId) setCurrentDraftId(null);
  };

  if (!isMember) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-400">
        {user ? "관리자 승인 후 글쓰기가 가능합니다." : "로그인이 필요합니다."}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError("제목을 입력해주세요");
      titleRef.current?.focus();
      return;
    }
    if (!content.trim() || !user || !profile) {
      setValidationError("내용을 입력해주세요");
      return;
    }
    if (submitting) return;
    setSubmitting(true);

    try {
      const { data: sessionData } = await supabase.auth.refreshSession();
      if (!sessionData.session) {
        alert("로그인이 만료되었습니다. 다시 로그인해주세요.\n작성 중인 글은 복사해두세요.");
        setSubmitting(false);
        return;
      }

      let processedContent = content;
      const parser = new DOMParser();
      const doc = parser.parseFromString(processedContent, "text/html");
      const images = doc.querySelectorAll("img");

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const src = img.getAttribute("src") || "";
        if (src.startsWith("data:")) {
          try {
            const res = await fetch(src);
            const blob = await res.blob();
            const fileName = `${Date.now()}-${generateId()}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from("post-images")
              .upload(`uploads/${fileName}`, blob, { contentType: "image/jpeg" });
            if (!uploadError) {
              const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(`uploads/${fileName}`);
              img.setAttribute("src", urlData.publicUrl);
            }
          } catch (err) {
            console.error("Image upload failed:", err);
          }
        }
      }
      processedContent = doc.body.innerHTML;

      const imgMatch = processedContent.match(/<img[^>]+src="([^"]+)"/);
      const thumbnailUrl = imgMatch ? imgMatch[1] : undefined;

      let result;
      if (editId) {
        result = await updatePost(editId, {
          title,
          content: processedContent,
          category,
          tag: categoryInfo?.hasTags ? tag : undefined,
          thumbnail_url: thumbnailUrl,
          is_private: categoryInfo?.isPrivate || false,
        });
      } else {
        result = await createPost({
          title,
          content: processedContent,
          category,
          author_id: user.id,
          author_name: profile.nickname,
          tag: categoryInfo?.hasTags ? tag : undefined,
          thumbnail_url: thumbnailUrl,
          is_private: categoryInfo?.isPrivate || false,
        });
      }

      if (result?.error) {
        alert("저장에 실패했습니다. 다시 시도해주세요.\n" + (result.error.message || ""));
        setSubmitting(false);
        return;
      }

      // 새 글 작성 시 관리자에게 알림
      if (!editId && result?.data) {
        const catLabel = categoryInfo?.label || category;
        notifyAdmins(
          "new_post",
          "새 게시글",
          `${profile.nickname}님이 [${catLabel}]에 "${title}" 글을 작성했습니다.`,
          `/board/${category}/${result.data.id}`,
          user.id
        ).catch(() => {});
      }

      clearDraft();
      if (currentDraftId) deleteDraft(currentDraftId).catch(() => {});
      router.push(`/board/${category}`);
    } catch (err) {
      alert("오류가 발생했습니다. 다시 시도해주세요.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover"
            aria-label="뒤로가기"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.5 15L7.5 10L12.5 5" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold tracking-tight">{editId ? "글 수정" : "글쓰기"}</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-save indicator */}
          {autoSaveStatus && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              {autoSaveStatus}
            </span>
          )}
          {/* Draft controls (new post only) */}
          {!editId && (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary rounded-lg hover:bg-primary/5 disabled:opacity-40"
                title="임시저장"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                {savingDraft ? "저장 중" : "저장"}
              </button>
              <div className="w-px h-4 bg-gray-200 dark:bg-dark-border" />
              <button
                type="button"
                onClick={() => setShowDraftList(!showDraftList)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  showDraftList
                    ? "text-primary bg-primary/10"
                    : "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary/5"
                }`}
                title="임시저장 불러오기"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                불러오기
                {drafts.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 text-[10px] leading-none font-semibold bg-primary/15 text-primary rounded-full">
                    {drafts.length}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Draft restored banner */}
      {draftRestored && (
        <div className="flex items-center gap-3 px-4 py-3 mb-6 bg-primary/5 dark:bg-primary/10 border border-primary/15 rounded-xl">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 105.64-11.36L1 10" />
          </svg>
          <span className="text-sm text-gray-600 dark:text-gray-300">이전에 작성 중이던 글이 복원되었습니다</span>
          <button
            type="button"
            onClick={() => {
              clearDraft();
              setTitle("");
              setContent("");
              setCategory(initialCategory as CategorySlug);
              setTag("보드게임");
              setDraftRestored(false);
            }}
            className="ml-auto text-xs font-medium text-primary hover:text-primary-dark shrink-0"
          >
            새로 작성
          </button>
        </div>
      )}

      {/* Draft slide-over panel */}
      {showDraftList && (
        <>
          <div
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 animate-fade-in"
            onClick={() => setShowDraftList(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white dark:bg-dark-card z-50 shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dark-border">
              <h2 className="text-sm font-semibold">임시저장 목록</h2>
              <button
                type="button"
                onClick={() => setShowDraftList(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {drafts.length > 0 ? (
                <div className="py-2">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className={`group relative px-5 py-3.5 transition-colors ${
                        currentDraftId === draft.id
                          ? "bg-primary/5 dark:bg-primary/10"
                          : "hover:bg-gray-50 dark:hover:bg-dark-hover"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleLoadDraft(draft)}
                        className="w-full text-left"
                      >
                        <p className={`text-sm truncate ${
                          currentDraftId === draft.id ? "font-semibold text-primary" : "font-medium"
                        }`}>
                          {draft.title || "(제목 없음)"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(draft.updated_at).toLocaleDateString("ko-KR", {
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-300 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/5"
                        title="삭제"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-40">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <p className="text-sm">임시저장된 글이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category & Tag row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">게시판</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategorySlug)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl text-sm"
            >
              {CATEGORIES.filter((cat) => cat.slug !== "notices" || isAdmin).map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
          {categoryInfo?.hasTags && (
            <div className="shrink-0">
              <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wider">말머리</label>
              <div className="flex gap-1.5 h-[42px]">
                {(["보드게임", "외부활동"] as ReviewTag[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`px-3.5 text-sm font-medium rounded-xl transition-colors ${
                      tag === t
                        ? "bg-primary text-white shadow-sm"
                        : "bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:border-primary/30 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {categoryInfo?.isPrivate && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-cream/50 dark:bg-dark-hover rounded-xl text-sm text-gray-500 dark:text-gray-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            이 게시판의 글은 운영진만 확인할 수 있습니다
          </div>
        )}

        {/* Title */}
        <div>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (validationError) setValidationError(null);
            }}
            className={`w-full px-4 py-3 bg-white dark:bg-dark-card border rounded-xl text-base font-medium placeholder:text-gray-300 dark:placeholder:text-gray-600 ${
              validationError && !title.trim()
                ? "border-danger/50 shadow-[0_0_0_3px_rgba(196,92,92,0.08)]"
                : "border-gray-200 dark:border-dark-border"
            }`}
            placeholder="제목을 입력하세요"
          />
          {validationError && (
            <p className="mt-1.5 text-xs text-danger animate-fade-in">{validationError}</p>
          )}
        </div>

        {/* Content */}
        <div>
          <RichEditor
            value={content}
            onChange={(val) => {
              setContent(val);
              if (validationError) setValidationError(null);
            }}
            placeholder="내용을 입력하세요. 툴바에서 이미지 삽입, 글꼴 꾸미기가 가능합니다."
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end pt-3 border-t border-gray-100 dark:border-dark-border">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark text-sm font-semibold disabled:opacity-50 shadow-sm hover:shadow-md"
          >
            {submitting ? "업로드 중..." : editId ? "수정 완료" : "작성 완료"}
          </button>
        </div>
      </form>
    </div>
  );
}
