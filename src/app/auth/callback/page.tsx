"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/storage";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // URL에서 세션 토큰 추출 시도
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        // 세션 없으면 잠시 대기 후 재시도
        await new Promise((r) => setTimeout(r, 2000));
        const { data: retry } = await supabase.auth.getSession();

        if (!retry.session) {
          // 그래도 없으면 로그인 페이지로
          router.push("/login");
          return;
        }
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      // 트리거가 프로필 만들 시간 대기
      await new Promise((r) => setTimeout(r, 1000));

      const profile = await getProfile(userData.user.id);

      if (!profile || !profile.nickname || profile.role === "pending") {
        router.push("/setup-profile");
      } else {
        router.push("/");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <p className="text-gray-400">로그인 처리 중...</p>
    </div>
  );
}
