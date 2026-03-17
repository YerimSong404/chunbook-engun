'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMember } from '@/context/MemberContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { useIsAdmin } from '@/lib/hooks';
import { addMeeting } from '@/lib/db';
import AppShell from '@/components/AppShell';

const emptyForm = {
    date: '',
    book: '',
    author: '',
    presenterMemberId: '',
    status: 'upcoming' as 'upcoming' | 'done',
    coverImageUrl: '',
    meetingNumber: '',
    absentMemberIds: [] as string[],
};

export default function NewMeetingPage() {
    const { currentMemberId } = useMember();
    const isAdmin = useIsAdmin();
    const { members, meetings, settings, loading: dataLoading, refetch } = useData();
    const { showToast, showError } = useToast();
    const router = useRouter();

    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!currentMemberId) {
            router.replace('/');
            return;
        }
    }, [currentMemberId, router]);

    useEffect(() => {
        if (!dataLoading && currentMemberId && !isAdmin) {
            router.replace('/home');
        }
    }, [dataLoading, currentMemberId, isAdmin, router]);

    const nextMeetingNumber = settings.firstMeetingNumber + meetings.length;

    const handleSubmitMeeting = async () => {
        if (!form.date || !form.book) {
            showError('날짜와 책 제목은 필수예요.');
            return;
        }
        const meetingNumberVal = form.meetingNumber.trim()
            ? parseInt(form.meetingNumber)
            : nextMeetingNumber;

        const data = {
            date: new Date(form.date).getTime(),
            book: form.book.trim(),
            author: form.author.trim(),
            presenterMemberId: form.presenterMemberId,
            topics: [] as string[],
            status: form.status,
            absentMemberIds: form.absentMemberIds,
            ...(form.coverImageUrl.trim() ? { coverImageUrl: form.coverImageUrl.trim() } : {}),
            ...(meetingNumberVal != null ? { meetingNumber: meetingNumberVal } : {}),
        };

        setSubmitting(true);
        try {
            await addMeeting(data);
            await refetch();
            showToast('모임이 등록되었어요');
            router.push('/home');
        } catch {
            showError('모임 등록에 실패했어요.');
        } finally {
            setSubmitting(false);
        }
    };

    if (dataLoading) return <AppShell><div className="spinner">불러오는 중…</div></AppShell>;
    if (currentMemberId && !isAdmin) return null;

    return (
        <AppShell>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                <button onClick={() => router.back()} className="btn btn-ghost" style={{ padding: '8px', marginRight: '10px' }}>
                    ← 뒤로가기
                </button>
                <h1 className="page-title" style={{ margin: 0 }}>새 독서모임 등록</h1>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
                <div className="form-group">
                    <label className="form-label">
                        모임 번호
                        <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 6 }}>
                            (자동: 제{nextMeetingNumber}회)
                        </span>
                    </label>
                    <input
                        className="form-input"
                        type="number"
                        min={1}
                        placeholder={`자동 입력 (제${nextMeetingNumber}회)`}
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
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-lg" onClick={handleSubmitMeeting} disabled={submitting} style={{ width: '100%' }}>
                        {submitting ? '등록 중…' : '모임 등록 완료'}
                    </button>
                </div>
            </div>
        </AppShell>
    );
}
