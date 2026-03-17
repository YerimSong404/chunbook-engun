'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMember } from '@/context/MemberContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { getAnswers, saveAnswer, updateMeeting } from '@/lib/db';
import { Meeting, Member } from '@/lib/types';
import { formatDate, getMemberName } from '@/lib/utils';
import AppShell from '@/components/AppShell';
import { Edit3, FileText, User } from 'lucide-react';

function AbsentSelector({
    members,
    absentIds,
    onChange,
}: {
    members: Member[];
    absentIds: string[];
    onChange: (ids: string[]) => void;
}) {
    const toggle = (id: string) => {
        onChange(
            absentIds.includes(id)
                ? absentIds.filter((x) => x !== id)
                : [...absentIds, id]
        );
    };
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {members.map((m) => {
                const checked = absentIds.includes(m.id);
                return (
                    <button
                        key={m.id}
                        onClick={() => toggle(m.id)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                            background: checked ? 'var(--accent-light)' : 'var(--surface)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: checked ? 600 : 400,
                            color: checked ? 'var(--accent)' : 'var(--text)',
                            transition: 'all 0.15s',
                            fontFamily: 'var(--font)',
                        }}
                    >
                        {checked ? '✗ ' : ''}{m.name}
                    </button>
                );
            })}
        </div>
    );
}

