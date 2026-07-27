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
        const profile = await getProfile(session.user.id);

        if (!profile || profile.nickname === "" || !profile.nickname) {
          // 프로필 없거나 닉네임 미설정 → 닉네임 설정 페이지
          router.push("/setup-profile");
        } else {
          // 닉네임 이미 설정됨 → 홈으로
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
