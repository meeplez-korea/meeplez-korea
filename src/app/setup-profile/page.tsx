"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/storage";

export default function SetupProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setAuthReady(true);
      } else {
        setTimeout(check, 1000);
      }
    };
    check();
  }, []);

  // 닉네임이 이미 있으면 홈으로
  useEffect(() => {
    if (authLoading) return;
    if (profile?.nickname?.trim()) {
      router.push("/");
    }
  }, [authLoading, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        await supabase.auth.refreshSession();
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError("로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
        setLoading(false);
        return;
      }

      const userId = userData.user.id;
      const profile = await getProfile(userId);

      if (profile) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ nickname: nickname.trim() })
          .eq("id", userId);

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({ id: userId, nickname: nickname.trim(), role: "pending" });

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      setDone(true);
    } catch (err: any) {
      if (retryCount < 2) {
        setRetryCount((c) => c + 1);
        setTimeout(() => handleSubmit(e), 1000);
      } else {
        setError("닉네임 저장에 실패했습니다: " + (err?.message || "다시 시도해주세요."));
        setLoading(false);
      }
    }
  };

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm bg-white dark:bg-dark-card rounded-2xl shadow-card dark:shadow-card-dark p-8 text-center animate-slide-up">
          <p className="text-sm font-semibold text-primary mb-2">닉네임이 설정되었습니다</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            관리자 승인 후 게시판 이용이 가능합니다.<br />
            오픈채팅방에서 관리자에게 승인을 요청해주세요.
          </p>
          <button
            onClick={() => { window.location.href = "/"; }}
            className="mt-4 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-center text-gray-400">
        로그인 처리 중...
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-card dark:shadow-card-dark p-8">
          <div className="text-center mb-6">
            <img src="/meeplez.jpg" alt="미플즈" className="w-16 h-16 mx-auto rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10 mb-4" />
            <h1 className="text-xl font-bold tracking-tight">닉네임 설정</h1>
            <p className="text-sm text-gray-400 mt-1.5">오픈채팅방 닉네임(이름)과 동일하게 설정해주세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-dark-border dark:bg-dark-card rounded-xl text-sm"
              placeholder="닉네임"
            />
            {error && (
              <p className="text-xs text-danger bg-danger/5 px-3 py-2 rounded-lg">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark text-sm font-medium disabled:opacity-50"
            >
              {loading ? "처리 중..." : "설정 완료"}
            </button>
          </form>

          <div className="mt-5 p-3.5 bg-cream/50 dark:bg-dark-hover rounded-xl">
            <p className="text-xs text-gray-400 leading-relaxed">
              관리자 승인 후 게시판 이용이 가능합니다.<br />
              오픈채팅방에서 관리자에게 승인을 요청해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
