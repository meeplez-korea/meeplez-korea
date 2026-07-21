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
  localStorage.removeItem(STORAGE_KEY);

  const seeds: Omit<Post, "id" | "createdAt" | "updatedAt" | "viewCount" | "comments">[] = [
    // 공지사항
    {
      category: "notices",
      title: "미플즈 2026년 하반기 정기모임 안내",
      content: "안녕하세요! 미플즈 운영진입니다.\n\n2026년 하반기 정기모임은 매주 토요일 오후 2시에 진행됩니다.\n장소: 강남역 보드게임카페\n\n많은 참여 부탁드립니다!",
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
      category: "notices",
      title: "7월 회비 납부 안내",
      content: "7월 회비 납부 기간입니다.\n\n금액: 월 10,000원\n납부 기한: 7월 15일까지\n계좌: 카카오뱅크 3333-00-1234567 (미플즈)\n\n기한 내 납부 부탁드립니다!",
      author: "운영진",
      password: "admin",
    },
    {
      category: "notices",
      title: "모임 장소 변경 안내 (7월 넷째주)",
      content: "이번 주 토요일 모임 장소가 변경되었습니다.\n\n변경 전: 강남역 보드게임카페\n변경 후: 홍대 레드버튼 보드게임카페\n\n착오 없으시길 바랍니다!",
      author: "운영진",
      password: "admin",
    },
    {
      category: "notices",
      title: "여름 특별 이벤트 공지",
      content: "8월 한 달간 여름 특별 이벤트를 진행합니다!\n\n매주 모임 참석 시 스탬프 적립 → 4회 참석 시 간식 쿠폰 증정\n\n많은 참여 부탁드려요 :)",
      author: "운영진",
      password: "admin",
    },
    {
      category: "notices",
      title: "미플즈 공식 인스타그램 오픈",
      content: "미플즈 공식 인스타그램 계정이 오픈되었습니다!\n\n모임 사진, 보드게임 추천, 이벤트 소식을 올릴 예정이니 많이 팔로우해주세요.\n\n@meeplez_korea",
      author: "운영진",
      password: "admin",
    },
    // 모임 후기
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
      category: "reviews",
      title: "6월 마지막 모임 후기 - 카탄의 밤",
      content: "카탄만 3판 연속으로 했습니다 ㅋㅋ\n\n양 독점한 사람이 결국 우승! 자원 협상이 진짜 치열했어요.\n다음엔 카탄 확장판도 해보고 싶네요.",
      author: "이미플",
      password: "1234",
      tag: "보드게임",
    },
    {
      category: "reviews",
      title: "북한산 등산 + 보드게임 후기",
      content: "등산하고 내려와서 근처 카페에서 보드게임 했어요.\n\n운동 후에 하니까 집중력이 더 좋아진 느낌? ㅋㅋ\n코드네임, 텔레스트레이션 하면서 배 빠지게 웃었습니다.",
      author: "최등산",
      password: "1234",
      tag: "외부활동",
    },
    {
      category: "reviews",
      title: "윙스팬 첫 플레이 후기",
      content: "윙스팬 처음 해봤는데 새 그림이 너무 예뻐서 감동...\n\n룰 배우는 데 시간이 좀 걸렸지만 한번 이해하니까 빠져들었어요.\n새 카드 조합 찾는 재미가 쏠쏠합니다!",
      author: "새덕후",
      password: "1234",
      tag: "보드게임",
    },
    {
      category: "reviews",
      title: "6월 셋째주 정기모임 후기",
      content: "이번 주는 참석자가 12명이나!\n\n3테이블로 나눠서 각각 글룸헤이븐, 브라스, 아줄 진행했습니다.\n대규모 모임이라 더 재밌었어요.",
      author: "김미플",
      password: "1234",
      tag: "보드게임",
    },
    {
      category: "reviews",
      title: "방탈출 + 보드게임 번개 후기",
      content: "홍대 방탈출 하고 바로 옆 보드게임카페 갔어요.\n\n방탈출 팀워크가 보드게임에서도 이어져서 협동 게임 연승!\n팬데믹 레거시 시즌1 시작했습니다.",
      author: "박보드",
      password: "1234",
      tag: "외부활동",
    },
    {
      category: "reviews",
      title: "스플렌더 연습 모임 후기",
      content: "대회 대비 스플렌더 연습 모임을 가졌습니다.\n\n다들 실력이 많이 늘어서 10턴 내 15점 달성하는 분도!\n대회가 기대됩니다.",
      author: "이미플",
      password: "1234",
      tag: "보드게임",
    },
    {
      category: "reviews",
      title: "제주도 워크샵 후기",
      content: "미플즈 첫 워크샵을 제주도에서 다녀왔습니다!\n\n낮에는 관광, 밤에는 보드게임 올나잇.\n숙소에서 루미큐브 토너먼트한 게 하이라이트였어요 ㅋㅋ",
      author: "최등산",
      password: "1234",
      tag: "외부활동",
    },
    {
      category: "reviews",
      title: "7월 둘째주 정기모임 후기",
      content: "버건디의 성, 푸에르토 리코, 패치워크를 했습니다.\n\n버건디의 성 2시간 넘게 걸렸는데 체감은 30분이었어요.\n역시 명작은 다릅니다!",
      author: "김미플",
      password: "1234",
      tag: "보드게임",
    },
    {
      category: "reviews",
      title: "캠핑 보드게임 모임 후기",
      content: "가평 캠핑장에서 1박 2일 보드게임 캠핑!\n\n바베큐 구우면서 러브레터, 뱅! 하니까 분위기 최고.\n밤에 랜턴 켜놓고 한 마피아 게임은 잊을 수 없네요.",
      author: "박보드",
      password: "1234",
      tag: "외부활동",
    },
    {
      category: "reviews",
      title: "테라포밍 마스 풀확장 후기",
      content: "드디어 테라포밍 마스 전 확장을 다 넣고 플레이!\n\n프렐류드 + 콜로니 + 비너스 넥스트까지.\n4시간 걸렸지만 역대급으로 재밌었어요. 화성 완전 정복!",
      author: "새덕후",
      password: "1234",
      tag: "보드게임",
    },
    // 기타
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
