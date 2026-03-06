'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMember } from '@/context/MemberContext';
import { getMeetings, getMembers } from '@/lib/db';
import { Meeting, Member } from '@/lib/types';
import AppShell from '@/components/AppShell';

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
            <h1 className="page-title">모임 정보</h1>

            {next ? (
                <div className="meeting-hero">
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
                            <div className="meeting-hero-book">『{next.book}』</div>
                            <div className="meeting-hero-author">{next.author}</div>
                            <div className="meeting-hero-meta">
                                <span className="meeting-hero-chip">📅 {formatDate(next.date)}</span>
                                <span className="meeting-hero-chip">🎤 발제자: {getMemberName(next.presenterMemberId)}</span>
                            </div>
                        </div>
                    </div>

                    {next.topics.length > 0 && (
                        <>
                            <div style={{ marginTop: 20, fontWeight: 600, fontSize: '0.85rem', opacity: 0.85 }}>
                                발제 주제
                            </div>
                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {next.topics.map((t, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 10, fontSize: '0.88rem' }}>
                                        <span style={{
                                            flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.25)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.75rem', fontWeight: 700
                                        }}>{i + 1}</span>
                                        <span style={{ opacity: 0.92, lineHeight: 1.45 }}>{t}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="empty">
                        <div className="empty-icon">📅</div>
                        <div className="empty-text">예정된 모임이 없어요</div>
                    </div>
                </div>
            )}

            {upcoming.length > 1 && (
                <div style={{ marginBottom: 20 }}>
                    <div className="section-title">예정된 모임</div>
                    {upcoming.slice(1).map((m) => (
                        <div className="card" key={m.id} style={{ marginBottom: 10 }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>『{m.book}』</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)' }}>
                                {formatDate(m.date)} · 발제자 {getMemberName(m.presenterMemberId)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {past.length > 0 && (
                <div>
                    <div className="section-title">지난 모임</div>
                    {past.map((m) => (
                        <div className="card" key={m.id} style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        {m.meetingNumber != null && (
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 700,
                                                background: 'var(--surface-alt)', color: 'var(--text-sub)',
                                                borderRadius: 100, padding: '1px 7px', flexShrink: 0,
                                            }}>제{m.meetingNumber}회</span>
                                        )}
                                        <span style={{ fontWeight: 600 }}>『{m.book}』</span>
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)' }}>
                                        {formatDate(m.date)} · 발제자 {getMemberName(m.presenterMemberId)}
                                    </div>
                                    {m.absentMemberIds && m.absentMemberIds.length > 0 && (
                                        <div style={{ fontSize: '0.78rem', marginTop: 4, color: 'var(--accent)' }}>
                                            불참: {m.absentMemberIds.map(id => members.find(mb => mb.id === id)?.name).filter(Boolean).join(', ')}
                                        </div>
                                    )}
                                </div>
                                <span className="badge badge-gray">완료</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AppShell>
    );
}
