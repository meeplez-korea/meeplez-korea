"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getPosts, getAllProfiles, updateUserRole, getPromotions, createPromotion, updatePromotion, deletePromotion } from "@/lib/storage";
import { Post, Profile, Promotion } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<"suggestions" | "members" | "promotions">("suggestions");
  const [suggestions, setSuggestions] = useState<Post[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  // Promotion form
  const [promoTitle, setPromoTitle] = useState("");
  const [promoContent, setPromoContent] = useState("");
  const [editingPromo, setEditingPromo] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    const [s, m, p] = await Promise.all([
      getPosts("suggestions"),
      getAllProfiles(),
      getPromotions(),
    ]);
    setSuggestions(s);
    setMembers(m);
    setPromotions(p);
  };

  const handleRoleChange = async (userId: string, role: string) => {
    await updateUserRole(userId, role);
    const updated = await getAllProfiles();
    setMembers(updated);
  };

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitle.trim() || !promoContent.trim()) return;

    if (editingPromo) {
      await updatePromotion(editingPromo, { title: promoTitle, content: promoContent });
    } else {
      await createPromotion({ title: promoTitle, content: promoContent });
    }

    setPromoTitle("");
    setPromoContent("");
    setEditingPromo(null);
    const updated = await getPromotions();
    setPromotions(updated);
  };

  const handlePromoDelete = async (id: string) => {
    await deletePromotion(id);
    const updated = await getPromotions();
    setPromotions(updated);
  };

  const startEditPromo = (promo: Promotion) => {
    setEditingPromo(promo.id);
    setPromoTitle(promo.title);
    setPromoContent(promo.content);
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">로딩 중...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">
        관리자만 접근할 수 있습니다.
      </div>
    );
  }

  const tabs = [
    { key: "suggestions", label: "건의방", count: suggestions.length },
    { key: "members", label: "회원 관리", count: members.length },
    { key: "promotions", label: "홍보칸", count: promotions.length },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">관리자 페이지</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-sm rounded-lg transition-colors ${
              tab === t.key ? "bg-primary text-white" : "text-gray-500 hover:bg-cream"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Suggestions Tab */}
      {tab === "suggestions" && (
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">
              건의사항이 없습니다.
            </div>
          ) : (
            suggestions.map((post) => (
              <Link
                key={post.id}
                href={`/board/suggestions/${post.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-sm">{post.title}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {post.author_name} | {formatDate(post.created_at)}
                </p>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{post.content}</p>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Members Tab */}
      {tab === "members" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-cream/50">
              <tr className="text-xs text-gray-500">
                <th className="py-3 px-4 text-left font-medium">닉네임</th>
                <th className="py-3 px-4 text-left font-medium">가입일</th>
                <th className="py-3 px-4 text-left font-medium">상태</th>
                <th className="py-3 px-4 text-center font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-t border-gray-50">
                  <td className="py-3 px-4 text-sm">{member.nickname}</td>
                  <td className="py-3 px-4 text-xs text-gray-400">{formatDate(member.created_at)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        member.role === "admin"
                          ? "bg-danger/10 text-danger"
                          : member.role === "member"
                          ? "bg-primary/10 text-primary"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {member.role === "admin" ? "관리자" : member.role === "member" ? "회원" : "대기"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1"
                    >
                      <option value="pending">대기</option>
                      <option value="member">회원</option>
                      <option value="admin">관리자</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Promotions Tab */}
      {tab === "promotions" && (
        <div className="space-y-4">
          {/* Add/Edit form */}
          <form onSubmit={handlePromoSubmit} className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
            <input
              type="text"
              value={promoTitle}
              onChange={(e) => setPromoTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="홍보 제목"
            />
            <textarea
              value={promoContent}
              onChange={(e) => setPromoContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-20"
              placeholder="홍보 내용"
            />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90">
                {editingPromo ? "수정" : "추가"}
              </button>
              {editingPromo && (
                <button
                  type="button"
                  onClick={() => { setEditingPromo(null); setPromoTitle(""); setPromoContent(""); }}
                  className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
              )}
            </div>
          </form>

          {/* List */}
          {promotions.map((promo) => (
            <div key={promo.id} className="bg-white rounded-xl p-4 border border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-sm">{promo.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{promo.content}</p>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button
                  onClick={() => startEditPromo(promo)}
                  className="text-xs text-gray-400 hover:text-primary"
                >
                  수정
                </button>
                <button
                  onClick={() => handlePromoDelete(promo.id)}
                  className="text-xs text-gray-400 hover:text-danger"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
