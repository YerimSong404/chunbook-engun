'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMember } from '@/context/MemberContext';
import { useData } from '@/context/DataContext';
import { updateMember } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { compressImageToDataUrlForAvatar } from '@/lib/image';
import AppShell from '@/components/AppShell';
import { ProfileCard } from '@/components/ProfileCard';
import { BookOpen, Save, ImagePlus, X, LogOut, ArrowLeft } from 'lucide-react';

/** 밝은 파스텔 톤 */
const PROFILE_COLORS = [
    '#FFB5C2', '#B5EAD7', '#C7CEEA', '#FFDAC1',
    '#E2F0CB', '#B4D7FF', '#F9D5E5', '#FFF0B5', '#DDA0DD',
];

export default function MypagePage() {
    const { currentMemberId, nickname, setNickname, setCurrentMemberId } = useMember();
    const { members, meetings, loading, error, refetch } = useData();
    const { showToast, showError } = useToast();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [nickInput, setNickInput] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [color, setColor] = useState('');
    const [saving, setSaving] = useState(false);

    const member = members.find((m) => m.id === currentMemberId) ?? null;

    useEffect(() => {
        if (!loading && currentMemberId && !member) {
            setCurrentMemberId(null);
            router.replace('/');
            return;
        }
        if (!currentMemberId) {
            router.replace('/');
            return;
        }
        if (member) {
            setNickInput(nickname ?? '');
            setStatusMessage(member.statusMessage ?? '');
            setProfileImageUrl(member.profileImageUrl ?? '');
            setColor(member.color ?? '');
        }
    }, [loading, currentMemberId, member?.id, member?.statusMessage, member?.profileImageUrl, member?.color, nickname, router, setCurrentMemberId]);

    const handleSave = async () => {
        if (!currentMemberId || !member) return;
        setSaving(true);
        try {
            const nameToSave = nickInput.trim() || nickname || member.name;
            setNickname(nickInput.trim() || null);
            await updateMember(currentMemberId, {
                statusMessage: statusMessage.trim() || undefined,
                profileImageUrl: profileImageUrl.trim() || undefined,
                color: color.trim() || undefined,
            }, currentMemberId, nameToSave);
            await refetch();
            showToast('프로필이 저장되었어요');
        } catch {
            showError('저장 중 오류가 발생했어요.');
        } finally {
            setSaving(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        compressImageToDataUrlForAvatar(file)
            .then(setProfileImageUrl)
            .catch(() => showError('이미지를 불러올 수 없어요.'));
        e.target.value = '';
    };

    const removeImage = () => setProfileImageUrl('');

    if (!currentMemberId) return null;

    if (loading) return <AppShell><div className="spinner">불러오는 중…</div></AppShell>;
    if (error) return <AppShell><div className="empty">{error}</div></AppShell>;
    if (!member) return null;

    const myPresentedMeetings = meetings
        .filter((m) => m.presenterMemberId === currentMemberId)
        .sort((a, b) => b.date - a.date);

    const displayMember = {
        ...member,
        profileImageUrl: profileImageUrl || member.profileImageUrl,
        statusMessage: statusMessage !== '' ? statusMessage : member.statusMessage,
        color: color || member.color,
    };

    return (
        <AppShell>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
                    <ArrowLeft size={20} /> 뒤로가기
                </button>
            </div>
            <h1 className="page-title">마이페이지</h1>

            <div className="card" style={{ marginBottom: 24 }}>
                <ProfileCard member={displayMember} displayName={nickInput.trim() || nickname || member.name} size="lg" />
            </div>

            <div className="section-title">프로필 수정</div>
            <div className="card profile-edit-form" style={{ marginBottom: 24 }}>
                <div className="profile-edit-field">
                    <label>별명 (앱에서 표시되는 이름)</label>
                    <input
                        type="text"
                        className="profile-edit-status-input"
                        value={nickInput}
                        onChange={(e) => setNickInput(e.target.value)}
                        placeholder="별명을 입력하면 상단에 이 이름이 표시돼요"
                        maxLength={12}
                    />
                </div>
                <div className="profile-edit-field">
                    <label>상태 메시지</label>
                    <input
                        type="text"
                        className="profile-edit-status-input"
                        value={statusMessage}
                        onChange={(e) => setStatusMessage(e.target.value)}
                        placeholder="한 줄로 나를 소개해 보세요"
                        maxLength={80}
                    />
                </div>
                <div className="profile-edit-field">
                    <label>프로필 이미지</label>
                    <div className="profile-edit-image-wrap">
                        <div className="profile-edit-image-preview" style={{ width: 80, height: 80 }}>
                            <div
                                className="profile-edit-image-circle"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 40,
                                    background: 'var(--border)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {profileImageUrl ? (
                                    <img src={profileImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <ImagePlus size={28} color="var(--text-sub)" />
                                )}
                            </div>
                            {profileImageUrl && (
                                <button
                                    type="button"
                                    className="profile-edit-image-remove"
                                    onClick={removeImage}
                                    aria-label="이미지 제거"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="profile-edit-image-input"
                            onChange={handleImageSelect}
                        />
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {profileImageUrl ? '사진 변경' : '사진 올리기'}
                        </button>
                    </div>
                </div>
                <div className="profile-edit-field">
                    <label>대표 컬러</label>
                    <div className="profile-edit-color-grid">
                        {PROFILE_COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={`profile-edit-color-btn ${color === c ? 'active' : ''}`}
                                style={{ background: c }}
                                onClick={() => setColor(c)}
                            />
                        ))}
                    </div>
                </div>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    <Save size={16} /> {saving ? '저장 중…' : '저장'}
                </button>
            </div>

            <div className="section-title">내가 발제한 모임</div>
            {myPresentedMeetings.length === 0 ? (
                <div className="card">
                    <div className="empty">
                        <BookOpen size={40} color="var(--border)" style={{ marginBottom: 16 }} />
                        <div className="empty-text">아직 발제한 모임이 없어요</div>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    <ul className="presented-list">
                        {myPresentedMeetings.map((m) => (
                            <li key={m.id}>
                                <Link href={`/meeting/${m.id}`} className="presented-list-item">
                                    <span className="presented-list-book">{m.book || '책 미정'}</span>
                                    <span className="presented-list-meta">
                                        {formatDate(m.date, 'short')} · {m.status === 'done' ? '완료' : '예정'}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="section-title" style={{ marginTop: 32 }}>계정</div>
            <div className="card">
                <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'center', gap: 8 }}
                    onClick={() => {
                        setCurrentMemberId(null);
                        router.push('/');
                    }}
                >
                    <LogOut size={18} /> 다른 사용자로 변경
                </button>
            </div>
        </AppShell>
    );
}
