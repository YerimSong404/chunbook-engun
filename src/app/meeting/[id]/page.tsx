'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useMember } from '@/context/MemberContext';
import { useData } from '@/context/DataContext';
import { getMeeting, getAnswers, updateMeeting } from '@/lib/db';
import { Meeting, Answer } from '@/lib/types';
import { formatDate, getMemberName, getDDay } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useIsAdmin } from '@/lib/hooks';
import AppShell from '@/components/AppShell';
import { Calendar, Mic, BookOpen, User, Pencil, Share2 } from 'lucide-react';

export default function MeetingDetailPage() {
    const { currentMemberId } = useMember();
    const { members } = useData();
    const isAdmin = useIsAdmin();
    const { showToast, showError } = useToast();
    const router = useRouter();
    const params = useParams();
    const meetingId = params.id as string;

    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);

    const [isEditingTopics, setIsEditingTopics] = useState(false);
    const [editingTopics, setEditingTopics] = useState<string[]>([]);
    const [savingTopics, setSavingTopics] = useState(false);

    useEffect(() => {
        if (!currentMemberId) {
            router.replace('/');
            return;
        }
        if (!meetingId) {
            router.back();
            return;
        }

        const load = () => {
            Promise.all([getMeeting(meetingId), getAnswers(meetingId)])
                .then(([mt, ans]) => {
                    setMeeting(mt);
                    setAnswers(ans);
                })
                .catch(() => showError('모임 정보를 불러오지 못했어요.'))
                .finally(() => setLoading(false));
        };

        load();

        // 편집 페이지에서 돌아왔을 때(탭 포커스 복귀) 자동 재조회
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') load();
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [currentMemberId, meetingId, router, showError]);

    if (loading) return <AppShell><div className="spinner">불러오는 중…</div></AppShell>;
    if (!meeting) return <AppShell><div className="empty">모임을 찾을 수 없어요.</div></AppShell>;

    const handleComplete = async () => {
        if (!meetingId) return;
        if (!confirm('모임을 완료 처리하시겠습니까?')) return;
        try {
            await updateMeeting(meetingId, { status: 'done' });
            setMeeting((prev) => (prev ? { ...prev, status: 'done' } : null));
            showToast('완료 처리되었어요');
        } catch {
            showError('완료 처리 중 오류가 발생했어요.');
        }
    };

    const handleRevertComplete = async () => {
        if (!meetingId) return;
        if (!confirm('모임 완료를 취소하시겠습니까?')) return;
        try {
            await updateMeeting(meetingId, { status: 'upcoming' });
            setMeeting((prev) => (prev ? { ...prev, status: 'upcoming' } : null));
            showToast('완료가 취소되었어요');
        } catch {
            showError('완료 취소 중 오류가 발생했어요.');
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

    const handleSaveToCalendar = () => {
        if (!meeting) return;
        const title = encodeURIComponent(`[독서모임] ${meeting.book || '새 모임'}`);
        const dateObj = new Date(meeting.date);
        const startStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
        dateObj.setDate(dateObj.getDate() + 1);
        const endStr = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
        const details = encodeURIComponent(`저자: ${meeting.author || '미상'}\n발제자: ${getMemberName(members, meeting.presenterMemberId) || '미정'}`);
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
        window.open(url, '_blank');
    };

    const handleShare = async () => {
        if (!meeting) return;
        const dStr = formatDate(meeting.date, 'full');
        const name = meeting.meetingNumber != null ? `제${meeting.meetingNumber}회 독서모임` : '새 독서모임';
        const presenter = meeting.presenterMemberId ? getMemberName(members, meeting.presenterMemberId) : '미정';

        const message = `[천북인권] ${name} 안내 📚\n\n📖 책: ${meeting.book || '미정'}\n✍️ 저자: ${meeting.author || '미상'}\n📅 일시: ${dStr}\n🗣 발제자: ${presenter}\n\n웹앱 혹은 모바일 앱에서 상세 정보와 발제를 확인해주세요!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${name} 안내`,
                    text: message,
                });
            } catch (error) {
                console.error('Share failed', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(message);
                showToast('안내 문구가 복사되었어요! 카톡에 붙여넣기 하세요.');
            } catch (err) {
                showError('복사에 실패했습니다.');
            }
        }
    };

    const handleSaveTopics = async () => {
        if (!meetingId) return;
        setSavingTopics(true);
        const filteredTopics = editingTopics.map((t) => t.trim()).filter(Boolean);
        try {
            await updateMeeting(meetingId, { topics: filteredTopics });
            setMeeting((prev) => (prev ? { ...prev, topics: filteredTopics } : null));
            setIsEditingTopics(false);
            showToast('저장되었어요');
        } catch {
            showError('발제 저장 중 오류가 발생했어요.');
        } finally {
            setSavingTopics(false);
        }
    };

    return (
        <AppShell>
            {selectedTopicIndex === null && (
                <div className="meeting-hero-header">
                    <div className="meeting-hero-back">
                        <button onClick={() => router.back()} className="btn btn-ghost">
                            ← 뒤로가기
                        </button>
                        <div className="meeting-hero-actions">
                            {isAdmin && (
                                <Link
                                    href={`/admin/meeting/${meetingId}`}
                                    className="btn btn-ghost btn-sm meeting-edit-btn"
                                >
                                    <Pencil size={16} /> 수정
                                </Link>
                            )}
                            {isAdmin && (
                                <>
                                    {meeting.status === 'upcoming' && (
                                        <button onClick={handleComplete} className="meeting-hero-btn">
                                            모임 완료
                                        </button>
                                    )}
                                    {meeting.status === 'done' && (
                                        <button onClick={handleRevertComplete} className="meeting-hero-btn">
                                            완료 취소
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
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
                            <BookOpen size={48} color="var(--text-sub)" />
                        </div>
                    )}

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 8, letterSpacing: '0.05em' }}>
                            {meeting.meetingNumber != null ? `제${meeting.meetingNumber}회 독서모임` : '독서모임'}
                        </div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text)', wordBreak: 'keep-all' }}>
                            {meeting.book || '책 미정'}
                        </h1>
                        <div style={{ fontSize: '0.95rem', color: 'var(--text-sub)', marginBottom: 16 }}>
                            {meeting.author || '\u00A0'}
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-alt)', color: 'var(--text-sub)', borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600 }}>
                                <Calendar size={14} /> {formatDate(meeting.date, 'full')}
                                {meeting.status === 'upcoming' && (
                                    <span className="meeting-d-day">{getDDay(meeting.date)}</span>
                                )}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600 }}>
                                <Mic size={14} /> 발제자:{' '}
                                <Link href={`/member/${meeting.presenterMemberId}`} style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                                    {getMemberName(members, meeting.presenterMemberId)}
                                </Link>
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12 }}>
                            <button onClick={handleSaveToCalendar} style={{ padding: 0, color: 'var(--primary)', fontSize: '0.82rem', textDecoration: 'underline', background: 'transparent', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                <Calendar size={13} /> 일정 저장
                            </button>
                            <button onClick={handleShare} style={{ padding: 0, color: 'var(--primary)', fontSize: '0.82rem', textDecoration: 'underline', background: 'transparent', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                <Share2 size={13} /> 공유하기
                            </button>
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
                        {!isEditingTopics && meeting.status === 'upcoming' && isAdmin && (
                            <button className="btn btn-ghost btn-sm" onClick={startEditTopics} style={{ borderRadius: 8 }}>
                                {meeting.topics.length === 0 ? '+ 발제 등록' : '수정'}
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
                                            width: 28, height: 28, borderRadius: 8, background: 'var(--primary-light)',
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
                        <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 8 }}>
                            {meeting.topics.map((t, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex', gap: 16, alignItems: 'flex-start',
                                        transition: 'background 0.15s ease',
                                        padding: '18px 20px',
                                        borderBottom: idx < meeting.topics.length - 1 ? '1px solid var(--border)' : 'none',
                                    }}
                                    onClick={() => setSelectedTopicIndex(idx)}
                                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-alt)' }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent' }}
                                >
                                    <span style={{
                                        color: 'var(--text-sub)', fontWeight: 700, fontSize: '0.9rem',
                                        background: 'var(--surface-alt)', width: 26, height: 26,
                                        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0, marginTop: 0
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

                    <div style={{ marginBottom: 24, padding: '12px 0' }}>
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <span style={{
                                color: '#fff', fontWeight: 800, fontSize: '1rem',
                                background: 'var(--primary)', width: 28, height: 28,
                                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                                        <div key={m.id} className="card" style={{ padding: '20px', borderRadius: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                                    <User size={16} color="var(--text-sub)" />
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
