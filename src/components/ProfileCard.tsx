'use client';

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import type { Member } from '@/lib/types';

const DEFAULT_NAME_BG = '#C7CEEA';

interface ProfileCardProps {
    member: Member;
    /** 내 프로필인 경우 표시 이름(별명 등) 오버라이드 */
    displayName?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function ProfileCard({ member, displayName, size = 'md' }: ProfileCardProps) {
    const nameBg = member.color?.trim() || DEFAULT_NAME_BG;
    const name = displayName ?? member.name;
    const hasImage = member.profileImageUrl != null && member.profileImageUrl.trim() !== '';
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [member.profileImageUrl]);

    const isSm = size === 'sm';
    const isLg = size === 'lg';
    const avatarSize = isSm ? 40 : isLg ? 72 : 56;
    const nameSize = isSm ? '0.95rem' : isLg ? '1.35rem' : '1.1rem';
    const showFallback = !hasImage || imageError;

    return (
        <div className="profile-card">
            <div
                className="profile-card-avatar"
                style={{
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    background: 'var(--border)',
                    color: 'var(--text-sub)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                {hasImage && !imageError ? (
                    <img
                        src={member.profileImageUrl!}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setImageError(true)}
                    />
                ) : null}
                {showFallback && (
                    <User
                        size={isSm ? 22 : isLg ? 40 : 28}
                        color="#000"
                        strokeWidth={2}
                        style={{ flexShrink: 0 }}
                    />
                )}
            </div>
            <div className="profile-card-body" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span
                    className="profile-card-name-badge"
                    style={{
                        display: 'inline-block',
                        fontSize: nameSize,
                        fontWeight: 700,
                        color: 'var(--text)',
                        background: nameBg,
                        padding: isSm ? '4px 10px' : isLg ? '8px 16px' : '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                    }}
                >
                    {name}
                </span>
                {member.statusMessage != null && member.statusMessage.trim() !== '' && (
                    <div className="profile-card-status" style={{ fontSize: isSm ? '0.8rem' : '0.9rem', color: 'var(--text-sub)' }}>
                        {member.statusMessage.trim()}
                    </div>
                )}
            </div>
        </div>
    );
}
