'use client';

import { useEffect, useState, useMemo } from 'react';
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

export default function PastMeetingsPage() {
    const { currentMemberId } = useMember();
    const router = useRouter();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    const [yearFilter, setYearFilter] = useState<string>('ALL');
    const [presenterFilter, setPresenterFilter] = useState<string>('ALL');
    const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

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

        result.sort((a, b) => sortOrder === 'DESC' ? b.date - a.date : a.date - b.date);

        return result;
    }, [meetings, yearFilter, presenterFilter, sortOrder]);

    if (loading) return <AppShell><div className="spinner">불러오는 중…</div></AppShell>;

    return (
        <AppShell>
            <h1 className="page-title">이전 독서모임</h1>

            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 120px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: 4 }}>연도</label>
                        <select className="form-input" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                            <option value="ALL">전체 연도</option>
                            {years.map(y => <option key={y} value={y}>{y}년</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: 4 }}>발제자</label>
                        <select className="form-input" value={presenterFilter} onChange={(e) => setPresenterFilter(e.target.value)}>
                            <option value="ALL">모든 발제자</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: 4 }}>정렬</label>
                        <select className="form-input" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'DESC' | 'ASC')}>
                            <option value="DESC">최신순</option>
                            <option value="ASC">오래된순</option>
                        </select>
                    </div>
                </div>
            </div>

            {filteredMeetings.length === 0 ? (
                <div className="card">
                    <div className="empty">
                        <div className="empty-text">조건에 맞는 모임이 없어요.</div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredMeetings.map((m) => (
                        <Link key={m.id} href={`/meeting/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.1s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.01)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
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
                                    </div>
                                    <span className="badge badge-gray">완료</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </AppShell>
    );
}
