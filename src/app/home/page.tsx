'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMember } from '@/context/MemberContext';
import { getMeetings, getMembers } from '@/lib/db';
import { Meeting, Member } from '@/lib/types';
import AppShell from '@/components/AppShell';
import Link from 'next/link';

function formatDate(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

export default function HomePage() {
    const { currentMemberId } = useMember();
    const router = useRouter();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentMemberId) {
            setLoading(false);
            router.replace('/');
            return;
        }
        Promise.all([getMeetings(), getMembers()])
            .then(([m, mb]) => { setMeetings(m); setMembers(mb); })
            .finally(() => setLoading(false));
    }, [currentMemberId, router]);

    if (loading) return <AppShell><div className="spinner">불러오는 중…</div></AppShell>;

    const now = Date.now();
    const upcoming = meetings.filter((m) => m.status === 'upcoming').sort((a, b) => a.date - b.date);
    const past = meetings.filter((m) => m.status === 'done').sort((a, b) => b.date - a.date);
    const next = upcoming[0] ?? null;

    const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? '미정';

    return (
        <AppShell>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 className="page-title" style={{ margin: 0 }}>모임 정보</h1>
                <Link href="/meeting/new" className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>
                    + 새 독서모임
                </Link>
            </div>

            {next ? (
                <Link href={`/meeting/${next.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div className="meeting-hero" style={{ cursor: 'pointer', transition: 'transform 0.1s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.01)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                        <div className="meeting-hero-label">
                            {next.meetingNumber != null ? `제${next.meetingNumber}회 모임` : '다음 모임'}
                        </div>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            {next.coverImageUrl && (
                                <div style={{
                                    flexShrink: 0, width: 72, height: 100,
                                    borderRadius: 8, overflow: 'hidden',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                                }}>
                                    <img
                                        src={next.coverImageUrl}
                                        alt={next.book}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                                    />
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div className="meeting-hero-book" style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>『{next.book}』</div>
                                <div className="meeting-hero-author" style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>{next.author}</div>
                                <div className="meeting-hero-meta" style={{ marginTop: '0.8rem' }}>
                                    <span className="meeting-hero-chip">📅 {formatDate(next.date)}</span>
                                    <span className="meeting-hero-chip">🎤 발제자: {getMemberName(next.presenterMemberId)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>
            ) : (
                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="empty">
                        <div className="empty-icon">📅</div>
                        <div className="empty-text">예정된 모임이 없어요</div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
