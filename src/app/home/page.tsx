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
                    <div className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s ease', boxShadow: 'var(--shadow-lg)' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                        {/* Gradient Header Area */}
                        <div style={{ background: 'linear-gradient(135deg, #FFDE59 0%, #FFB347 100%)', padding: '24px 20px', position: 'relative' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', opacity: 0.8, marginBottom: 4 }}>
                                {next.meetingNumber != null ? `제${next.meetingNumber}회 모임` : '다음 모임'}
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: 20, wordBreak: 'keep-all', paddingRight: '100px' }}>
                                『{next.book}』
                            </div>
                        </div>

                        {/* Content Area with overlapping cover */}
                        <div style={{ padding: '30px 20px 24px', position: 'relative', background: 'var(--surface)' }}>
                            {next.coverImageUrl && (
                                <div style={{
                                    position: 'absolute', top: -60, right: 20,
                                    width: 86, height: 124, borderRadius: 6, overflow: 'hidden',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.08)',
                                    background: '#fff'
                                }}>
                                    <img
                                        src={next.coverImageUrl}
                                        alt={next.book}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                                    />
                                </div>
                            )}

                            <div style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 600, marginBottom: 16 }}>
                                {next.author}
                            </div>

                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ background: 'var(--surface-alt)', color: 'var(--text-sub)', borderRadius: 100, padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600 }}>
                                    📅 {formatDate(next.date)}
                                </span>
                                <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 100, padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600 }}>
                                    🎤 {getMemberName(next.presenterMemberId)}
                                </span>
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
