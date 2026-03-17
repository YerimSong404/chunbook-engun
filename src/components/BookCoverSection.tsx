'use client';

import { useState, useRef } from 'react';
import { ChevronDown, Search, Upload, ImageIcon } from 'lucide-react';
import { BookCoverSearch } from './BookCoverSearch';
import { compressImageToDataUrl } from '@/lib/image';

type CoverMode = 'search' | 'upload';

interface BookCoverSectionProps {
  bookTitle: string;
  author: string;
  coverImageUrl: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function BookCoverSection({
  bookTitle,
  author,
  coverImageUrl,
  onChange,
  disabled,
}: BookCoverSectionProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CoverMode>('search');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCover = Boolean(coverImageUrl?.trim());

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setUploadError(null);
    if (!file || !file.type.startsWith('image/')) {
      setUploadError('이미지 파일을 선택해 주세요.');
      return;
    }
    try {
      const dataUrl = await compressImageToDataUrl(file);
      onChange(dataUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '이미지 처리에 실패했어요.');
    }
  };

  return (
    <div className="book-cover-section">
      <button
        type="button"
        className="book-cover-section-header"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className="book-cover-section-title">
          <ImageIcon size={18} />
          책 표지 <span className="muted">(선택)</span>
        </span>
        <span className="book-cover-section-preview">
          {hasCover && (
            <div className="cover-preview-thumb inline">
              <img src={coverImageUrl} alt="" onError={(ev) => (ev.currentTarget.parentElement!.style.display = 'none')} />
            </div>
          )}
          <ChevronDown size={20} className={open ? 'rotated' : ''} />
        </span>
      </button>

      {open && (
        <div className="book-cover-section-body">
          <div className="book-cover-mode-tabs">
            <button
              type="button"
              className={mode === 'search' ? 'active' : ''}
              onClick={() => setMode('search')}
            >
              <Search size={16} /> 검색으로 찾기
            </button>
            <button
              type="button"
              className={mode === 'upload' ? 'active' : ''}
              onClick={() => setMode('upload')}
            >
              <Upload size={16} /> 갤러리에서 선택
            </button>
          </div>

          {mode === 'search' && (
            <>
              <BookCoverSearch
                bookTitle={bookTitle}
                author={author}
                onSelect={onChange}
                currentCoverUrl={hasCover ? coverImageUrl : undefined}
                disabled={disabled}
              />
              <div className="book-cover-url-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="또는 이미지 URL 직접 입력 (알라딘·예스24 등)"
                  value={coverImageUrl}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={disabled}
                />
                {hasCover && (
                  <div className="cover-preview-thumb">
                    <img src={coverImageUrl} alt="" onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')} />
                  </div>
                )}
              </div>
            </>
          )}

          {mode === 'upload' && (
            <div className="book-cover-upload">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="book-cover-file-input"
                onChange={handleFileChange}
                disabled={disabled}
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <Upload size={18} /> 사진 선택 (갤러리·카메라)
              </button>
              {uploadError && <p className="book-cover-search-error">{uploadError}</p>}
              {hasCover && (
                <div className="cover-preview-thumb" style={{ marginTop: 12 }}>
                  <img src={coverImageUrl} alt="" onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
