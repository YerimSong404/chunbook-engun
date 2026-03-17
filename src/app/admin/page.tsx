'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    addMember, deleteMember,
    deleteMeeting,
    updateSettings,
} from '@/lib/db';
import type { AppSettings } from '@/lib/types';
import { useData } from '@/context/DataContext';
import { useIsAdmin } from '@/lib/hooks';
import { useToast } from '@/context/ToastContext';
import { formatDate, getMemberName } from '@/lib/utils';
import AppShell from '@/components/AppShell';
import { Calendar, Users, Settings, ShieldAlert } from 'lucide-react';

type Tab = 'meetings' | 'members' | 'settings';

export default function AdminPage() {
    const router = useRouter();
    const isAdmin = useIsAdmin();
    const { members, meetings, settings, loading, error, refetch } = useData();
    const { showToast, showError } = useToast();

    const [tab, setTab] = useState<Tab>('meetings');
    const [newName, setNewName] = useState('');
    const [memberLoading, setMemberLoading] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [adminSaving, setAdminSaving] = useState(false);
    const [firstNumInput, setFirstNumInput] = useState(String(settings.firstMeetingNumber));

    useEffect(() => {
        setFirstNumInput(String(settings.firstMeetingNumber));
    }, [settings.firstMeetingNumber]);

    // 다음 모임 번호 자동 계산
    const nextMeetingNumber = settings.firstMeetingNumber + meetings.length;

    // ── Members ──
    const handleAddMember = async () => {
        if (!newName.trim()) return;
        setMemberLoading(true);
        try {
            await addMember(newName.trim());
            setNewName('');
            await refetch();
            showToast('멤버가 추가되었어요');
        } catch {
            showError('멤버 추가에 실패했어요.');
        } finally {
            setMemberLoading(false);
        }
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm('멤버를 삭제할까요?')) return;
        try {
            await deleteMember(id);
            await refetch();
            showToast('삭제되었어요');
        } catch {
            showError('삭제에 실패했어요.');
        }
    };

    // ── Settings ──
    const handleSaveSettings = async () => {
        const num = parseInt(firstNumInput);
        if (isNaN(num) || num < 1) {
            showError('1 이상의 숫자를 입력해주세요.');
            return;
        }
        setSettingsSaving(true);
        try {
            await updateSettings({ firstMeetingNumber: num });
            await refetch();
            showToast('저장됐어요');
        } catch {
            showError('설정 저장에 실패했어요.');
        } finally {
            setSettingsSaving(false);
        }
    };

    const handleDeleteMeeting = async (id: string) => {
        if (!confirm('모임을 삭제할까요?')) return;
        try {
            await deleteMeeting(id);
            await refetch();
            showToast('삭제되었어요');
        } catch {
            showError('삭제에 실패했어요.');
        }
    };

    const toggleAdmin = (memberId: string) => {
        const current = settings.adminMemberIds ?? [];
        const next = current.includes(memberId)
            ? current.filter((id) => id !== memberId)
            : [...current, memberId];
        setAdminSaving(true);
        updateSettings({ adminMemberIds: next })
            .then(() => refetch().then(() => showToast('저장됐어요')))
            .catch(() => showError('저장에 실패했어요.'))
            .finally(() => setAdminSaving(false));
    };

    if (loading) return <AppShell><div className="spinner">불러오는 중…</div></AppShell>;
    if (error) return <AppShell><div className="empty">{error}</div></AppShell>;

    if (!isAdmin) {
        return (
            <AppShell>
                <div className="card empty-state-card">
                    <ShieldAlert size={48} color="var(--text-sub)" style={{ marginBottom: 16 }} />
                    <h2 className="page-title" style={{ marginBottom: 8 }}>관리자 전용</h2>
                    <p className="empty-text" style={{ marginBottom: 24 }}>
                        이 메뉴는 관리자만 이용할 수 있어요.<br />
                        관리자 지정은 설정 탭에서 할 수 있어요.
                    </p>
                    <Link href="/home" className="btn btn-primary">
                        홈으로
                    </Link>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <h1 className="page-title">관리</h1>

            {/* ── 탭 ── */}
            <div className="admin-tabs">
                <button className={`admin-tab-btn ${tab === 'meetings' ? 'active' : ''}`} onClick={() => setTab('meetings')}>
                    <Calendar size={16} /> 모임 관리
                </button>
                <button className={`admin-tab-btn ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>
                    <Users size={16} /> 멤버 관리
                </button>
                <button className={`admin-tab-btn ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
                    <Settings size={16} /> 설정
                </button>
            </div>

            {/* ── 모임 관리 탭 ── */}
            {tab === 'meetings' && (
                <>


                    <div className="section-title">등록된 모임 ({meetings.length})</div>
                    {meetings.length === 0 ? (
                        <div className="card">
                            <div className="empty">
                                <Calendar size={40} color="var(--border)" style={{ marginBottom: 16 }} />
                                <div className="empty-text">등록된 모임이 없어요</div>
                            </div>
                        </div>
                    ) : (
                        meetings.map((m) => (
                            <div className="card" key={m.id} style={{ marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                            {m.meetingNumber != null && (
                                                <span style={{
                                                    fontSize: '0.72rem', fontWeight: 700,
                                                    background: 'var(--primary-light)', color: 'var(--primary)',
                                                    borderRadius: 8, padding: '2px 8px', flexShrink: 0,
                                                }}>제{m.meetingNumber}회</span>
                                            )}
                                            <span style={{ fontWeight: 600 }}>『{m.book}』</span>
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)' }}>
                                            {formatDate(m.date, 'dateOnly')} · {getMemberName(members, m.presenterMemberId, '발제자 미정')}
                                        </div>
                                        {m.absentMemberIds && m.absentMemberIds.length > 0 && (
                                            <div style={{ fontSize: '0.78rem', marginTop: 4, color: 'var(--accent)' }}>
                                                불참: {m.absentMemberIds.map(id => getMemberName(members, id)).filter(Boolean).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`badge ${m.status === 'upcoming' ? 'badge-primary' : 'badge-gray'}`}>
                                        {m.status === 'upcoming' ? '예정' : '완료'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/admin/meeting/${m.id}`)}>편집</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMeeting(m.id)}>삭제</button>
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}

            {/* ── 멤버 관리 탭 ── */}
            {tab === 'members' && (
                <>
                    <div className="section-title">멤버 추가</div>
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input className="form-input" placeholder="이름 입력 후 Enter" value={newName}
                                style={{ flex: 1 }}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()} />
                            <button className="btn btn-primary" style={{ flexShrink: 0 }} onClick={handleAddMember} disabled={memberLoading}>추가</button>
                        </div>
                    </div>

                    <div className="section-title">멤버 목록 ({members.length}명)</div>
                    <div className="card">
                        {members.length === 0 ? (
                            <div className="empty">
                                <Users size={40} color="var(--border)" style={{ marginBottom: 16 }} />
                                <div className="empty-text">등록된 멤버가 없어요</div>
                            </div>
                        ) : (
                            members.map((m) => (
                                <div key={m.id} className="presenter-row">
                                    <span className="presenter-name">{m.name}</span>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMember(m.id)}>삭제</button>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {/* ── 설정 탭 ── */}
            {tab === 'settings' && (
                <>
                    <div className="section-title">모임 번호 설정</div>
                    <div className="card">
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)', marginBottom: 16, lineHeight: 1.6 }}>
                            처음 모임을 등록할 때 몇 번째 모임부터 시작할지 설정해요.<br />
                            이후 모임을 추가할 때마다 번호가 자동으로 증가해요.
                        </p>
                        <div className="form-group">
                            <label className="form-label">첫 번째 모임 번호</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    className="form-input"
                                    style={{ flex: 1 }}
                                    type="number"
                                    min={1}
                                    value={firstNumInput}
                                    onChange={(e) => setFirstNumInput(e.target.value)}
                                />
                                <button
                                    className="btn btn-primary"
                                    style={{ flexShrink: 0 }}
                                    onClick={handleSaveSettings}
                                    disabled={settingsSaving}
                                >
                                    {settingsSaving ? '저장 중…' : '저장'}
                                </button>
                            </div>
                        </div>
                        <div className="settings-info-box">
                            현재 설정: 제{settings.firstMeetingNumber}회부터 시작<br />
                            다음 등록할 모임: <strong>제{nextMeetingNumber}회</strong>
                        </div>
                    </div>

                    <div className="section-title">관리자 지정</div>
                    <div className="card">
                        <p className="form-label" style={{ marginBottom: 12 }}>
                            모임 등록·완료 처리·설정 변경은 관리자만 할 수 있어요. 멤버를 선택해 주세요.
                        </p>
                        {members.length === 0 ? (
                            <p className="empty-text">등록된 멤버가 없어요</p>
                        ) : (
                            <div className="admin-member-list">
                                {members.map((m) => {
                                    const isAdminMember = (settings.adminMemberIds ?? []).includes(m.id);
                                    return (
                                        <label key={m.id} className="admin-member-check">
                                            <input
                                                type="checkbox"
                                                checked={isAdminMember}
                                                onChange={() => toggleAdmin(m.id)}
                                                disabled={adminSaving}
                                            />
                                            <span className="presenter-name">{m.name}</span>
                                            {isAdminMember && <span className="badge badge-primary">관리자</span>}
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </AppShell>
    );
}
