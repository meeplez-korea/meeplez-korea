"use client";

import { signInWithKakao } from "@/lib/storage";

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <img src="/meeplez.jpg" alt="미플즈" className="w-16 h-16 mx-auto rounded-xl object-cover mb-3" />
          <h1 className="text-xl font-bold">미플즈 로그인</h1>
          <p className="text-sm text-gray-400 mt-1">소셜 계정으로 간편 로그인</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => signInWithKakao()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-colors"
            style={{ backgroundColor: "#FEE500", color: "#191919" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.44 4.08 3.62 5.17-.16.56-.57 2.03-.66 2.35-.1.39.14.39.3.28.13-.08 2.01-1.36 2.82-1.91.6.09 1.23.13 1.87.13 4.42 0 8-2.79 8-6.23C17 3.79 13.42 1 9 1z" fill="#191919"/>
            </svg>
            카카오로 시작하기
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          첫 로그인 시 자동으로 가입됩니다.<br />
          관리자 승인 후 게시글 작성이 가능합니다.
        </p>
      </div>
    </div>
  );
}
