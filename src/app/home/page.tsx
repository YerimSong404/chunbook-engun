'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMember } from '@/context/MemberContext';
import { getMeetings, getMembers } from '@/lib/db';
import { Meeting, Member } from '@/lib/types';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Calendar, Mic, Plus, BookOpen } from 'lucide-react';

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 className="page-title" style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text)', letterSpacing: '-0.5px' }}>다가오는 모임</h1>
                <Link href="/meeting/new" style={{ 
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'var(--primary)', color: '#FFF', 
                    padding: '10px 16px', borderRadius: 8, 
                    fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none' 
                }}>
                    <Plus size={16} /> 새 모임
                </Link>
            </div>

            {next ? (
                <Link href={`/meeting/${next.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div className="card" style={{ 
                        padding: 0, overflow: 'hidden', cursor: 'pointer', 
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease', 
                        border: 'none', borderRadius: 8,
                        boxShadow: 'var(--shadow-lg)' 
                    }} onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 16px 40px rgba(58, 49, 37, 0.15)';
                    }} onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}>
                        {/* Gradient Header Area */}
                        <div style={{ background: 'linear-gradient(135deg, #EBE5D9 0%, #E2D9C8 100%)', padding: '28px 24px 32px', position: 'relative' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: 8, letterSpacing: '0.5px' }}>
                                {next.meetingNumber != null ? `제${next.meetingNumber}회 독서모임` : '다음 모임'}
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', marginBottom: 0, wordBreak: 'keep-all', paddingRight: '100px', lineHeight: 1.4, letterSpacing: '-0.5px' }}>
                                『{next.book}』
                            </div>
                        </div>

                        {/* Content Area with overlapping cover */}
                        <div style={{ padding: '32px 24px 28px', position: 'relative', background: 'var(--surface)' }}>
                            {next.coverImageUrl && (
                                <div style={{
                                    position: 'absolute', top: -70, right: 24,
                                    width: 90, height: 130, borderRadius: 8, overflow: 'hidden',
                                    boxShadow: '0 8px 20px rgba(58, 49, 37, 0.15)',
                                    background: '#FAFAFA'
                                }}>
                                    <img
                                        src={next.coverImageUrl}
                                        alt={next.book}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                                    />
                                </div>
                            )}

                            <div style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 500, marginBottom: 20 }}>
                                {next.author}
                            </div>

                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ 
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    background: 'var(--surface-alt)', color: 'var(--text-sub)', 
                                    borderRadius: 8, padding: '8px 14px', fontSize: '0.85rem', fontWeight: 500 
                                }}>
                                    <Calendar size={14} /> {formatDate(next.date)}
                                </span>
                                <span style={{ 
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    background: 'var(--primary-light)', color: '#695D4A', 
                                    borderRadius: 8, padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600 
                                }}>
                                    <Mic size={14} /> {getMemberName(next.presenterMemberId)} 발제
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            ) : (
                <div style={{ 
                    padding: '48px 20px', textAlign: 'center', 
                    background: 'var(--surface)', borderRadius: 8, 
                    border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                    <BookOpen size={48} color="var(--border)" style={{ marginBottom: 16 }} />
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>예정된 모임이 없어요</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>새로운 독서 모임을 기획해 보세요.</div>
                </div>
            )}
        </AppShell>
    );
}
