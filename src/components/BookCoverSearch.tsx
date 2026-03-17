'use client';

import { useState } from 'react';
import { Search, BookOpen } from 'lucide-react';

export interface BookSearchResult {
  title: string;
  author: string;
  coverUrl: string;
  coverId: number;
}

interface BookCoverSearchProps {
  bookTitle: string;
  author: string;
  onSelect: (coverUrl: string) => void;
  currentCoverUrl?: string;
  disabled?: boolean;
}

export function BookCoverSearch({
  bookTitle,
  author,
  onSelect,
  currentCoverUrl,
  disabled,
}: BookCoverSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchQuery = query.trim() || [bookTitle, author].filter(Boolean).join(' ');

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setError('책 제목 또는 저자를 2자 이상 입력한 뒤 검색해 주세요.');
      return;
    }
    setError(null);
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(`/api/search-book?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '검색에 실패했어요.');
        return;
      }
      setResults(data.results ?? []);
      if (!data.results?.length) {
        setError('검색 결과가 없어요. 제목·저자를 바꿔 보거나, 아래에 이미지 주소를 직접 입력해 주세요.');
      }
    } catch {
      setError('검색 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-cover-search">
      <div className="form-label">표지 검색</div>
      <p className="book-cover-search-hint">
        책 제목·저자로 표지를 찾아 자동으로 넣을 수 있어요. (알라딘 검색 우선, 미설정 시 Open Library)
      </p>
      <div className="book-cover-search-row">
        <input
          type="text"
          className="form-input"
          placeholder={bookTitle || author ? `비우면 「${[bookTitle, author].filter(Boolean).join(' ')}」로 검색` : '예: 채식주의자 한강'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          disabled={disabled}
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={loading || disabled}
        >
          {loading ? '검색 중…' : <><Search size={16} /> 검색</>}
        </button>
      </div>

      {error && <p className="book-cover-search-error">{error}</p>}

      {results.length > 0 && (
        <div className="book-cover-results">
          <span className="book-cover-results-label">결과에서 선택</span>
          <div className="book-cover-results-grid">
            {results.map((r) => (
              <button
                key={r.coverId}
                type="button"
                className="book-cover-result-card"
                onClick={() => onSelect(r.coverUrl)}
              >
                <div className="book-cover-result-thumb">
                  <img src={r.coverUrl} alt="" />
                </div>
                <span className="book-cover-result-title">{r.title}</span>
                {r.author && <span className="book-cover-result-author">{r.author}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentCoverUrl && (
        <div className="book-cover-current">
          <BookOpen size={14} />
          <span>선택된 표지가 있습니다. 바꾸려면 위에서 다시 선택하거나 URL을 수정하세요.</span>
        </div>
      )}
    </div>
  );
}
