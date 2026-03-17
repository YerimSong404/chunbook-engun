'use client';

import { useMember } from '@/context/MemberContext';
import { useData } from '@/context/DataContext';

/**
 * 현재 로그인한 멤버가 관리자 목록에 있는지 여부.
 * 관리자가 한 명도 없으면(adminMemberIds 비어 있음) 누구나 설정 접근 가능(첫 설정용).
 */
export function useIsAdmin(): boolean {
  const { currentMemberId } = useMember();
  const { settings } = useData();
  const adminIds = settings?.adminMemberIds ?? [];
  if (!currentMemberId) return false;
  if (adminIds.length === 0) return true; // 아직 관리자 미지정 시 누구나 접근 가능
  return adminIds.includes(currentMemberId);
}
