import { CategoryInfo } from "./types";

export const CATEGORIES: CategoryInfo[] = [
  { slug: "notices", label: "공지사항", icon: "📢", description: "클럽 공지사항", color: "#D06B6B" },
  { slug: "introductions", label: "자기소개방", icon: "👋", description: "새 멤버 소개", color: "#E8A87C" },
  { slug: "reviews", label: "모임 후기", icon: "📸", description: "모임 활동 후기", color: "#7CB8A0", hasTags: true, hasPhotos: true },
  { slug: "tournaments", label: "대회 기록", icon: "🏆", description: "대회 결과 기록", color: "#C1A0D0" },
  { slug: "events", label: "이벤트", icon: "🎉", description: "예정된 이벤트", color: "#6BA3D0" },
  { slug: "chat", label: "잡담방", icon: "💬", description: "자유 게시판", color: "#A0C1D0" },
  { slug: "suggestions", label: "건의방", icon: "📝", description: "건의 및 제안 (비공개)", color: "#7A7A7A", isPrivate: true },
];

export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