export default function RecordPage() {
    const { currentMemberId } = useMember();
    const { members, meetings, loading, error, refetch } = useData();
    const { showToast, showError } = useToast();
    const router = useRouter();

    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
    const [saving, setSaving] = useState<string | null>(null);
    const [absentIds, setAbsentIds] = useState<string[]>([]);
    const [absentSaving, setAbsentSaving] = useState(false);
    const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!currentMemberId) {
            router.replace('/');
            return;
        }
    }, [currentMemberId, router]);

    // 초기 선택: 다음 모임을 기본으로 (한 번만)
    const hasInitialized = useRef(false);
    useEffect(() => {
        if (!currentMemberId || meetings.length === 0 || hasInitialized.current) return;
        const upcoming = meetings.filter((m) => m.status === 'upcoming').sort((a, b) => a.date - b.date);
        const first = upcoming[0] ?? meetings[0] ?? null;
        if (first) {
            hasInitialized.current = true;
            setSelectedMeetingId(first.id);
            setAbsentIds(first.absentMemberIds ?? []);
        }
    }, [currentMemberId, meetings]);

    // 선택된 모임이 바뀔 때만 답변 로드 (meetings 제거로 불필요한 재요청 방지)
    useEffect(() => {
        if (!selectedMeetingId) return;
        setSelectedTopicIndex(null);
        getAnswers(selectedMeetingId)
            .then((ans) => {
                const map: Record<string, Record<string, string>> = {};
                ans.forEach((a) => {
                    if (!map[a.memberId]) map[a.memberId] = {};
                    map[a.memberId][a.topicIndex] = a.answer;
                });
                setAnswers(map);
            })
            .catch(() => showError('답변을 불러오지 못했어요.'));
    }, [selectedMeetingId, showError]);

    // 선택된 모임의 불참자 목록 동기화 (모임 변경 또는 목록 갱신 시)
    useEffect(() => {
        if (!selectedMeetingId) return;
        const mt = meetings.find((m) => m.id === selectedMeetingId);
        setAbsentIds(mt?.absentMemberIds ?? []);
    }, [selectedMeetingId, meetings]);

    const handleTopicSave = async (topicIndex: number) => {
        if (!selectedMeetingId) return;
        setSaving(`topic_${topicIndex}`);
        try {
            const presentMembers = members.filter((m) => !absentIds.includes(m.id));
            await Promise.all(
                presentMembers.map((mb) => {
                    const val = answers[mb.id]?.[topicIndex] ?? '';
                    return saveAnswer(selectedMeetingId, mb.id, topicIndex, val);
                })
            );
            showToast('저장되었어요');
        } catch {
            showError('저장에 실패했어요.');
        } finally {
            setSaving(null);
        }
    };

    const handleChange = (memberId: string, topicIndex: number, value: string) => {
        setAnswers((prev) => ({
            ...prev,
            [memberId]: { ...(prev[memberId] ?? {}), [topicIndex]: value },
        }));
    };

    const handleAbsentChange = async (ids: string[]) => {
        setAbsentIds(ids);
        if (!selectedMeetingId) return;
        setAbsentSaving(true);
        try {
            await updateMeeting(selectedMeetingId, { absentMemberIds: ids });
            await refetch();
            showToast('저장되었어요');
        } catch {
            showError('불참자 저장에 실패했어요.');
        } finally {
            setAbsentSaving(false);
        }
    };

    if (loading) return <AppShell><div className="spinner">불러오는 중…</div></AppShell>;
    if (error) return <AppShell><div className="empty">{error}</div></AppShell>;

    const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) ?? null;

    // 불참자 제외한 참석 멤버만 답변 입력
    const presentMembers = members.filter((m) => !absentIds.includes(m.id));

    return (
        <AppShell>
            {selectedTopicIndex === null ? (
                <>
                    <h1 className="page-title">서기 기록</h1>

                    {/* 모임 선택 */}
                    <div className="form-group">
                        <label className="form-label">모임 선택</label>
                        <select
                            className="form-input"
                            value={selectedMeetingId ?? ''}
                            onChange={(e) => setSelectedMeetingId(e.target.value || null)}
                        >
                            <option value="">— 모임을 선택하세요 —</option>
                            {meetings.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.meetingNumber != null ? `제${m.meetingNumber}회 · ` : ''}{formatDate(m.date, 'short')} 『{m.book || '책 미정'}』
                                </option>
                            ))}
                        </select>
                    </div>

                    {!selectedMeeting ? (
                        <div className="card">
                            <div className="empty">
                                <Edit3 size={40} color="var(--border)" style={{ marginBottom: 16 }} />
                                <div className="empty-text">모임을 선택하면 기록을 입력할 수 있어요</div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {selectedMeeting.topics.length === 0 ? (
                                <div className="card" style={{ marginBottom: 16 }}>
                                    <div className="empty">
                                        <FileText size={40} color="var(--border)" style={{ marginBottom: 16 }} />
                                        <div className="empty-text">아직 발제 주제가 등록되지 않았어요</div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginBottom: 24 }}>
                                    <div className="section-title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 16, textTransform: 'none', letterSpacing: '0' }}>
                                        발제문
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: 20 }}>
                                        기록할 발제를 선택해주세요.
                                    </p>
                                    <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 8 }}>
                                        {selectedMeeting.topics.map((t, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    cursor: 'pointer',
                                                    display: 'flex', gap: 16, alignItems: 'flex-start',
                                                    transition: 'background 0.15s ease',
                                                    padding: '18px 20px',
                                                    borderBottom: idx < selectedMeeting.topics.length - 1 ? '1px solid var(--border)' : 'none',
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
                                </div>
                            )}

                            {/* 불참자 선택 */}
                            <div className="card" style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)' }}>
                                        불참자 기록
                                    </span>
                                    {absentSaving && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>저장 중…</span>
                                    )}
                                </div>
                                {members.length === 0 ? (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>등록된 멤버가 없어요</p>
                                ) : (
                                    <AbsentSelector
                                        members={members}
                                        absentIds={absentIds}
                                        onChange={handleAbsentChange}
                                    />
                                )}
                                {absentIds.length > 0 && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: 10 }}>
                                        불참: {absentIds.map(id => getMemberName(members, id)).join(', ')} — 답변 입력에서 제외됩니다
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </>
            ) : selectedMeeting && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                        <button onClick={() => setSelectedTopicIndex(null)} className="btn btn-ghost" style={{ padding: '8px' }}>
                            ← 리스트로
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
                                {selectedMeeting.topics[selectedTopicIndex]}
                            </h2>
                        </div>
                        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-primary"
                                disabled={saving === `topic_${selectedTopicIndex}`}
                                onClick={() => handleTopicSave(selectedTopicIndex)}
                                style={{ padding: '10px 24px', fontSize: '0.95rem', borderRadius: 8, boxShadow: 'var(--shadow-hover)' }}
                            >
                                {saving === `topic_${selectedTopicIndex}` ? '저장 중…' : '현재 발제 답변 모두 저장'}
                            </button>
                        </div>
                    </div>

                    <div className="record-answers">
                        {presentMembers.map((mb) => {
                            const val = answers[mb.id]?.[selectedTopicIndex] ?? '';
                            return (
                                <div key={mb.id} className="card" style={{ marginBottom: 16, padding: '20px', borderRadius: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                                <User size={16} color="var(--text-sub)" />
                                        </div>
                                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>{mb.name}</div>
                                    </div>
                                    <textarea
                                        className="form-textarea"
                                        style={{ minHeight: 100, width: '100%', fontSize: '0.95rem', lineHeight: 1.6 }}
                                        placeholder={`${mb.name}의 답변을 입력하세요`}
                                        value={val}
                                        onChange={(e) => handleChange(mb.id, selectedTopicIndex, e.target.value)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

        </AppShell>
    );
}
