"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, getCategoryBySlug } from "@/lib/categories";
import { createPost, getPost, updatePost } from "@/lib/storage";
import { CategorySlug, ReviewTag } from "@/lib/types";
import { compressImage } from "@/lib/utils";
import { MAX_IMAGES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user, profile, isMember } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CategorySlug>(initialCategory as CategorySlug);
  const [tag, setTag] = useState<ReviewTag>("보드게임");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const categoryInfo = getCategoryBySlug(category);

  useEffect(() => {
    if (editId) {
      getPost(editId).then((post) => {
        if (post) {
          setTitle(post.title);
          setContent(post.content);
          setCategory(post.category);
          if (post.tag) setTag(post.tag as ReviewTag);
          if (post.images) setImages(post.images);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX_IMAGES - images.length;
    const filesToProcess = Array.from(files).slice(0, remaining);
    setLoading(true);
    const compressed = await Promise.all(filesToProcess.map(compressImage));
    setImages((prev) => [...prev, ...compressed]);
    setLoading(false);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user || !profile) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    const postData = {
      title,
      content,
      category,
      author_id: user.id,
      author_name: profile.nickname,
      tag: categoryInfo?.hasTags ? tag : undefined,
      thumbnail_url: images.length > 0 ? images[0] : undefined,
      images: categoryInfo?.hasPhotos ? images : undefined,
      is_private: categoryInfo?.isPrivate || false,
    };

    if (editId) {
      await updatePost(editId, postData);
    } else {
      await createPost(postData);
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
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            {CATEGORIES.map((cat) => (
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
              {(["보드게임", "외부활동", "ALL"] as ReviewTag[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    tag === t
                      ? "bg-primary text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-primary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {categoryInfo?.isPrivate && (
          <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-500">
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
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            placeholder="제목을 입력하세요"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-1">내용 *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-64"
            placeholder="내용을 입력하세요"
          />
        </div>

        {/* Image upload */}
        {categoryInfo?.hasPhotos && (
          <div>
            <label className="block text-sm font-medium mb-1">사진 첨부 (최대 {MAX_IMAGES}장)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={images.length >= MAX_IMAGES || loading}
              className="text-sm"
            />
            {images.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative w-24 h-24">
                    <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white rounded-full text-xs flex items-center justify-center"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
            {loading && <p className="text-xs text-gray-400 mt-1">이미지 처리 중...</p>}
          </div>
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
            className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
