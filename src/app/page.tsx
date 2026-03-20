'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMember } from '@/context/MemberContext';
import { useData } from '@/context/DataContext';
import { Member } from '@/lib/types';
import { BookOpen, Edit3 } from 'lucide-react';

export default function SelectMemberPage() {
  const { currentMemberId, setCurrentMemberId } = useMember();
  const { members, loading } = useData();
  const router = useRouter();

  useEffect(() => {
    if (currentMemberId) {
      router.replace('/home');
    }
  }, [currentMemberId, router]);

  // 멤버 선택 → 홈으로
  const handleSelect = (member: Member) => {
    setCurrentMemberId(member.id);
    router.push('/home');
  };

  if (loading) {
    return (
      <div className="member-select-page">
        <div className="spinner">불러오는 중…</div>
      </div>
    );
  }

  // ── 멤버 선택 화면 ──
  return (
    <div className="member-select-page">
      <div className="member-select-logo"><BookOpen size={48} color="var(--primary)" /></div>
      <h1 className="member-select-title">천북인권</h1>
      <p className="member-select-sub">나는 누구?</p>

      {members.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: '0.9rem' }}>
          <p>등록된 멤버가 없어요.</p>
          <p style={{ marginTop: 8 }}>관리자에게 멤버 추가를 요청해 주세요.</p>
        </div>
      ) : (
        <div className="member-grid">
          {members.map((m) => (
            <button key={m.id} className="member-btn" onClick={() => handleSelect(m)}>
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
