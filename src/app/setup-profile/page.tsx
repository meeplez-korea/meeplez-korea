"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { updateNickname } from "@/lib/storage";

export default function SetupProfilePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    if (!user) return;

    setLoading(true);
    await updateNickname(user.id, nickname.trim());
    router.push("/");
    router.refresh();
    window.location.href = "/";
  };

  if (!user) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-center text-gray-400">
        로그인이 필요합니다.
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-6">
          <img src="/meeplez.jpg" alt="미플즈" className="w-16 h-16 mx-auto rounded-xl object-cover mb-3" />
          <h1 className="text-xl font-bold">닉네임 설정</h1>
          <p className="text-sm text-gray-400 mt-1">미플즈에서 사용할 닉네임을 설정해주세요.</p>
        </div>

        <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg mb-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            오픈채팅 닉네임과 동일하게 설정해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
            placeholder="닉네임"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? "처리 중..." : "설정 완료"}
          </button>
        </form>

        <div className="mt-4 p-3 bg-cream/50 rounded-lg">
          <p className="text-xs text-gray-400 leading-relaxed">
            관리자 승인 후 게시판 이용이 가능합니다.<br />
            오픈채팅방에서 관리자에게 승인을 요청해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
