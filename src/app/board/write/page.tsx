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
    if (!title.trim() || !content.trim() || !user || !profile) {
      alert("모든 필수 항목을 입력해주세요.");
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{editId ? "글 수정" : "글쓰기"}</h1>
        {autoSaveStatus && (
          <span className="text-xs text-gray-400">{autoSaveStatus}</span>
        )}
      </div>

      {draftRestored && (
        <div className="flex items-center justify-between p-3.5 mb-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-600 dark:text-blue-400">
          <span>이전에 작성 중이던 글이 복원되었습니다.</span>
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
            className="text-xs underline hover:no-underline ml-3 shrink-0"
          >
            새로 작성
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1.5">게시판 *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategorySlug)}
            className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-dark-border dark:bg-dark-card rounded-xl text-sm"
          >
            {CATEGORIES.filter((cat) => cat.slug !== "notices" || isAdmin).map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tag */}
        {categoryInfo?.hasTags && (
          <div>
            <label className="block text-sm font-medium mb-1.5">말머리 *</label>
            <div className="flex gap-2">
              {(["보드게임", "외부활동"] as ReviewTag[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    tag === t
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 shadow-card dark:shadow-card-dark hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {categoryInfo?.isPrivate && (
          <div className="p-3.5 bg-cream/50 dark:bg-dark-hover rounded-xl text-sm text-gray-500 dark:text-gray-400">
            이 게시판의 글은 운영진만 확인할 수 있습니다.
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-dark-border dark:bg-dark-card rounded-xl text-sm"
            placeholder="제목을 입력하세요"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-1.5">내용 *</label>
          <RichEditor
            value={content}
            onChange={setContent}
            placeholder="내용을 입력하세요. 툴바에서 이미지 삽입, 글꼴 꾸미기가 가능합니다."
          />
        </div>

        {false && (
          <div></div>
        )}

        {/* Submit */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "업로드 중..." : editId ? "수정 완료" : "작성 완료"}
          </button>
          {!editId && (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="px-6 py-2.5 border border-primary text-primary rounded-xl hover:bg-primary/5 text-sm font-medium disabled:opacity-50"
              >
                {savingDraft ? "저장 중..." : "임시저장"}
              </button>
              <button
                type="button"
                onClick={() => setShowDraftList(!showDraftList)}
                className="px-6 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl hover:bg-gray-50 dark:hover:bg-dark-hover text-sm font-medium"
              >
                불러오기 {drafts.length > 0 && `(${drafts.length})`}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-200 dark:border-dark-border rounded-xl hover:bg-gray-50 dark:hover:bg-dark-hover text-sm font-medium"
          >
            취소
          </button>
        </div>

        {/* Draft List */}
        {showDraftList && drafts.length > 0 && (
          <div className="border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-dark-hover text-sm font-medium">
              임시저장 목록
            </div>
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className={`flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover ${
                  currentDraftId === draft.id ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleLoadDraft(draft)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-sm font-medium truncate">
                    {draft.title || "(제목 없음)"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
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
                  className="text-xs text-gray-400 hover:text-red-500 ml-3 shrink-0"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}

        {showDraftList && drafts.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-400 border border-gray-200 dark:border-dark-border rounded-xl">
            임시저장된 글이 없습니다.
          </div>
        )}
      </form>
    </div>
  );
}
