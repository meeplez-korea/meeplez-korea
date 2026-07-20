import { Post, Comment, CategorySlug } from "./types";
import { STORAGE_KEY, ADMIN_KEY } from "./constants";
import { generateId } from "./utils";

function getAllPosts(): Post[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function savePosts(posts: Post[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function getPosts(category?: CategorySlug): Post[] {
  let posts = getAllPosts();
  if (category) {
    posts = posts.filter((p) => p.category === category);
  }
  return posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getPost(id: string): Post | null {
  const posts = getAllPosts();
  return posts.find((p) => p.id === id) || null;
}

export function createPost(
  post: Omit<Post, "id" | "createdAt" | "updatedAt" | "viewCount" | "comments">
): Post {
  const posts = getAllPosts();
  const newPost: Post = {
    ...post,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0,
    comments: [],
  };
  posts.push(newPost);
  savePosts(posts);
  return newPost;
}

export function updatePost(id: string, updates: Partial<Post>): Post | null {
  const posts = getAllPosts();
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) return null;
  posts[index] = { ...posts[index], ...updates, updatedAt: new Date().toISOString() };
  savePosts(posts);
  return posts[index];
}

export function deletePost(id: string): void {
  const posts = getAllPosts().filter((p) => p.id !== id);
  savePosts(posts);
}

export function incrementViewCount(id: string): void {
  const posts = getAllPosts();
  const post = posts.find((p) => p.id === id);
  if (post) {
    post.viewCount += 1;
    savePosts(posts);
  }
}

export function addComment(
  postId: string,
  author: string,
  content: string
): Comment | null {
  const posts = getAllPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;
  const comment: Comment = {
    id: generateId(),
    postId,
    author,
    content,
    createdAt: new Date().toISOString(),
  };
  post.comments.push(comment);
  savePosts(posts);
  return comment;
}

export function deleteComment(postId: string, commentId: string): void {
  const posts = getAllPosts();
  const post = posts.find((p) => p.id === postId);
  if (post) {
    post.comments = post.comments.filter((c) => c.id !== commentId);
    savePosts(posts);
  }
}

export function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function setAdmin(value: boolean): void {
  if (value) {
    localStorage.setItem(ADMIN_KEY, "true");
  } else {
    localStorage.removeItem(ADMIN_KEY);
  }
}

export function getRecentPosts(limit: number = 5): Post[] {
  return getAllPosts()
    .filter((p) => !p.isPrivate)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function seedData(): void {
  if (getAllPosts().length > 0) return;

  const seeds: Omit<Post, "id" | "createdAt" | "updatedAt" | "viewCount" | "comments">[] = [
    {
      category: "notices",
      title: "미플즈 2024년 하반기 정기모임 안내",
      content: "안녕하세요! 미플즈 운영진입니다.\n\n2024년 하반기 정기모임은 매주 토요일 오후 2시에 진행됩니다.\n장소: 강남역 보드게임카페\n\n많은 참여 부탁드립니다!",
      author: "운영진",
      password: "admin",
    },
    {
      category: "notices",
      title: "신입 회원 모집 공고",
      content: "미플즈에서 새로운 회원을 모집합니다!\n\n보드게임을 좋아하시는 분이라면 누구나 환영합니다.\n가입 문의는 카카오톡 오픈채팅으로 연락주세요.",
      author: "운영진",
      password: "admin",
    },
    {
      category: "reviews",
      title: "7월 첫째주 정기모임 후기",
      content: "이번 모임에서는 테라포밍 마스, 윙스팬, 아줄을 플레이했습니다.\n\n특히 테라포밍 마스 5인 플레이가 정말 치열했어요!\n다음 모임도 기대됩니다 :)",
      author: "김미플",
      password: "1234",
      tag: "보드게임",
    },
    {
      category: "reviews",
      title: "한강 피크닉 모임 후기",
      content: "날씨가 좋아서 한강에서 야외 보드게임을 즐겼습니다!\n\n도블, 할리갈리, 러브레터 등 가벼운 게임 위주로 했어요.\n바람이 좀 불어서 카드가 날아갈 뻔했지만 재밌었습니다 ㅋㅋ",
      author: "박보드",
      password: "1234",
      tag: "외부활동",
    },
    {
      category: "introductions",
      title: "안녕하세요! 새로 가입한 이미플입니다",
      content: "안녕하세요! 보드게임 좋아하는 이미플입니다.\n\n좋아하는 게임: 스플렌더, 아줄, 패치워크\n보드게임 경력: 3년\n\n잘 부탁드립니다!",
      author: "이미플",
      password: "1234",
    },
    {
      category: "chat",
      title: "이번 주 추천 게임 있나요?",
      content: "4인 기준으로 1시간 내로 끝나는 전략 게임 추천해주세요!\n\n너무 어렵지 않은 걸로요 ㅎㅎ",
      author: "게임초보",
      password: "1234",
    },
    {
      category: "tournaments",
      title: "제1회 미플즈 스플렌더 대회 결과",
      content: "🥇 1위: 김미플 (45점)\n🥈 2위: 박보드 (38점)\n🥉 3위: 이미플 (35점)\n\n참가자 모두 수고하셨습니다!\n다음 대회는 카탄으로 진행할 예정입니다.",
      author: "운영진",
      password: "admin",
    },
    {
      category: "events",
      title: "8월 보드게임 페스티벌 같이 갈 사람!",
      content: "8월 15일에 코엑스에서 열리는 보드게임 페스티벌 같이 갈 분 모집합니다!\n\n단체 할인 가능하니 관심 있으신 분은 댓글 남겨주세요.",
      author: "박보드",
      password: "1234",
    },
  ];

  const posts = seeds.map((seed, i) => ({
    ...seed,
    id: generateId() + i,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
    viewCount: Math.floor(Math.random() * 50),
    comments: [],
  }));

  savePosts(posts as Post[]);
}
