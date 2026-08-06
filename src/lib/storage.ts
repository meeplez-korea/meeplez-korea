import { supabase } from "./supabase";
import { Post, Comment, CategorySlug, Profile, Promotion } from "./types";
import { getCached, setCache, clearCache } from "./cache";

// DB 쓰기 전 세션 갱신
async function ensureSession() {
  await supabase.auth.refreshSession();
}

// ── Auth ──

export async function signInWithKakao() {
  return supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: window.location.origin + "/auth/callback",
      scopes: "profile_nickname profile_image",
    },
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
  await ensureSession();
  const existing = await getProfile(userId);
  if (existing) {
    const { error } = await supabase.from("profiles").update({ nickname }).eq("id", userId);
    if (error) throw new Error("프로필 업데이트 실패: " + error.message);
    await supabase.from("posts").update({ author_name: nickname }).eq("author_id", userId);
    await supabase.from("comments").update({ author_name: nickname }).eq("author_id", userId);
  } else {
    const { error } = await supabase.from("profiles").insert({ id: userId, nickname, role: "pending" });
    if (error) throw new Error("프로필 생성 실패: " + error.message);
  }
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
  await ensureSession();
  return supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
}

export async function adminUpdateNickname(userId: string, nickname: string) {
  await ensureSession();
  await supabase.from("profiles").update({ nickname }).eq("id", userId);
  // 기존 게시글 닉네임 업데이트
  await supabase.from("posts").update({ author_name: nickname }).eq("author_id", userId);
  // 기존 댓글 닉네임 업데이트
  await supabase.from("comments").update({ author_name: nickname }).eq("author_id", userId);
}

export async function adminDeleteUser(userId: string) {
  await ensureSession();
  await supabase.from("profiles").delete().eq("id", userId);
  // auth 유저는 admin API로만 삭제 가능하므로 프로필만 삭제
  // 유저는 다시 로그인 시 프로필이 없어서 접근 불가
}

// ── Posts ──

export async function getPosts(category?: CategorySlug): Promise<Post[]> {
  const cacheKey = `posts-${category || "all"}`;
  const cached = getCached<Post[]>(cacheKey);
  if (cached) return cached;

  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data } = await query;
  const result = data || [];
  setCache(cacheKey, result);
  return result;
}

export async function getPost(id: string): Promise<Post | null> {
  const cacheKey = `post-${id}`;
  const cached = getCached<Post>(cacheKey);
  if (cached) return cached;

  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  if (data) setCache(cacheKey, data);
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
  await ensureSession();
  clearCache();
  return supabase.from("posts").insert(post).select().single();
}

export async function updatePost(id: string, updates: Partial<Post>) {
  await ensureSession();
  clearCache();
  return supabase
    .from("posts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function deletePost(id: string) {
  await ensureSession();
  clearCache();
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
  const cacheKey = `comments-${postId}`;
  const cached = getCached<Comment[]>(cacheKey);
  if (cached) return cached;

  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  const result = data || [];
  setCache(cacheKey, result);
  return result;
}

export async function addComment(postId: string, authorId: string, authorName: string, content: string) {
  await ensureSession();
  clearCache(`comments-${postId}`);
  return supabase
    .from("comments")
    .insert({ post_id: postId, author_id: authorId, author_name: authorName, content })
    .select()
    .single();
}

export async function deleteComment(commentId: string) {
  await ensureSession();
  clearCache();
  return supabase.from("comments").delete().eq("id", commentId);
}

// ── Promotions ──

export async function getPromotions(): Promise<Promotion[]> {
  const cached = getCached<Promotion[]>("promotions");
  if (cached) return cached;

  const { data } = await supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const result = data || [];
  setCache("promotions", result);
  return result;
}

export async function createPromotion(promotion: { title: string; content: string; icon?: string; image_url?: string }) {
  await ensureSession();
  clearCache("promotions");
  return supabase.from("promotions").insert(promotion).select().single();
}

export async function updatePromotion(id: string, updates: Partial<Promotion>) {
  await ensureSession();
  clearCache("promotions");
  return supabase
    .from("promotions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function deletePromotion(id: string) {
  await ensureSession();
  clearCache("promotions");
  return supabase.from("promotions").delete().eq("id", id);
}
