"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, getCategoryBySlug } from "@/lib/categories";
import { createPost, getPost, updatePost } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { generateId } from "@/lib/utils";
import { CategorySlug, ReviewTag } from "@/lib/types";
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

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CategorySlug>(initialCategory as CategorySlug);
  const [tag, setTag] = useState<ReviewTag>("보드게임");

  const categoryInfo = getCategoryBySlug(category);

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

  if (!isMember) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-400">
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

    // 세션 갱신
    const { data: sessionData } = await supabase.auth.refreshSession();
    if (!sessionData.session) {
      alert("로그인이 만료되었습니다. 다시 로그인해주세요.\n작성 중인 글은 복사해두세요.");
      return;
    }

    // base64 이미지를 Storage로 업로드 후 URL로 교체
    let processedContent = content;
    const base64Matches = processedContent.match(/src="(data:image\/[^"]+)"/g);
    if (base64Matches) {
      for (const match of base64Matches) {
        const base64 = match.replace('src="', '').replace('"', '');
        const res = await fetch(base64);
        const blob = await res.blob();
        const fileName = `${Date.now()}-${generateId()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(`uploads/${fileName}`, blob, { contentType: "image/jpeg" });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(`uploads/${fileName}`);
          processedContent = processedContent.replace(base64, urlData.publicUrl);
        }
      }
    }

    // 첫 번째 이미지를 썸네일로 추출
    const imgMatch = processedContent.match(/<img[^>]+src="([^"]+)"/);
    const thumbnailUrl = imgMatch ? imgMatch[1] : undefined;

    const postData = {
      title,
      content: processedContent,
      category,
      author_id: user.id,
      author_name: profile.nickname,
      tag: categoryInfo?.hasTags ? tag : undefined,
      thumbnail_url: thumbnailUrl,
      is_private: categoryInfo?.isPrivate || false,
    };

    let result;
    if (editId) {
      result = await updatePost(editId, postData);
    } else {
      result = await createPost(postData);
    }

    if (result?.error) {
      alert("저장에 실패했습니다. 다시 시도해주세요.\n" + (result.error.message || ""));
      return;
    }

    router.push(`/board/${category}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{editId ? "글 수정" : "글쓰기"}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">게시판 *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategorySlug)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border dark:bg-dark-card rounded-lg text-sm"
          >
            {CATEGORIES.filter((cat) => cat.slug !== "notices" || isAdmin).map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tag (reviews only) */}
        {categoryInfo?.hasTags && (
          <div>
            <label className="block text-sm font-medium mb-1">말머리 *</label>
            <div className="flex gap-2">
              {(["보드게임", "외부활동"] as ReviewTag[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    tag === t
                      ? "bg-primary text-white"
                      : "bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:border-primary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {categoryInfo?.isPrivate && (
          <div className="p-3 bg-gray-100 dark:bg-dark-border rounded-lg text-sm text-gray-500 dark:text-gray-400">
            이 게시판의 글은 운영진만 확인할 수 있습니다.
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border dark:bg-dark-card rounded-lg text-sm"
            placeholder="제목을 입력하세요"
          />
        </div>

        {/* Content - Rich Editor */}
        <div>
          <label className="block text-sm font-medium mb-1">내용 *</label>
          <RichEditor
            value={content}
            onChange={setContent}
            placeholder="내용을 입력하세요. 툴바에서 이미지 삽입, 글꼴 꾸미기가 가능합니다."
          />
        </div>

        {/* 이미지는 에디터 툴바에서 삽입 */}
        {false && (
          <div></div>
        )}

        {/* Submit */}
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            {editId ? "수정 완료" : "작성 완료"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-sm"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
