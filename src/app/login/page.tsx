"use client";

import { useState } from "react";
import { signInWithKakao } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signUpDone, setSignUpDone] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: nickname || email.split("@")[0] } },
        });
        if (error) {
          setError(typeof error === "object" ? (error.message || error.code || JSON.stringify(error)) : String(error));
        } else if (data?.user) {
          setSignUpDone(true);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(typeof error === "object" ? (error.message || error.code || JSON.stringify(error)) : String(error));
        } else if (data?.user) {
          router.push("/");
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-card dark:shadow-card-dark p-8">
          <div className="text-center mb-8">
            <img
              src="/meeplez.jpg"
              alt="미플즈"
              className="w-16 h-16 mx-auto rounded-xl object-cover ring-1 ring-black/5 dark:ring-white/10 mb-4"
            />
            <h1 className="text-xl font-bold tracking-tight">미플즈 로그인</h1>
          </div>

          {signUpDone ? (
            <div className="p-5 bg-primary/5 border border-primary/10 rounded-xl text-center">
              <p className="text-sm font-semibold text-primary mb-2">회원가입이 완료되었습니다</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                관리자 승인 후 게시판 이용이 가능합니다.<br />
                오픈채팅방에서 관리자에게 승인을 요청해주세요.
              </p>
              <button
                onClick={() => { router.push("/"); router.refresh(); }}
                className="mt-4 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark"
              >
                홈으로 이동
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => signInWithKakao()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm hover:brightness-[0.97] active:brightness-95"
                style={{ backgroundColor: "#FEE500", color: "#191919" }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.44 4.08 3.62 5.17-.16.56-.57 2.03-.66 2.35-.1.39.14.39.3.28.13-.08 2.01-1.36 2.82-1.91.6.09 1.23.13 1.87.13 4.42 0 8-2.79 8-6.23C17 3.79 13.42 1 9 1z" fill="#191919"/>
                </svg>
                카카오로 시작하기
              </button>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
                <span className="text-xs text-gray-400 font-medium">또는</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-dark-border" />
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3">
                {isSignUp && (
                  <>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-dark-border dark:bg-dark-card rounded-xl text-sm"
                      placeholder="닉네임"
                    />
                    <p className="text-xs text-gray-400 -mt-1 pl-1">
                      오픈채팅 닉네임과 동일하게 입력해주세요.
                    </p>
                  </>
                )}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-dark-border dark:bg-dark-card rounded-xl text-sm"
                  placeholder="이메일"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-dark-border dark:bg-dark-card rounded-xl text-sm"
                  placeholder="비밀번호 (6자 이상)"
                />
                {error && (
                  <p className="text-xs text-danger bg-danger/5 px-3 py-2 rounded-lg">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark text-sm font-medium disabled:opacity-50"
                >
                  {loading ? "처리 중..." : isSignUp ? "회원가입" : "로그인"}
                </button>
              </form>

              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-5 text-center font-medium"
              >
                {isSignUp ? "이미 계정이 있나요? 로그인" : "계정이 없나요? 회원가입"}
              </button>

              <p className="text-[11px] text-gray-400 text-center mt-4">
                관리자 승인 후 게시글 작성이 가능합니다.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
