"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/storage";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // 프로필 확인 - 카카오 닉네임 그대로인지 체크
        const profile = await getProfile(session.user.id);
        const kakaoName = session.user.user_metadata?.name
          || session.user.user_metadata?.full_name
          || session.user.user_metadata?.preferred_username;

        if (profile && kakaoName && profile.nickname === kakaoName) {
          // 카카오에서 자동으로 넣은 닉네임 → 설정 페이지로
          router.push("/setup-profile");
        } else if (!profile) {
          // 프로필이 아직 없음 (트리거 지연) → 잠시 후 설정 페이지로
          router.push("/setup-profile");
        } else {
          // 이미 닉네임을 직접 설정한 유저 → 홈으로
          router.push("/");
        }
      }
    });
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <p className="text-gray-400">로그인 처리 중...</p>
    </div>
  );
}
