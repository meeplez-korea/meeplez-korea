import { supabase } from "./supabase";
import { Post, Comment, CategorySlug, Profile, Promotion, Notification } from "./types";
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
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw new Error("역할 변경 실패: " + error.message);
}

export async function adminUpdateNickname(userId: string, nickname: string) {
  await ensureSession();
  const { error } = await supabase.from("profiles").update({ nickname }).eq("id", userId);
  if (error) throw new Error("닉네임 변경 실패: " + error.message);
  await supabase.from("posts").update({ author_name: nickname }).eq("author_id", userId);
  await supabase.from("comments").update({ author_name: nickname }).eq("author_id", userId);
}

export async function adminDeleteUser(userId: string) {
  await ensureSession();
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) throw new Error("계정 삭제 실패: " + error.message);
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
  const result = await supabase.from("posts").insert(post).select().single();
  if (!result.error) clearCache();
  return result;
}

export async function updatePost(id: string, updates: Partial<Post>) {
  await ensureSession();
  const result = await supabase
    .from("posts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (!result.error) clearCache();
  return result;
}

export async function deletePost(id: string) {
  await ensureSession();
  const result = await supabase.from("posts").delete().eq("id", id);
  if (!result.error) clearCache();
  return result;
}

export async function incrementViewCount(id: string) {
  const { data } = await supabase
    .from("posts")
    .select("view_count")
    .eq("id", id)
    .single();

  if (data) {
    await supabase
      .from("posts")
      .update({ view_count: data.view_count + 1 })
      .eq("id", id);
    clearCache();
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

export async function addComment(postId: string, authorId: string, authorName: string, content: string, parentId?: string) {
  await ensureSession();
  const row: Record<string, unknown> = { post_id: postId, author_id: authorId, author_name: authorName, content };
  if (parentId) row.parent_id = parentId;
  const result = await supabase
    .from("comments")
    .insert(row)
    .select()
    .single();
  if (!result.error) clearCache(`comments-${postId}`);
  return result;
}

export async function deleteComment(commentId: string) {
  await ensureSession();
  const result = await supabase.from("comments").delete().eq("id", commentId);
  if (!result.error) clearCache();
  return result;
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
  const result = await supabase.from("promotions").insert(promotion).select().single();
  if (!result.error) clearCache("promotions");
  return result;
}

export async function updatePromotion(id: string, updates: Partial<Promotion>) {
  await ensureSession();
  const result = await supabase
    .from("promotions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (!result.error) clearCache("promotions");
  return result;
}

export async function deletePromotion(id: string) {
  await ensureSession();
  const result = await supabase.from("promotions").delete().eq("id", id);
  if (!result.error) clearCache("promotions");
  return result;
}

// ── Search ──

export async function searchPosts(query: string): Promise<Post[]> {
  if (!query.trim()) return [];
  const { data } = await supabase
    .from("posts")
    .select("*")
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .eq("is_private", false)
    .order("created_at", { ascending: false })
    .limit(30);
  return data || [];
}

// ── My Posts / Comments (Profile) ──

export async function getMyPosts(userId: string): Promise<Post[]> {
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getMyComments(userId: string): Promise<(Comment & { post_title?: string })[]> {
  const { data } = await supabase
    .from("comments")
    .select("*, posts(title)")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  return (data || []).map((c: any) => ({
    ...c,
    post_title: c.posts?.title,
  }));
}

// ── Notifications ──

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data || [];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count || 0;
}

export async function markNotificationsRead(userId: string) {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
}

export async function createNotification(userId: string, type: string, title: string, message: string, link: string) {
  return supabase
    .from("notifications")
    .insert({ user_id: userId, type, title, message, link });
}

export async function notifyAdmins(type: string, title: string, message: string, link: string, excludeUserId?: string) {
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");
  if (!admins) return;
  const targets = excludeUserId ? admins.filter((a) => a.id !== excludeUserId) : admins;
  if (targets.length === 0) return;
  await supabase
    .from("notifications")
    .insert(targets.map((a) => ({ user_id: a.id, type, title, message, link })));
}

// ── Likes ──

export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  await ensureSession();
  // 삭제 시도
  const { data: deleted, error: deleteError } = await supabase
    .from("post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId)
    .select("id");
  if (deleteError) console.error("좋아요 삭제 실패:", deleteError);

  if (deleted && deleted.length > 0) {
    return false;
  }
  // 삭제된 게 없으면 좋아요 추가
  const { error } = await supabase
    .from("post_likes")
    .insert({ post_id: postId, user_id: userId });
  if (error) console.error("좋아요 추가 실패:", error);
  return true;
}

export async function toggleCommentLike(commentId: string, userId: string): Promise<boolean> {
  await ensureSession();
  const { data: deleted, error: deleteError } = await supabase
    .from("comment_likes")
    .delete()
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .select("id");
  if (deleteError) console.error("댓글 좋아요 삭제 실패:", deleteError);

  if (deleted && deleted.length > 0) {
    return false;
  }
  const { error } = await supabase
    .from("comment_likes")
    .insert({ comment_id: commentId, user_id: userId });
  if (error) console.error("댓글 좋아요 추가 실패:", error);
  return true;
}

export async function getCommentLikeStatuses(commentIds: string[], userId?: string): Promise<Record<string, { count: number; liked: boolean }>> {
  if (commentIds.length === 0) return {};

  const { data: counts } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .in("comment_id", commentIds);

  const countMap: Record<string, number> = {};
  (counts || []).forEach((row: any) => {
    countMap[row.comment_id] = (countMap[row.comment_id] || 0) + 1;
  });

  const likedSet = new Set<string>();
  if (userId) {
    const { data: liked } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .in("comment_id", commentIds)
      .eq("user_id", userId);
    (liked || []).forEach((row: any) => likedSet.add(row.comment_id));
  }

  const result: Record<string, { count: number; liked: boolean }> = {};
  commentIds.forEach((id) => {
    result[id] = { count: countMap[id] || 0, liked: likedSet.has(id) };
  });
  return result;
}

export async function getLikeStatus(postId: string, userId?: string): Promise<{ count: number; liked: boolean }> {
  const { count } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  let liked = false;
  if (userId) {
    const { data } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();
    liked = !!data;
  }

  return { count: count || 0, liked };
}
