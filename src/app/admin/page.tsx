"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getPosts, getAllProfiles, updateUserRole, adminUpdateNickname, adminDeleteUser, getPromotions, createPromotion, updatePromotion, deletePromotion } from "@/lib/storage";
import { Post, Profile, Promotion } from "@/lib/types";
import { formatDate, sanitizeHtml } from "@/lib/utils";
import RichEditor from "@/components/ui/RichEditor";

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<"suggestions" | "members" | "promotions">("suggestions");
  const [suggestions, setSuggestions] = useState<Post[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [promoTitle, setPromoTitle] = useState("");
  const [promoContent, setPromoContent] = useState("");
  const [promoIcon, setPromoIcon] = useState("📣");
  const [editingPromo, setEditingPromo] = useState<string | null>(null);

  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (isAdmin) loadData();
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
    try {
      await updateUserRole(userId, role);
      const updated = await getAllProfiles();
      setMembers(updated);
      showToast("역할이 변경되었습니다.");
    } catch (err: any) {
      showToast(err.message || "역할 변경에 실패했습니다.", "error");
    }
  };

  const handleNicknameEdit = (member: Profile) => {
    setEditingMember(member.id);
    setEditNickname(member.nickname);
  };

  const handleNicknameSave = async (userId: string) => {
    if (!editNickname.trim()) return;
    try {
      await adminUpdateNickname(userId, editNickname.trim());
      setEditingMember(null);
      setEditNickname("");
      const updated = await getAllProfiles();
      setMembers(updated);
      showToast("닉네임이 변경되었습니다.");
    } catch (err: any) {
      showToast(err.message || "닉네임 변경에 실패했습니다.", "error");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminDeleteUser(userId);
      setDeleteConfirm(null);
      const updated = await getAllProfiles();
      setMembers(updated);
      showToast("계정이 삭제되었습니다.");
    } catch (err: any) {
      showToast(err.message || "계정 삭제에 실패했습니다.", "error");
    }
  };

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitle.trim() || !promoContent.trim()) return;

    try {
      if (editingPromo) {
        await updatePromotion(editingPromo, { title: promoTitle, content: promoContent, icon: promoIcon });
        showToast("홍보가 수정되었습니다.");
      } else {
        await createPromotion({ title: promoTitle, content: promoContent, icon: promoIcon });
        showToast("홍보가 추가되었습니다.");
      }
      setPromoTitle("");
      setPromoContent("");
      setPromoIcon("📣");
      setEditingPromo(null);
      const updated = await getPromotions();
      setPromotions(updated);
    } catch {
      showToast("저장에 실패했습니다.", "error");
    }
  };

  const handlePromoDelete = async (id: string) => {
    try {
      await deletePromotion(id);
      const updated = await getPromotions();
      setPromotions(updated);
      showToast("홍보가 삭제되었습니다.");
    } catch {
      showToast("삭제에 실패했습니다.", "error");
    }
  };

  const startEditPromo = (promo: Promotion) => {
    setEditingPromo(promo.id);
    setPromoTitle(promo.title);
    setPromoContent(promo.content);
    setPromoIcon(promo.icon || "📣");
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400">로딩 중...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400">
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
      <h1 className="text-2xl font-bold tracking-tight mb-6">관리자 페이지</h1>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-card-hover animate-slide-up ${
          toast.type === "error" ? "bg-danger text-white" : "bg-primary text-white"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-white dark:bg-dark-card rounded-xl p-1 shadow-card dark:shadow-card-dark">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              tab === t.key
                ? "bg-primary text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-cream/50 dark:hover:bg-dark-hover"
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
            <div className="bg-white dark:bg-dark-card rounded-xl p-12 text-center text-gray-400 shadow-card dark:shadow-card-dark">
              건의사항이 없습니다.
            </div>
          ) : (
            suggestions.map((post) => (
              <Link
                key={post.id}
                href={`/board/suggestions/${post.id}`}
                className="block bg-white dark:bg-dark-card rounded-xl p-5 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-px transition-all duration-200 group"
              >
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{post.title}</h3>
                <p className="text-xs text-gray-400 mt-1.5 tabular-nums">
                  {post.author_name} · {formatDate(post.created_at)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">{post.content}</p>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Members Tab */}
      {tab === "members" && (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="bg-white dark:bg-dark-card rounded-xl p-5 shadow-card dark:shadow-card-dark">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {editingMember === member.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        className="px-2.5 py-1 border border-gray-200 dark:border-dark-border dark:bg-dark-card rounded-lg text-sm w-32"
                      />
                      <button onClick={() => handleNicknameSave(member.id)} className="text-xs font-medium text-primary hover:text-primary-dark">저장</button>
                      <button onClick={() => setEditingMember(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">취소</button>
                    </div>
                  ) : (
                    <>
                      <span className="font-semibold text-sm">{member.nickname}</span>
                      <button onClick={() => handleNicknameEdit(member)} className="text-[11px] text-gray-400 hover:text-primary font-medium">이름변경</button>
                    </>
                  )}
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                  member.role === "admin" ? "bg-danger/10 text-danger" : member.role === "member" ? "bg-primary/10 text-primary" : "bg-gray-100 dark:bg-dark-hover text-gray-500 dark:text-gray-400"
                }`}>
                  {member.role === "admin" ? "관리자" : member.role === "member" ? "회원" : "대기"}
                </span>
              </div>
              <div className="text-xs text-gray-400 mb-3 tabular-nums">가입일: {formatDate(member.created_at)}</div>
              <div className="flex items-center justify-between">
                <select value={member.role} onChange={(e) => handleRoleChange(member.id, e.target.value)} className="text-xs border border-gray-200 dark:border-dark-border dark:bg-dark-card rounded-lg px-2.5 py-1.5">
                  <option value="pending">대기</option>
                  <option value="member">회원</option>
                  <option value="admin">관리자</option>
                </select>
                {deleteConfirm === member.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-danger font-medium">정말 삭제?</span>
                    <button onClick={() => handleDeleteUser(member.id)} className="text-xs px-2.5 py-1 bg-danger text-white rounded-lg hover:brightness-95 font-medium">확인</button>
                    <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2.5 py-1 border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover font-medium">취소</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(member.id)} className="text-xs text-gray-400 hover:text-danger font-medium">계정 삭제</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Promotions Tab */}
      {tab === "promotions" && (
        <div className="space-y-4">
          <form onSubmit={handlePromoSubmit} className="bg-white dark:bg-dark-card rounded-xl p-5 shadow-card dark:shadow-card-dark space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">아이콘</label>
              <div className="flex gap-1.5 flex-wrap">
                {["📣", "🎉", "🔔", "⭐", "🎯", "🎁", "💡", "🏆", "📢", "✨", "🔥", "💬", "📌", "❤️", "👋", "🎮"].map((icon) => (
                  <button key={icon} type="button" onClick={() => setPromoIcon(icon)} className={`w-9 h-9 text-lg rounded-lg flex items-center justify-center transition-all ${promoIcon === icon ? "bg-primary/15 ring-2 ring-primary" : "bg-gray-50 dark:bg-dark-hover hover:bg-gray-100 dark:hover:bg-dark-border"}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <input type="text" value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-dark-border dark:bg-dark-card rounded-xl text-sm" placeholder="홍보 제목" />
            <RichEditor value={promoContent} onChange={setPromoContent} placeholder="홍보 내용을 입력하세요" />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark">{editingPromo ? "수정" : "추가"}</button>
              {editingPromo && (
                <button type="button" onClick={() => { setEditingPromo(null); setPromoTitle(""); setPromoContent(""); setPromoIcon("📣"); }} className="px-4 py-2 border border-gray-200 dark:border-dark-border text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover">취소</button>
              )}
            </div>
          </form>

          {promotions.map((promo) => (
            <div key={promo.id} className="bg-white dark:bg-dark-card rounded-xl p-5 shadow-card dark:shadow-card-dark flex justify-between items-start">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm">{promo.title}</h3>
                <div className="post-content text-xs text-gray-500 dark:text-gray-400 mt-1" dangerouslySetInnerHTML={{ __html: sanitizeHtml(promo.content) }} />
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button onClick={() => startEditPromo(promo)} className="text-xs text-gray-400 hover:text-primary font-medium">수정</button>
                <button onClick={() => handlePromoDelete(promo.id)} className="text-xs text-gray-400 hover:text-danger font-medium">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
