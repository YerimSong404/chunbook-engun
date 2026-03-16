'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMember } from '@/context/MemberContext';
import { getMembers, getMeetings } from '@/lib/db';
import { Member, Meeting } from '@/lib/types';
import AppShell from '@/components/AppShell';
import { Users } from 'lucide-react';

function formatDate(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function PresentersPage() {
    const { currentMemberId } = useMember();
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentMemberId) {
            setLoading(false);
            router.replace('/');
            return;
        }
        Promise.all([getMembers(), getMeetings()])
            .then(([mb, mt]) => { setMembers(mb); setMeetings(mt); })
            .finally(() => setLoading(false));
    }, [currentMemberId, router]);

    if (loading) return <AppShell><div className="spinner">불러오는 중…</div></AppShell>;

    // ── 회차 계산 ──────────────────────────────────────────
    // 완료된 모임만 발제 이력으로 인정, 날짜 오름차순
    const doneMeetings = meetings
        .filter((m) => m.status === 'done' && m.presenterMemberId)
        .sort((a, b) => a.date - b.date);

    const memberCount = members.length;

    // 각 멤버의 발제 기록 (전체)
    const allPresented = new Map<string, Meeting[]>();
    members.forEach((m) => allPresented.set(m.id, []));
    doneMeetings.forEach((mt) => {
        const list = allPresented.get(mt.presenterMemberId);
        if (list) list.push(mt);
    });

    // 현재 회차: 최대 발제 횟수를 기준으로 유동적으로 판단
    const maxCount = memberCount > 0
        ? Math.max(...members.map((m) => allPresented.get(m.id)!.length))
        : 0;

    // 아무도 발제하지 않았다면 1회차, 누군가 발제를 시작했다면 그 사람의 횟수가 현재 회차
    const currentRound = Math.max(1, maxCount);

    // 이번 회차 완료/진행 여부
    const doneThisRound = members.filter((m) => (allPresented.get(m.id)?.length ?? 0) >= currentRound);
    const pendingThisRound = members.filter((m) => (allPresented.get(m.id)?.length ?? 0) < currentRound);

    // 이번 회차에서 발제한 모임 내역
    const getRoundMeeting = (memberId: string) => {
        const list = allPresented.get(memberId) ?? [];
        return list[currentRound - 1] ?? null;
    };

    return (
        <AppShell>
            <h1 className="page-title">발제자 현황</h1>

            {/* 회차 뱃지 */}
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--primary-light)', color: 'var(--primary)',
                borderRadius: 100, padding: '6px 16px', marginBottom: 20,
                fontSize: '0.85rem', fontWeight: 700,
            }}>
                🔄 {currentRound}회차 진행 중
                <span style={{ fontWeight: 400, opacity: 0.75 }}>
                    ({doneThisRound.length}/{memberCount}명 완료)
                </span>
            </div>

            {/* 이번 회차 진행 상황 */}
            <div className="section-title">이번 회차 ({currentRound}회차)</div>
            <div className="card" style={{ marginBottom: 20 }}>
                {members.length === 0 ? (
                    <div className="empty">
                        <Users size={40} color="var(--border)" style={{ marginBottom: 16 }} />
                        <div className="empty-text">등록된 멤버가 없어요</div>
                    </div>
                ) : (
                    <>
                        {/* 아직 안 한 멤버 */}
                        {pendingThisRound.length > 0 && (
                            <>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: 8, letterSpacing: '0.05em' }}>
                                    대기 중
                                </div>
                                {pendingThisRound.map((m, i) => (
                                    <div key={m.id} className="presenter-row" style={i === pendingThisRound.length - 1 && doneThisRound.length > 0 ? { borderBottom: 'none', paddingBottom: 24 } : {}}>
                                        <div>
                                            <div className="presenter-name">{m.name}</div>
                                        </div>
                                        <span className="badge badge-accent">미발제</span>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* 이미 한 멤버 */}
                        {doneThisRound.length > 0 && (
                            <>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: 8, letterSpacing: '0.05em', marginTop: pendingThisRound.length > 0 ? 0 : 0 }}>
                                    완료
                                </div>
                                {doneThisRound.map((m) => {
                                    const mt = getRoundMeeting(m.id);
                                    return (
                                        <div key={m.id} className="presenter-row">
                                            <div>
                                                <div className="presenter-name" style={{ opacity: 0.55 }}>{m.name}</div>
                                                {mt && (
                                                    <div className="presenter-count">
                                                        『{mt.book}』({formatDate(mt.date)})
                                                    </div>
                                                )}
                                            </div>
                                            <span className="badge badge-success">완료</span>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* 전체 발제 횟수 */}
            <div className="section-title">전체 발제 횟수</div>
            <div className="card">
                {members.length === 0 ? (
                    <div style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>등록된 멤버가 없어요</div>
                ) : (
                    [...members]
                        .sort((a, b) => (allPresented.get(b.id)?.length ?? 0) - (allPresented.get(a.id)?.length ?? 0))
                        .map((m) => {
                            const list = allPresented.get(m.id) ?? [];
                            return (
                                <div key={m.id} className="presenter-row">
                                    <div>
                                        <div className="presenter-name">{m.name}</div>
                                        {list.length > 0 && (
                                            <div className="presenter-count">
                                                {list.map((mt) => `『${mt.book}』`).join(' · ')}
                                            </div>
                                        )}
                                    </div>
                                    <span className="badge badge-gray">{list.length}회</span>
                                </div>
                            );
                        })
                )}
            </div>
        </AppShell>
    );
}
