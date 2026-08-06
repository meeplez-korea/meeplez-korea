"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { searchPosts } from "@/lib/storage";
import { Post } from "@/lib/types";
import { formatDate, truncate, stripHtml } from "@/lib/utils";
import { getCategoryBySlug } from "@/lib/categories";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Post[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const data = await searchPosts(query);
      setResults(data);
      setSearched(true);
      setLoading(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Search input */}
      <div className="relative mb-10 animate-fade-in">
        <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색..."
          className="w-full pl-8 pr-8 py-3 bg-transparent text-lg font-medium tracking-tight border-0 border-b-2 border-gray-200 dark:border-dark-border focus:border-primary dark:focus:border-primary focus:outline-none focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-colors"
        />
        {query && !loading && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {loading && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Initial state */}
      {!searched && !query && (
        <div className="py-16 text-center animate-fade-in">
          <p className="text-sm text-gray-400">게시글 제목이나 내용으로 검색할 수 있습니다.</p>
        </div>
      )}

      {/* No results */}
      {searched && !loading && results.length === 0 && (
        <div className="py-16 text-center animate-fade-in">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &ldquo;{query}&rdquo;에 대한 검색 결과가 없습니다.
          </p>
          <p className="text-xs text-gray-400 mt-1.5">다른 키워드로 다시 시도해보세요.</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          <p className="text-xs text-gray-400 mb-4 font-medium tabular-nums">{results.length}개의 결과</p>
          <div className="space-y-2 animate-fade-in">
            {results.map((post) => {
              const cat = getCategoryBySlug(post.category);
              return (
                <Link
                  key={post.id}
                  href={`/board/${post.category}/${post.id}`}
                  className="block bg-white dark:bg-dark-card rounded-xl px-5 py-4 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-dark-hover hover:-translate-y-px transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{post.title}</h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{truncate(stripHtml(post.content), 80)}</p>
                    </div>
                    {cat && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-dark-hover text-gray-500 dark:text-gray-400 font-medium shrink-0 mt-0.5">
                        {cat.icon} {cat.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2.5 text-[11px] text-gray-400">
                    <span className="font-medium">{post.author_name}</span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span className="tabular-nums">{formatDate(post.created_at)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
