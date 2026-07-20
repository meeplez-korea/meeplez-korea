export type CategorySlug =
  | "notices"
  | "introductions"
  | "reviews"
  | "tournaments"
  | "events"
  | "chat"
  | "suggestions";

export type ReviewTag = "보드게임" | "외부활동" | "ALL";

export interface Post {
  id: string;
  category: CategorySlug;
  title: string;
  content: string;
  author: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  tag?: ReviewTag;
  thumbnailUrl?: string;
  images?: string[];
  isPrivate?: boolean;
  comments: Comment[];
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface CategoryInfo {
  slug: CategorySlug;
  label: string;
  icon: string;
  description: string;
  color: string;
  hasTags?: boolean;
  hasPhotos?: boolean;
  isPrivate?: boolean;
}
