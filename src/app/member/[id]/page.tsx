'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMember } from '@/context/MemberContext';
import { useData } from '@/context/DataContext';
import type { Member } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import AppShell from '@/components/AppShell';
import { ProfileCard } from '@/components/ProfileCard';
import { BookOpen, ArrowLeft } from 'lucide-react';

export default function MemberProfilePage() {
    const params = useParams();
    const router = useRouter();
    const memberId = params.id as string;
    const { currentMemberId } = useMember();
    const { members, meetings, loading, error } = useData();

    const member = members.find((m) => m.id === memberId) ?? null;
    const isMe = currentMemberId === memberId;

    useEffect(() => {
        if (!currentMemberId) {
            router.replace('/');
        }
    }, [currentMemberId, router]);

    if (!currentMemberId) return null;

    if (loading) return <AppShell><div className="spinner">불러오는 중…</div></AppShell>;
    if (error) return <AppShell><div className="empty">{error}</div></AppShell>;
    if (!member) {
        return (
            <AppShell>
                <div className="empty">
                    <div className="empty-text">멤버를 찾을 수 없어요</div>
                    <Link href="/presenters" className="btn btn-ghost" style={{ marginTop: 16 }}>멤버 목록으로</Link>
                </div>
            </AppShell>
        );
    }

    const presentedMeetings = meetings
        .filter((m) => m.presenterMemberId === memberId)
        .sort((a, b) => b.date - a.date);

    return (
        <AppShell>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
                    <ArrowLeft size={20} /> 뒤로
                </button>
                {isMe && (
                    <Link href="/mypage" className="btn btn-primary btn-sm">
                        마이페이지에서 수정
                    </Link>
                )}
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
                <ProfileCard member={member} size="lg" />
            </div>

            <div className="section-title">{member.name}님이 발제한 모임</div>
            {presentedMeetings.length === 0 ? (
                <div className="card">
                    <div className="empty">
                        <BookOpen size={40} color="var(--border)" style={{ marginBottom: 16 }} />
                        <div className="empty-text">아직 발제한 모임이 없어요</div>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    <ul className="presented-list">
                        {presentedMeetings.map((m) => (
                            <li key={m.id}>
                                <Link href={`/meeting/${m.id}`} className="presented-list-item">
                                    <span className="presented-list-book">{m.book || '책 미정'}</span>
                                    <span className="presented-list-meta">
                                        {formatDate(m.date, 'short')} · {m.status === 'done' ? '완료' : '예정'}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </AppShell>
    );
}
