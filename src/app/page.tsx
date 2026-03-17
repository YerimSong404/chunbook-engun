'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMember } from '@/context/MemberContext';
import { useData } from '@/context/DataContext';
import { Member } from '@/lib/types';
import { BookOpen, Edit3 } from 'lucide-react';

export default function SelectMemberPage() {
  const { currentMemberId, setCurrentMemberId, nickname, setNickname } = useMember();
  const { members, loading } = useData();
  const router = useRouter();

  // 별명 입력 단계
  const [step, setStep] = useState<'select' | 'nickname'>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');

  useEffect(() => {
    if (currentMemberId) {
      router.replace('/home');
    }
  }, [currentMemberId, router]);

  // 멤버 선택 → 별명 입력 단계로
  const handleSelect = (member: Member) => {
    setSelectedId(member.id);
    setSelectedName(member.name);
    setNicknameInput('');
    setStep('nickname');
  };

  // 별명 확정 or 건너뛰기 → 홈으로
  const handleConfirm = (nick?: string) => {
    if (!selectedId) return;
    setCurrentMemberId(selectedId);
    setNickname(nick?.trim() || null);
    router.push('/home');
  };

  if (loading) {
    return (
      <div className="member-select-page">
        <div className="spinner">불러오는 중…</div>
      </div>
    );
  }

  // ── 별명 입력 화면 ──
  if (step === 'nickname') {
    return (
      <div className="member-select-page">
        <div className="member-select-logo"><Edit3 size={48} color="var(--primary)" /></div>
        <h1 className="member-select-title" style={{ fontSize: '1.1rem', marginBottom: 6 }}>
          반가워요, <span style={{ color: 'var(--primary)' }}>{selectedName}</span>님!
        </h1>
        <p className="member-select-sub">앱에서 쓸 별명을 설정할 수 있어요</p>

        <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            className="form-input"
            placeholder={`예: ${selectedName.slice(0, 1)}발제왕, 책읽는${selectedName.slice(-1)}`}
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm(nicknameInput)}
            autoFocus
            maxLength={12}
          />
          <button
            className="btn btn-primary btn-lg"
            onClick={() => handleConfirm(nicknameInput)}
            disabled={!nicknameInput.trim()}
          >
            별명으로 시작하기
          </button>
          <button
            className="btn btn-ghost btn-lg"
            style={{ opacity: 0.7 }}
            onClick={() => handleConfirm()}
          >
            건너뛰기 ({selectedName}으로 표시)
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ alignSelf: 'center', marginTop: 4 }}
            onClick={() => setStep('select')}
          >
            ← 다시 선택
          </button>
        </div>
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
