export type CategorySlug =
  | "notices"
  | "introductions"
  | "reviews"
  | "tournaments"
  | "events"
  | "chat"
  | "suggestions";

export type ReviewTag = "보드게임" | "외부활동" | "ALL";

export type UserRole = "pending" | "member" | "admin";

export interface Profile {
  id: string;
  nickname: string;
  role: UserRole;
  created_at: string;
}

export interface Post {
  id: string;
  category: CategorySlug;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  tag?: string;
  thumbnail_url?: string;
  images?: string[];
  is_private: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface Promotion {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
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
