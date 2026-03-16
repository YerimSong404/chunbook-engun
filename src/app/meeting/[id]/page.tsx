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

    const handleRevertComplete = async () => {
        if (!meetingId) return;
        if (confirm('모임 완료를 취소하시겠습니까?')) {
            try {
                await updateMeeting(meetingId, { status: 'upcoming' });
                setMeeting(prev => prev ? { ...prev, status: 'upcoming' } : null);
                alert('완료가 취소되었습니다.');
            } catch (e) {
                console.error(e);
                alert('완료 취소 중 오류가 발생했습니다.');
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
            {selectedTopicIndex === null && (
                <div style={{ margin: '-24px -20px 32px -20px', background: 'linear-gradient(135deg, #9D48B4 0%, #FFDE59 100%)', padding: '24px 20px 60px 20px', color: '#fff' }}>
                    {/* Header / Back Button Inside Hero */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <button onClick={() => router.back()} className="btn btn-ghost" style={{ padding: '8px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>
                            ← 뒤로가기
                        </button>
                        {meeting.status === 'upcoming' && (
                            <button onClick={handleComplete} className="btn btn-sm" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                                모임 완료 처리
                            </button>
                        )}
                        {meeting.status === 'done' && (
                            <button onClick={handleRevertComplete} className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>
                                완료 취소
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Content Area overlapped */}
            {selectedTopicIndex === null && (
                <div style={{ marginTop: '-80px', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
                    {meeting.coverImageUrl ? (
                        <div style={{
                            width: 140, height: 200, borderRadius: 8, overflow: 'hidden',
                            boxShadow: '0 12px 36px rgba(0,0,0,0.25)', background: '#fff', marginBottom: 24
                        }}>
                            <img src={meeting.coverImageUrl} alt={meeting.book} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                        </div>
                    ) : (
                        <div style={{ width: 140, height: 200, borderRadius: 8, background: 'var(--border)', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '3rem' }}>📓</span>
                        </div>
                    )}

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 8, letterSpacing: '0.05em' }}>
                            {meeting.meetingNumber != null ? `제${meeting.meetingNumber}회 독서모임` : '독서모임'}
                        </div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text)', wordBreak: 'keep-all' }}>
                            {meeting.book}
                        </h1>
                        <div style={{ fontSize: '0.95rem', color: 'var(--text-sub)', marginBottom: 16 }}>
                            {meeting.author}
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <span style={{ background: 'var(--surface-alt)', color: 'var(--text-sub)', borderRadius: 100, padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600 }}>
                                📅 {formatDate(meeting.date)}
                            </span>
                            <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 100, padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600 }}>
                                🎤 발제자: {getMemberName(meeting.presenterMemberId)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Dynamic Content */}
            {selectedTopicIndex === null ? (
                /* Topics View */
                <>
                    <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', textTransform: 'none', letterSpacing: '0' }}>
                            발제 키워드
                        </span>
                        {!isEditingTopics && meeting.status === 'upcoming' && (
                            <button className="btn btn-ghost btn-sm" onClick={startEditTopics} style={{ borderRadius: 100 }}>
                                {meeting.topics.length === 0 ? '+ 발제 등록' : '수정'}
                            </button>
                        )}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: 20 }}>
                        공감되는 발제를 선택해 멤버들의 답변을 확인해보세요.
                    </p>

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
                                            width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)',
                                            color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 8
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
                                    {savingTopics ? '저장 중…' : '저장 완료'}
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setIsEditingTopics(false)} disabled={savingTopics}>
                                    취소
                                </button>
                            </div>
                        </div>
                    ) : meeting.topics.length === 0 ? (
                        <div className="card" style={{ border: 'none', background: 'var(--surface-alt)' }}>
                            <div className="empty" style={{ padding: '32px 20px' }}>
                                <div className="empty-text">아직 등록된 발제가 없어요.</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {meeting.topics.map((t, idx) => (
                                <div
                                    key={idx}
                                    className="card"
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex', gap: 14, alignItems: 'flex-start',
                                        transition: 'all 0.15s ease',
                                        border: '1px solid var(--border)',
                                        padding: '20px',
                                        borderRadius: 'var(--radius)'
                                    }}
                                    onClick={() => setSelectedTopicIndex(idx)}
                                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
                                >
                                    <span style={{
                                        color: 'var(--primary)', fontWeight: 800, fontSize: '0.95rem',
                                        background: 'var(--primary-light)', width: 26, height: 26,
                                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0, marginTop: -2
                                    }}>
                                        {idx + 1}
                                    </span>
                                    <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text)', lineHeight: 1.5, wordBreak: 'keep-all' }}>
                                        {t}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                /* Single Topic Answer View */
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                        <button onClick={() => setSelectedTopicIndex(null)} className="btn btn-ghost" style={{ padding: '8px' }}>
                            ← 발제 목록
                        </button>
                    </div>

                    <div className="card" style={{ marginBottom: 24, border: 'none', background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--surface) 100%)', padding: '24px 20px' }}>
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <span style={{
                                color: '#fff', fontWeight: 800, fontSize: '1rem',
                                background: 'var(--primary)', width: 28, height: 28,
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, marginTop: -2, boxShadow: 'var(--shadow)'
                            }}>
                                {selectedTopicIndex + 1}
                            </span>
                            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.5, color: 'var(--text)', wordBreak: 'keep-all' }}>
                                {meeting.topics[selectedTopicIndex]}
                            </h2>
                        </div>
                    </div>

                    <div className="section-title" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', textTransform: 'none', letterSpacing: '0' }}>
                        멤버 답변
                    </div>
                    {members.filter(m => !meeting.absentMemberIds?.includes(m.id)).length === 0 ? (
                        <div className="empty">참석한 멤버가 없습니다.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {members
                                .filter(m => !meeting.absentMemberIds?.includes(m.id))
                                .map(m => {
                                    const answer = answers.find(a => a.memberId === m.id && a.topicIndex === selectedTopicIndex)?.answer;
                                    const hasAnswer = Boolean(answer?.trim());

                                    return (
                                        <div key={m.id} className="card" style={{ padding: '20px', borderRadius: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                                    👤
                                                </div>
                                                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>{m.name}</div>
                                            </div>

                                            {hasAnswer ? (
                                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text)', fontSize: '0.95rem' }}>
                                                    {answer}
                                                </div>
                                            ) : (
                                                <div style={{ color: 'var(--text-sub)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                                    아직 기록된 답변이 없습니다.
                                                </div>
                                            )}
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
