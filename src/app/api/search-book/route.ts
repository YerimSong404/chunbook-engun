import { NextRequest, NextResponse } from 'next/server';

const LIMIT = 8;

/**
 * 책 제목/저자로 표지 검색
 * - 알라딘 검색 API 우선 (한국 도서, API 키 필요: ALADIN_TTB_KEY)
 * - 없으면 Open Library 사용 (해외 도서, API 키 불필요)
 * GET /api/search-book?q=채식주의자+한강
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: '검색어를 2자 이상 입력해 주세요.' },
      { status: 400 }
    );
  }

  const ttbKey = process.env.ALADIN_TTB_KEY;

  // 1) 알라딘 책 검색 (한국 도서)
  if (ttbKey) {
    try {
      const aladinUrl = new URL('http://www.aladin.co.kr/ttb/api/ItemSearch.aspx');
      aladinUrl.searchParams.set('ttbkey', ttbKey);
      aladinUrl.searchParams.set('Query', q);
      aladinUrl.searchParams.set('QueryType', 'Keyword'); // 제목+저자 통합 검색
      aladinUrl.searchParams.set('MaxResults', String(LIMIT));
      aladinUrl.searchParams.set('Start', '1');
      aladinUrl.searchParams.set('SearchTarget', 'Book');
      aladinUrl.searchParams.set('Cover', 'Big');
      aladinUrl.searchParams.set('output', 'js');
      aladinUrl.searchParams.set('Version', '20131101');

      const res = await fetch(aladinUrl.toString(), {
        next: { revalidate: 3600 },
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        const raw = await res.text();
        const jsonStr = raw.replace(/;\s*$/, '').trim();
        const data = JSON.parse(jsonStr) as {
          item?: Array<{
            title?: string;
            author?: string;
            cover?: string;
            isbn13?: string;
          }>;
        };
        const items = data.item ?? [];
        if (items.length > 0) {
          const results = items
            .filter((item) => item.cover)
            .slice(0, LIMIT)
            .map((item, i) => ({
              title: item.title ?? '제목 없음',
              author: item.author ?? '',
              coverUrl: item.cover!,
              coverId: i,
            }));
          return NextResponse.json({ results, source: 'aladin' });
        }
      }
    } catch (e) {
      console.error('Aladin book search:', e);
      // 알라딘 실패 시 Open Library로 이어감
    }
  }

  // 2) Open Library (해외 도서, API 키 불필요)
  try {
    const url = new URL('https://openlibrary.org/search.json');
    url.searchParams.set('q', q);
    url.searchParams.set('limit', String(LIMIT));
    url.searchParams.set('fields', 'title,author_name,cover_i,isbn');

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Open Library API error: ${res.status}`);
    }

    const data = (await res.json()) as {
      docs?: Array<{
        title?: string;
        author_name?: string[];
        cover_i?: number;
        isbn?: string[];
      }>;
    };

    const docs = data.docs ?? [];
    const results = docs
      .filter((doc) => doc.cover_i != null)
      .slice(0, LIMIT)
      .map((doc) => ({
        title: doc.title ?? '제목 없음',
        author: Array.isArray(doc.author_name) ? doc.author_name[0] : '',
        coverUrl: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
        coverId: doc.cover_i,
      }));

    return NextResponse.json({ results, source: 'openlibrary' });
  } catch (e) {
    console.error('search-book API:', e);
    return NextResponse.json(
      { error: '검색 중 오류가 발생했어요. 나중에 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}
