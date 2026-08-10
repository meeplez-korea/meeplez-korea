import { CategoryInfo } from "./types";

export const CATEGORIES: CategoryInfo[] = [
  { slug: "notices", label: "공지사항", icon: "📢", description: "", color: "#D06B6B" },
  { slug: "introductions", label: "자기소개방", icon: "👋", description: "", color: "#E8A87C" },
  { slug: "reviews", label: "모임 후기", icon: "📸", description: "", color: "#7CB8A0", hasTags: true, hasPhotos: true },
  { slug: "tournaments", label: "대회 기록", icon: "🏆", description: "", color: "#C1A0D0" },
  { slug: "events", label: "이벤트", icon: "🎉", description: "", color: "#6BA3D0" },
  { slug: "chat", label: "사고팔고", icon: "🎲", description: "", color: "#A0C1D0" },
  { slug: "suggestions", label: "건의방", icon: "📝", description: "작성된 건의사항은 관리자만 확인할 수 있습니다.", color: "#7A7A7A", isPrivate: true },
];

export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
