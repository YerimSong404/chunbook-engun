'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMember } from '@/context/MemberContext';
import { getMeeting, getMembers, getAnswers, updateMeeting } from '@/lib/db';
import { Meeting, Member, Answer } from '@/lib/types';
import AppShell from '@/components/AppShell';

function formatDate(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

export default function MeetingDetailPage() {
    const { currentMemberId } = useMember();
    const router = useRouter();
    const params = useParams();
    const meetingId = params.id as string;

    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);

    const [isEditingTopics, setIsEditingTopics] = useState(false);
    const [editingTopics, setEditingTopics] = useState<string[]>([]);
    const [savingTopics, setSavingTopics] = useState(false);

    useEffect(() => {
        if (!currentMemberId) {
            setLoading(false);
            router.replace('/');
            return;
        }

        if (!meetingId) {
            router.back();
            return;
        }

        Promise.all([getMeeting(meetingId), getMembers(), getAnswers(meetingId)])
            .then(([mt, mb, ans]) => {
                setMeeting(mt);
                setMembers(mb);
                setAnswers(ans);
            })
            .finally(() => setLoading(false));
    }, [currentMemberId, meetingId, router]);

    if (loading) return <AppShell><div className="spinner">불러오는 중…</div></AppShell>;
    if (!meeting) return <AppShell><div className="empty">모임을 찾을 수 없어요.</div></AppShell>;

    const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? id;

    const handleComplete = async () => {
        if (!meetingId) return;
        if (confirm('모임을 완료 처리하시겠습니까?')) {
            try {
                await updateMeeting(meetingId, { status: 'done' });
                setMeeting(prev => prev ? { ...prev, status: 'done' } : null);
                alert('완료 처리되었습니다.');
            } catch (e) {
                console.error(e);
                alert('완료 처리 중 오류가 발생했습니다.');
            }
        }
    };

    const startEditTopics = () => {
        const initialTopics = meeting?.topics.length ? meeting.topics : [];
        setEditingTopics(initialTopics.length >= 3 ? initialTopics : [...initialTopics, ...Array(3 - initialTopics.length).fill('')]);
        setIsEditingTopics(true);
    };

    const handleTopicChange = (i: number, val: string) => {
        setEditingTopics(prev => {
            const next = [...prev];
            next[i] = val;
            return next;
        });
    };

    const addTopicSlot = () => setEditingTopics(prev => prev.length < 10 ? [...prev, ''] : prev);
    const removeTopicSlot = (i: number) => setEditingTopics(prev => prev.length > 3 ? prev.filter((_, idx) => idx !== i) : prev);

    const handleSaveTopics = async () => {
        if (!meetingId) return;
        setSavingTopics(true);
        const filteredTopics = editingTopics.map(t => t.trim()).filter(Boolean);
        try {
            await updateMeeting(meetingId, { topics: filteredTopics });
            setMeeting(prev => prev ? { ...prev, topics: filteredTopics } : null);
            setIsEditingTopics(false);
        } catch (e) {
            console.error(e);
            alert('발제 저장 중 오류가 발생했습니다.');
        } finally {
            setSavingTopics(false);
        }
    };

    return (
        <AppShell>
            {/* Header / Back Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    {selectedTopicIndex === null ? (
                        <button onClick={() => router.back()} className="btn btn-ghost" style={{ padding: '8px', marginRight: '10px' }}>
                            ← 뒤로가기
                        </button>
                    ) : (
                        <button onClick={() => setSelectedTopicIndex(null)} className="btn btn-ghost" style={{ padding: '8px', marginRight: '10px' }}>
                            ← 발제 목록
                        </button>
                    )}
                </div>
                {selectedTopicIndex === null && meeting.status === 'upcoming' && (
                    <button onClick={handleComplete} className="btn btn-primary btn-sm">
                        모임 완료 처리
                    </button>
                )}
            </div>

            {/* Meeting Metadata hero */}
            {selectedTopicIndex === null && (
                <div className="meeting-hero" style={{ marginBottom: 20 }}>
                    <div className="meeting-hero-label">
                        {meeting.meetingNumber != null ? `제${meeting.meetingNumber}회 모임` : '모임 상세'}
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        {meeting.coverImageUrl && (
                            <div style={{
                                flexShrink: 0, width: 72, height: 100,
                                borderRadius: 8, overflow: 'hidden',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                            }}>
                                <img
                                    src={meeting.coverImageUrl}
                                    alt={meeting.book}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                                />
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <div className="meeting-hero-book" style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>『{meeting.book}』</div>
                            <div className="meeting-hero-author" style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>{meeting.author}</div>
                            <div className="meeting-hero-meta" style={{ marginTop: '0.8rem' }}>
                                <span className="meeting-hero-chip">📅 {formatDate(meeting.date)}</span>
                                <span className="meeting-hero-chip">🎤 발제자: {getMemberName(meeting.presenterMemberId)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dynamic Content */}
            {selectedTopicIndex === null ? (
                /* Topics List View */
                <>
                    <div className="section-title" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>발제문</span>
                        {!isEditingTopics && meeting.status === 'upcoming' && (
                            <button className="btn btn-ghost btn-sm" onClick={startEditTopics}>
                                {meeting.topics.length === 0 ? '+ 발제 등록' : '발제 수정'}
                            </button>
                        )}
                    </div>

                    {isEditingTopics ? (
                        <div className="card" style={{ marginBottom: 20 }}>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <label className="form-label" style={{ margin: 0 }}>발제 주제 ({editingTopics.length}/10)</label>
                                    {editingTopics.length < 10 && (
                                        <button className="btn btn-ghost btn-sm" onClick={addTopicSlot}>+ 추가</button>
                                    )}
                                </div>
                                {editingTopics.map((t, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                        <span style={{
                                            width: 22, height: 22, borderRadius: '50%', background: 'var(--primary-light)',
                                            color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 10
                                        }}>{i + 1}</span>
                                        <input className="form-input" placeholder={`주제 ${i + 1}`} value={t}
                                            onChange={(e) => handleTopicChange(i, e.target.value)} style={{ flex: 1 }} />
                                        {editingTopics.length > 3 && (
                                            <button className="btn btn-ghost btn-sm" onClick={() => removeTopicSlot(i)}
                                                style={{ color: 'var(--accent)', flexShrink: 0 }}>✕</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-primary btn-sm" onClick={handleSaveTopics} disabled={savingTopics}>
                                    {savingTopics ? '저장 중…' : '저장'}
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setIsEditingTopics(false)} disabled={savingTopics}>
                                    취소
                                </button>
                            </div>
                        </div>
                    ) : meeting.topics.length === 0 ? (
                        <div className="card">
                            <div className="empty">
                                <div className="empty-text">아직 등록된 발제가 없어요.</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {meeting.topics.map((t, idx) => (
                                <div
                                    key={idx}
                                    className="card"
                                    style={{ cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }}
                                    onClick={() => setSelectedTopicIndex(idx)}
                                >
                                    <span style={{
                                        flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
                                        background: 'var(--accent)', color: '#fff', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.9rem', fontWeight: 700
                                    }}>
                                        {idx + 1}
                                    </span>
                                    <span style={{ fontSize: '1rem', lineHeight: 1.5, fontWeight: 500 }}>
                                        {t.length > 50 ? t.slice(0, 50) + '...' : t}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                /* Single Topic Answer View */
                <div>
                    <div className="card" style={{ marginBottom: 20, background: 'var(--surface-alt)', border: '1px solid var(--accent)' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <span style={{
                                flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                                background: 'var(--accent)', color: '#fff', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: '1rem', fontWeight: 700
                            }}>
                                {selectedTopicIndex + 1}
                            </span>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', lineHeight: 1.5, color: 'var(--text)' }}>
                                {meeting.topics[selectedTopicIndex]}
                            </h2>
                        </div>
                    </div>

                    <div className="section-title">멤버 답변</div>
                    {members.filter(m => !meeting.absentMemberIds?.includes(m.id)).length === 0 ? (
                        <div className="empty">참석한 멤버가 없습니다.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {members
                                .filter(m => !meeting.absentMemberIds?.includes(m.id))
                                .map(m => {
                                    const answer = answers.find(a => a.memberId === m.id && a.topicIndex === selectedTopicIndex)?.answer || '답변이 없습니다.';
                                    return (
                                        <div key={m.id} className="card">
                                            <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>{m.name}</div>
                                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text)' }}>
                                                {answer}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            )}
        </AppShell>
    );
}
