const cache: Record<string, { data: any; timestamp: number }> = {};

const CACHE_DURATION = 60 * 1000; // 1분

export function getCached<T>(key: string): T | null {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    delete cache[key];
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: any): void {
  cache[key] = { data, timestamp: Date.now() };
}

export function clearCache(key?: string): void {
  if (key) {
    delete cache[key];
  } else {
    Object.keys(cache).forEach((k) => delete cache[k]);
  }
}
