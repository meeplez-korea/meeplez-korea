const BASELINE_KEY = "meeplez_read_baseline";
const READ_KEY = "meeplez_read_posts";

export function initReadBaseline(): string {
  let baseline = localStorage.getItem(BASELINE_KEY);
  if (!baseline) {
    baseline = new Date().toISOString();
    localStorage.setItem(BASELINE_KEY, baseline);
  }
  return baseline;
}

export function getReadPostIds(): Set<string> {
  const raw = localStorage.getItem(READ_KEY);
  return new Set(raw ? JSON.parse(raw) : []);
}

export function markPostRead(postId: string): void {
  const raw = localStorage.getItem(READ_KEY);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  if (!ids.includes(postId)) {
    ids.push(postId);
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
  }
}
