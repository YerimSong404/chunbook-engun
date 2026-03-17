import { Member } from './types';

/**
 * 날짜 포맷 (ko-KR 기준)
 * - full: 연월일 + 요일 (예: 2025년 3월 17일 월)
 * - dateOnly: 연월일 (예: 2025년 3월 17일)
 * - short: 월일 (예: 3월 17일)
 */
export function formatDate(
  ts: number,
  format: 'full' | 'dateOnly' | 'short' = 'full'
): string {
  const d = new Date(ts);
  if (format === 'short') {
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }
  if (format === 'dateOnly') {
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

/**
 * 멤버 ID로 이름 찾기. 없으면 fallback 반환.
 */
export function getMemberName(
  members: Member[],
  id: string,
  fallback = '미정'
): string {
  return members.find((m) => m.id === id)?.name ?? fallback;
}
