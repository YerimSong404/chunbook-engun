'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMember } from '@/context/MemberContext';
import { useData } from '@/context/DataContext';
import { useIsAdmin } from '@/lib/hooks';
import { formatDate, getMemberName } from '@/lib/utils';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Calendar, Mic, Plus, BookOpen } from 'lucide-react';

export default function HomePage() {
    const { currentMemberId } = useMember();
    const isAdmin = useIsAdmin();
    const { members, meetings, loading, error } = useData();
    const router = useRouter();

    useEffect(() => {
        if (!currentMemberId) {
            router.replace('/');
        }
    }, [currentMemberId, router]);

    if (loading) return <AppShell><div className="spinner">불러오는 중…</div></AppShell>;
    if (error) return <AppShell><div className="empty">{error}</div></AppShell>;

    const upcoming = meetings.filter((m) => m.status === 'upcoming').sort((a, b) => a.date - b.date);
    const next = upcoming[0] ?? null;

    return (
        <AppShell>
            <div className="page-header-row">
                <h1 className="page-title page-title-lg">다가오는 모임</h1>
                {isAdmin && (
                    <Link href="/meeting/new" className="btn btn-primary btn-new-meeting">
                        <Plus size={16} /> 새 모임
                    </Link>
                )}
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
                                {next.book ? `『${next.book}』` : '책·발제자 미정'}
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

                            {(next.book || next.author) && (
                            <div style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 500, marginBottom: 20 }}>
                                {next.author || '\u00A0'}
                            </div>
                            )}

                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ 
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    background: 'var(--surface-alt)', color: 'var(--text-sub)', 
                                    borderRadius: 8, padding: '8px 14px', fontSize: '0.85rem', fontWeight: 500 
                                }}>
                                    <Calendar size={14} /> {formatDate(next.date, 'full')}
                                </span>
                                <span style={{ 
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    background: 'var(--primary-light)', color: '#695D4A', 
                                    borderRadius: 8, padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600 
                                }}>
                                    <Mic size={14} /> {getMemberName(members, next.presenterMemberId)} 발제
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
