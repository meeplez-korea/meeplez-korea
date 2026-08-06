export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200/50 dark:border-dark-border">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/meeplez.jpg" alt="" className="w-6 h-6 rounded-md object-cover opacity-60" />
            <span className="text-sm font-medium text-gray-400 dark:text-gray-500">&copy; 2026 미플즈 (Meeplez)</span>
          </div>
          <a
            href="https://open.kakao.com/o/gBomGhqi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-primary"
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.44 4.08 3.62 5.17-.16.56-.57 2.03-.66 2.35-.1.39.14.39.3.28.13-.08 2.01-1.36 2.82-1.91.6.09 1.23.13 1.87.13 4.42 0 8-2.79 8-6.23C17 3.79 13.42 1 9 1z" fill="currentColor"/>
            </svg>
            오픈채팅
          </a>
        </div>
      </div>
    </footer>
  );
}
