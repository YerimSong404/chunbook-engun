'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getMembers, getMeeting, updateMeeting } from '@/lib/db';
import { Member, Meeting } from '@/lib/types';
import AppShell from '@/components/AppShell';

const emptyForm = {
    date: '',
    book: '',
    author: '',
    presenterMemberId: '',
    status: 'upcoming' as 'upcoming' | 'done',
    topics: ['', '', ''],
    coverImageUrl: '',
    meetingNumber: '',
    absentMemberIds: [] as string[],
};

export default function EditMeetingPage() {
    const router = useRouter();
    const params = useParams();
    const meetingId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        if (!meetingId) {
            router.back();
            return;
        }

        Promise.all([getMeeting(meetingId), getMembers()])
            .then(([m, mb]) => {
                if (!m) {
                    alert('모임을 찾을 수 없습니다.');
                    router.back();
                    return;
                }
                setMembers(mb);
                setForm({
                    date: new Date(m.date).toISOString().slice(0, 10),
                    book: m.book,
                    author: m.author,
                    presenterMemberId: m.presenterMemberId,
                    status: m.status,
                    topics: m.topics.length >= 3 ? m.topics : [...m.topics, ...Array(3 - m.topics.length).fill('')],
                    coverImageUrl: m.coverImageUrl ?? '',
                    meetingNumber: m.meetingNumber != null ? String(m.meetingNumber) : '',
                    absentMemberIds: m.absentMemberIds ?? [],
                });
            })
            .finally(() => setLoading(false));
    }, [meetingId, router]);

    const handleTopicChange = (i: number, val: string) => {
        setForm((prev) => {
            const topics = [...prev.topics];
            topics[i] = val;
            return { ...prev, topics };
        });
    };
    const addTopicSlot = () => {
        if (form.topics.length >= 10) return;
        setForm((prev) => ({ ...prev, topics: [...prev.topics, ''] }));
    };
    const removeTopicSlot = (i: number) => {
        if (form.topics.length <= 3) return;
        setForm((prev) => ({ ...prev, topics: prev.topics.filter((_, idx) => idx !== i) }));
    };

    const handleSubmitMeeting = async () => {
        if (!meetingId) return;
        if (!form.date || !form.book) return alert('날짜와 책 제목은 필수입니다.');
        
        setSubmitting(true);
        const meetingNumberVal = form.meetingNumber.trim()
            ? parseInt(form.meetingNumber)
            : undefined;

        const data = {
            date: new Date(form.date).getTime(),
            book: form.book.trim(),
            author: form.author.trim(),
            presenterMemberId: form.presenterMemberId,
            topics: form.topics.map((t) => t.trim()).filter(Boolean),
            status: form.status,
            absentMemberIds: form.absentMemberIds,
            ...(form.coverImageUrl.trim() ? { coverImageUrl: form.coverImageUrl.trim() } : {}),
            ...(meetingNumberVal != null ? { meetingNumber: meetingNumberVal } : {}),
        };

        try {
            await updateMeeting(meetingId, data);
            alert('모임 정보가 수정되었습니다.');
            router.back();
        } catch (e) {
            console.error(e);
            alert('수정 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <AppShell><div className="spinner">불러오는 중…</div></AppShell>;

    return (
        <AppShell>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                <button onClick={() => router.back()} className="btn btn-ghost" style={{ padding: '8px', marginLeft: '-8px' }}>
                    ← 뒤로가기
                </button>
            </div>

            <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', marginBottom: 24 }}>
                <div className="section-title" style={{ marginTop: 0, fontSize: '1.2rem', color: 'var(--text)', textTransform: 'none' }}>모임 수정</div>
                
                <div className="form-group" style={{ marginTop: 20 }}>
                    <label className="form-label">모임 번호</label>
                    <input
                        className="form-input"
                        type="number"
                        min={1}
                        placeholder="번호 입력"
                        value={form.meetingNumber}
                        onChange={(e) => setForm((p) => ({ ...p, meetingNumber: e.target.value }))}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">모임 날짜 *</label>
                    <input type="date" className="form-input" value={form.date}
                        onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="form-group">
                    <label className="form-label">책 제목 *</label>
                    <input className="form-input" placeholder="예: 채식주의자" value={form.book}
                        onChange={(e) => setForm((p) => ({ ...p, book: e.target.value }))} />
                </div>
                <div className="form-group">
                    <label className="form-label">저자</label>
                    <input className="form-input" placeholder="예: 한강" value={form.author}
                        onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} />
                </div>
                <div className="form-group">
                    <label className="form-label">책 표지 이미지 URL <span style={{ fontWeight: 400, opacity: 0.6 }}>(선택)</span></label>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <input
                            className="form-input"
                            style={{ flex: 1 }}
                            placeholder="https://image.yes24.com/..."
                            value={form.coverImageUrl}
                            onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))}
                        />
                        {form.coverImageUrl.trim() && (
                            <div style={{
                                flexShrink: 0, width: 64, height: 88,
                                borderRadius: 8, overflow: 'hidden',
                                border: '1.5px solid var(--border)',
                                background: 'var(--surface-alt)',
                            }}>
                                <img
                                    src={form.coverImageUrl}
                                    alt="표지 미리보기"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            </div>
                        )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: 6 }}>
                        💡 알라딘/예스24 책 상세페이지에서 표지 이미지 우클릭 → "이미지 주소 복사"
                    </p>
                </div>
                <div className="form-group">
                    <label className="form-label">발제자</label>
                    <select className="form-input" value={form.presenterMemberId}
                        onChange={(e) => setForm((p) => ({ ...p, presenterMemberId: e.target.value }))}>
                        <option value="">— 선택 안 함 —</option>
                        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label className="form-label" style={{ margin: 0 }}>발제 주제 ({form.topics.length}/10)</label>
                        {form.topics.length < 10 && (
                            <button className="btn btn-ghost btn-sm" onClick={addTopicSlot}>+ 추가</button>
                        )}
                    </div>
                    {form.topics.map((t, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <span style={{
                                width: 22, height: 22, borderRadius: '50%', background: 'var(--primary-light)',
                                color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 10
                            }}>{i + 1}</span>
                            <input className="form-input" placeholder={`주제 ${i + 1}`} value={t}
                                onChange={(e) => handleTopicChange(i, e.target.value)} style={{ flex: 1 }} />
                            {form.topics.length > 3 && (
                                <button className="btn btn-ghost btn-sm" onClick={() => removeTopicSlot(i)}
                                    style={{ color: 'var(--accent)', flexShrink: 0 }}>✕</button>
                            )}
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: 24 }}>
                    <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', borderRadius: 12, padding: '14px 0', fontWeight: 700, fontSize: '1.05rem' }} 
                        onClick={handleSubmitMeeting}
                        disabled={submitting}
                    >
                        {submitting ? '수정 중…' : '수정 완료'}
                    </button>
                </div>
            </div>
        </AppShell>
    );
}
