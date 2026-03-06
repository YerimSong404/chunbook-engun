'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMember } from '@/context/MemberContext';
import { getMeetings, getMembers, getAnswers, saveAnswer, updateMeeting } from '@/lib/db';
import { Meeting, Member } from '@/lib/types';
import AppShell from '@/components/AppShell';

function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

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
                            borderRadius: 100,
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
    const router = useRouter();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
    const [saving, setSaving] = useState<string | null>(null);
    const [toast, setToast] = useState(false);
    const [loading, setLoading] = useState(true);
    const [absentIds, setAbsentIds] = useState<string[]>([]);
    const [absentSaving, setAbsentSaving] = useState(false);

    useEffect(() => {
        if (!currentMemberId) {
            setLoading(false);
            router.replace('/');
            return;
        }
        Promise.all([getMeetings(), getMembers()])
            .then(([mt, mb]) => {
                setMeetings(mt);
                setMembers(mb);
                const upcoming = mt.filter(m => m.status === 'upcoming').sort((a, b) => a.date - b.date);
                const first = upcoming[0] ?? mt[0] ?? null;
                if (first) {
                    setSelectedMeetingId(first.id);
                    setAbsentIds(first.absentMemberIds ?? []);
                }
            })
            .finally(() => setLoading(false));
    }, [currentMemberId, router]);

    useEffect(() => {
        if (!selectedMeetingId) return;
        getAnswers(selectedMeetingId).then((ans) => {
            const map: Record<string, Record<string, string>> = {};
            ans.forEach((a) => {
                if (!map[a.memberId]) map[a.memberId] = {};
                map[a.memberId][a.topicIndex] = a.answer;
            });
            setAnswers(map);
        });
        const mt = meetings.find((m) => m.id === selectedMeetingId);
        setAbsentIds(mt?.absentMemberIds ?? []);
    }, [selectedMeetingId, meetings]);

    const handleSave = async (memberId: string, topicIndex: number, text: string) => {
        if (!selectedMeetingId) return;
        const key = `${memberId}_${topicIndex}`;
        setSaving(key);
        await saveAnswer(selectedMeetingId, memberId, topicIndex, text);
        setSaving(null);
        showToast();
    };

    const handleChange = (memberId: string, topicIndex: number, value: string) => {
        setAnswers((prev) => ({
            ...prev,
            [memberId]: { ...(prev[memberId] ?? {}), [topicIndex]: value },
        }));
    };

    const showToast = () => {
        setToast(true);
        setTimeout(() => setToast(false), 1800);
    };

    const handleAbsentChange = async (ids: string[]) => {
        setAbsentIds(ids);
        if (!selectedMeetingId) return;
        setAbsentSaving(true);
        await updateMeeting(selectedMeetingId, { absentMemberIds: ids });
        setMeetings((prev) =>
            prev.map((m) => m.id === selectedMeetingId ? { ...m, absentMemberIds: ids } : m)
        );
        setAbsentSaving(false);
        showToast();
    };

    if (loading) return <AppShell><div className="spinner">불러오는 중…</div></AppShell>;

    const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) ?? null;
    const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? id;

    // 불참자 제외한 참석 멤버만 답변 입력
    const presentMembers = members.filter((m) => !absentIds.includes(m.id));

    return (
        <AppShell>
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
                            {m.meetingNumber != null ? `제${m.meetingNumber}회 · ` : ''}{formatDate(m.date)} 『{m.book}』
                        </option>
                    ))}
                </select>
            </div>

            {!selectedMeeting && (
                <div className="card">
                    <div className="empty">
                        <div className="empty-icon">✏️</div>
                        <div className="empty-text">모임을 선택하면 기록을 입력할 수 있어요</div>
                    </div>
                </div>
            )}

            {selectedMeeting && (
                <>
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
                                불참: {absentIds.map(id => getMemberName(id)).join(', ')} — 답변 입력에서 제외됩니다
                            </p>
                        )}
                    </div>

                    {selectedMeeting.topics.length === 0 ? (
                        <div className="card">
                            <div className="empty">
                                <div className="empty-icon">📝</div>
                                <div className="empty-text">아직 발제 주제가 등록되지 않았어요</div>
                            </div>
                        </div>
                    ) : (
                        selectedMeeting.topics.map((topic, topicIdx) => (
                            <div className="card" key={topicIdx} style={{ marginBottom: 12 }}>
                                <div className="record-topic-header">
                                    <div className="record-topic-num">{topicIdx + 1}</div>
                                    <div className="record-topic-text">{topic}</div>
                                </div>
                                <div className="record-answers">
                                    {presentMembers.map((mb) => {
                                        const key = `${mb.id}_${topicIdx}`;
                                        const val = answers[mb.id]?.[topicIdx] ?? '';
                                        return (
                                            <div key={mb.id} className="record-answer-row">
                                                <div className="record-answer-label">{mb.name}</div>
                                                <div style={{ flex: 1 }}>
                                                    <textarea
                                                        className="form-textarea"
                                                        style={{ minHeight: 60 }}
                                                        placeholder={`${mb.name}의 답변`}
                                                        value={val}
                                                        onChange={(e) => handleChange(mb.id, topicIdx, e.target.value)}
                                                        onBlur={() => { if (val.trim()) handleSave(mb.id, topicIdx, val); }}
                                                    />
                                                </div>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ marginLeft: 6, flexShrink: 0, alignSelf: 'flex-start', marginTop: 0 }}
                                                    disabled={saving === key}
                                                    onClick={() => handleSave(mb.id, topicIdx, val)}
                                                >
                                                    {saving === key ? '…' : '저장'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}

            {/* Toast */}
            <div className={`toast ${toast ? 'show' : ''}`}>저장되었어요 ✓</div>
        </AppShell>
    );
}
