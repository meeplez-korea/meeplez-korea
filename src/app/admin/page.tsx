"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAdmin, setAdmin, getPosts } from "@/lib/storage";
import { ADMIN_PASSWORD } from "@/lib/constants";
import { Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [suggestions, setSuggestions] = useState<Post[]>([]);

  useEffect(() => {
    const adminStatus = isAdmin();
    setLoggedIn(adminStatus);
    if (adminStatus) {
      setSuggestions(getPosts("suggestions"));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAdmin(true);
      setLoggedIn(true);
      setSuggestions(getPosts("suggestions"));
    } else {
      alert("비밀번호가 일치하지 않습니다.");
    }
  };

  const handleLogout = () => {
    setAdmin(false);
    setLoggedIn(false);
    setSuggestions([]);
  };

  if (!loggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-xl font-bold mb-2 text-center">관리자 로그인</h1>
          <p className="text-sm text-gray-400 text-center mb-6">운영진 전용 페이지입니다</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm"
              placeholder="관리자 비밀번호"
            />
            <button
              type="submit"
              className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">관리자 페이지</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          로그아웃
        </button>
      </div>

      {/* Suggestions */}
      <section>
        <h2 className="text-lg font-bold mb-4">건의사항 ({suggestions.length}건)</h2>
        {suggestions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">
            건의사항이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((post) => (
              <Link
                key={post.id}
                href={`/board/suggestions/${post.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-sm">{post.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {post.author} | {formatDate(post.createdAt)}
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">
                    댓글 {post.comments.length}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{post.content}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
