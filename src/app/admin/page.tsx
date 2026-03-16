'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    getMembers, addMember, deleteMember,
    getMeetings, addMeeting, deleteMeeting,
    getSettings, updateSettings,
} from '@/lib/db';
import { Member, Meeting, AppSettings } from '@/lib/types';
import AppShell from '@/components/AppShell';
import { Calendar, Users, Settings } from 'lucide-react';

function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}



type Tab = 'meetings' | 'members' | 'settings';

export default function AdminPage() {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>('meetings');
    const [members, setMembers] = useState<Member[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [settings, setSettings] = useState<AppSettings>({ firstMeetingNumber: 1 });
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);
    const [memberLoading, setMemberLoading] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [firstNumInput, setFirstNumInput] = useState('1');

    useEffect(() => {
        Promise.all([getMembers(), getMeetings(), getSettings()])
            .then(([mb, mt, st]) => {
                setMembers(mb);
                setMeetings(mt.sort((a, b) => b.date - a.date));
                setSettings(st);
                setFirstNumInput(String(st.firstMeetingNumber));
            })
            .finally(() => setLoading(false));
    }, []);

    // 다음 모임 번호 자동 계산
    const nextMeetingNumber = settings.firstMeetingNumber + meetings.length;

    // ── Members ──
    const handleAddMember = async () => {
        if (!newName.trim()) return;
        setMemberLoading(true);
        try {
            const m = await addMember(newName.trim());
            if (m) setMembers((prev) => [...prev, m]);
            setNewName('');
        } catch (e) {
            console.error(e);
        } finally {
            setMemberLoading(false);
        }
    };

    const handleDeleteMember = async (id: string) => {
        if (!confirm('멤버를 삭제할까요?')) return;
        await deleteMember(id);
        setMembers((prev) => prev.filter((m) => m.id !== id));
    };

    // ── Settings ──
    const handleSaveSettings = async () => {
        const num = parseInt(firstNumInput);
        if (isNaN(num) || num < 1) return alert('1 이상의 숫자를 입력해주세요.');
        setSettingsSaving(true);
        await updateSettings({ firstMeetingNumber: num });
        setSettings({ firstMeetingNumber: num });
        setSettingsSaving(false);
        alert('저장됐어요!');
    };



    const handleDeleteMeeting = async (id: string) => {
        if (!confirm('모임을 삭제할까요?')) return;
        await deleteMeeting(id);
        setMeetings((prev) => prev.filter((m) => m.id !== id));
    };

    if (loading) return <AppShell><div className="spinner">불러오는 중…</div></AppShell>;

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
                                                    borderRadius: 100, padding: '2px 8px', flexShrink: 0,
                                                }}>제{m.meetingNumber}회</span>
                                            )}
                                            <span style={{ fontWeight: 600 }}>『{m.book}』</span>
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)' }}>
                                            {formatDate(m.date)} · {members.find(mb => mb.id === m.presenterMemberId)?.name ?? '발제자 미정'}
                                        </div>
                                        {m.absentMemberIds && m.absentMemberIds.length > 0 && (
                                            <div style={{ fontSize: '0.78rem', marginTop: 4, color: 'var(--accent)' }}>
                                                불참: {m.absentMemberIds.map(id => members.find(mb => mb.id === id)?.name).filter(Boolean).join(', ')}
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
                        <div style={{
                            background: 'var(--primary-light)', borderRadius: 10,
                            padding: '12px 16px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 500,
                        }}>
                            현재 설정: 제{settings.firstMeetingNumber}회부터 시작<br />
                            다음 등록할 모임: <strong>제{nextMeetingNumber}회</strong>
                        </div>
                    </div>
                </>
            )}
        </AppShell>
    );
}
