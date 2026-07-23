import { supabase } from "./supabase";
import { Post, Comment, CategorySlug, Profile, Promotion } from "./types";

// ── Auth ──

export async function signInWithKakao() {
  return supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: { redirectTo: window.location.origin + "/auth/callback" },
  });
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/auth/callback" },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export async function updateNickname(userId: string, nickname: string) {
  return supabase
    .from("profiles")
    .update({ nickname })
    .eq("id", userId);
}

// ── Profiles (Admin) ──

export async function getAllProfiles(): Promise<Profile[]> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function updateUserRole(userId: string, role: string) {
  return supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
}

export async function adminUpdateNickname(userId: string, nickname: string) {
  return supabase
    .from("profiles")
    .update({ nickname })
    .eq("id", userId);
}

export async function adminDeleteUser(userId: string) {
  // 프로필 삭제 (posts/comments는 CASCADE로 자동 삭제)
  await supabase.from("profiles").delete().eq("id", userId);
  // auth 유저는 admin API로만 삭제 가능하므로 프로필만 삭제
  // 유저는 다시 로그인 시 프로필이 없어서 접근 불가
}

// ── Posts ──

export async function getPosts(category?: CategorySlug): Promise<Post[]> {
  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data } = await query;
  return data || [];
}

export async function getPost(id: string): Promise<Post | null> {
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function createPost(post: {
  category: CategorySlug;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  tag?: string;
  thumbnail_url?: string;
  images?: string[];
  is_private?: boolean;
}) {
  return supabase.from("posts").insert(post).select().single();
}

export async function updatePost(id: string, updates: Partial<Post>) {
  return supabase
    .from("posts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function deletePost(id: string) {
  return supabase.from("posts").delete().eq("id", id);
}

export async function incrementViewCount(id: string) {
  const post = await getPost(id);
  if (post) {
    await supabase
      .from("posts")
      .update({ view_count: post.view_count + 1 })
      .eq("id", id);
  }
}

// ── Comments ──

export async function getComments(postId: string): Promise<Comment[]> {
  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  return data || [];
}

export async function addComment(postId: string, authorId: string, authorName: string, content: string) {
  return supabase
    .from("comments")
    .insert({ post_id: postId, author_id: authorId, author_name: authorName, content })
    .select()
    .single();
}

export async function deleteComment(commentId: string) {
  return supabase.from("comments").delete().eq("id", commentId);
}

// ── Promotions ──

export async function getPromotions(): Promise<Promotion[]> {
  const { data } = await supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return data || [];
}

export async function createPromotion(promotion: { title: string; content: string; image_url?: string }) {
  return supabase.from("promotions").insert(promotion).select().single();
}

export async function updatePromotion(id: string, updates: Partial<Promotion>) {
  return supabase
    .from("promotions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function deletePromotion(id: string) {
  return supabase.from("promotions").delete().eq("id", id);
}
