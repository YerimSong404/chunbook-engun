'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMember } from '@/context/MemberContext';
import { getMeetings, getMembers } from '@/lib/db';
import { Meeting, Member } from '@/lib/types';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { Search } from 'lucide-react';

function formatDate(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

export default function PastMeetingsPage() {
    const { currentMemberId } = useMember();
    const router = useRouter();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    const [yearFilter, setYearFilter] = useState<string>('ALL');
    const [presenterFilter, setPresenterFilter] = useState<string>('ALL');
    const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!currentMemberId) {
            setLoading(false);
            router.replace('/');
            return;
        }
        Promise.all([getMeetings(), getMembers()])
            .then(([m, mb]) => { setMeetings(m.filter(m => m.status === 'done')); setMembers(mb); })
            .finally(() => setLoading(false));
    }, [currentMemberId, router]);

    const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? '미정';

    const years = useMemo(() => {
        const y = new Set<string>();
        meetings.forEach(m => y.add(new Date(m.date).getFullYear().toString()));
        return Array.from(y).sort((a, b) => Number(b) - Number(a));
    }, [meetings]);

    const filteredMeetings = useMemo(() => {
        let result = [...meetings];

        if (yearFilter !== 'ALL') {
            result = result.filter(m => new Date(m.date).getFullYear().toString() === yearFilter);
        }

        if (presenterFilter !== 'ALL') {
            result = result.filter(m => m.presenterMemberId === presenterFilter);
        }
        
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            result = result.filter(m => 
                m.book.toLowerCase().includes(term) || 
                (m.author && m.author.toLowerCase().includes(term)) ||
                m.topics.some(t => t.toLowerCase().includes(term))
            );
        }

        result.sort((a, b) => sortOrder === 'DESC' ? b.date - a.date : a.date - b.date);

        return result;
    }, [meetings, yearFilter, presenterFilter, sortOrder, searchTerm]);

    if (loading) return <AppShell><div className="spinner">불러오는 중…</div></AppShell>;

    return (
        <AppShell>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h1 className="page-title" style={{ margin: 0 }}>내서재</h1>
            </div>

            {/* Search Area */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={18} color="var(--text-sub)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                    type="text" 
                    placeholder="책 제목, 저자, 발제 주제 검색..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '14px 16px 14px 44px',
                        fontSize: '0.95rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)',
                        outline: 'none',
                        boxShadow: 'var(--shadow)',
                        fontFamily: 'var(--font)'
                    }}
                />
            </div>

            {/* Filters Area */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, marginBottom: 8, scrollbarWidth: 'none' }}>
                <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />

                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        style={{
                            appearance: 'none',
                            background: yearFilter === 'ALL' ? 'var(--surface)' : 'var(--primary)',
                            color: yearFilter === 'ALL' ? 'var(--text)' : '#fff',
                            border: `1px solid ${yearFilter === 'ALL' ? 'var(--border)' : 'var(--primary)'}`,
                            borderRadius: 8, padding: '8px 32px 8px 16px', fontSize: '0.85rem', fontWeight: 600,
                            cursor: 'pointer', boxShadow: 'var(--shadow)'
                        }}
                    >
                        <option value="ALL">전체 연도</option>
                        {years.map(y => <option key={y} value={y}>{y}년</option>)}
                    </select>
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: yearFilter === 'ALL' ? 'var(--text-sub)' : '#fff', fontSize: '0.7rem' }}>▼</span>
                </div>

                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <select
                        value={presenterFilter}
                        onChange={(e) => setPresenterFilter(e.target.value)}
                        style={{
                            appearance: 'none',
                            background: presenterFilter === 'ALL' ? 'var(--surface)' : 'var(--primary)',
                            color: presenterFilter === 'ALL' ? 'var(--text)' : '#fff',
                            border: `1px solid ${presenterFilter === 'ALL' ? 'var(--border)' : 'var(--primary)'}`,
                            borderRadius: 8, padding: '8px 32px 8px 16px', fontSize: '0.85rem', fontWeight: 600,
                            cursor: 'pointer', boxShadow: 'var(--shadow)'
                        }}
                    >
                        <option value="ALL">모든 발제자</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: presenterFilter === 'ALL' ? 'var(--text-sub)' : '#fff', fontSize: '0.7rem' }}>▼</span>
                </div>

                <div style={{ position: 'relative', flexShrink: 0, marginLeft: 'auto' }}>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'DESC' | 'ASC')}
                        style={{
                            appearance: 'none',
                            background: 'transparent',
                            color: 'var(--text-sub)',
                            border: 'none',
                            padding: '8px 24px 8px 8px', fontSize: '0.85rem', fontWeight: 600,
                            cursor: 'pointer', outline: 'none'
                        }}
                    >
                        <option value="DESC">최신순</option>
                        <option value="ASC">오래된순</option>
                    </select>
                    <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-sub)', fontSize: '0.7rem' }}>▼</span>
                </div>
            </div>

            {filteredMeetings.length === 0 ? (
                <div className="card" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
                    <div className="empty">
                        <div className="empty-text">조건에 맞는 모임이 없어요.</div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {filteredMeetings.map((m) => (
                        <Link key={m.id} href={`/meeting/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="card" style={{
                                cursor: 'pointer', transition: 'all 0.15s ease', padding: '20px',
                                border: '1px solid var(--border)', boxShadow: 'var(--shadow)', borderRadius: 'var(--radius)'
                            }} onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                    {/* Small Cover Image Preview (if any) */}
                                    <div style={{ width: 48, height: 68, borderRadius: 4, background: 'var(--surface-alt)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {m.coverImageUrl ? (
                                            <img src={m.coverImageUrl} alt={m.book} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        ) : (
                                            <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>📓</span>
                                        )}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                            {m.meetingNumber != null && (
                                                <span style={{
                                                    fontSize: '0.7rem', fontWeight: 700,
                                                    background: 'var(--primary-light)', color: 'var(--primary)',
                                                    borderRadius: 8, padding: '2px 8px', flexShrink: 0,
                                                }}>제{m.meetingNumber}회</span>
                                            )}
                                            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>
                                                {m.book.length > 15 ? m.book.slice(0, 15) + '...' : m.book}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)', display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <span>{formatDate(m.date)}</span>
                                            <span style={{ width: 3, height: 3, borderRadius: 8, background: 'var(--border)' }}></span>
                                            <span>발제: <span style={{ color: 'var(--text)', fontWeight: 500 }}>{getMemberName(m.presenterMemberId)}</span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </AppShell>
    );
}
