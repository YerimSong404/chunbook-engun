'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useMember } from '@/context/MemberContext';

const tabs = [
    {
        href: '/home', label: '홈', icon: (
            <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )
    },
    {
        href: '/past-meetings', label: '이전 모임', icon: (
            <svg viewBox="0 0 24 24"><path d="M4 6h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 0V4a2 2 0 012-2h12a2 2 0 012 2v2M8 10h8M8 14h5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )
    },
    {
        href: '/presenters', label: '발제자', icon: (
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M8 10h8M8 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        )
    },
    {
        href: '/record', label: '서기기록', icon: (
            <svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )
    },
    {
        href: '/admin', label: '관리', icon: (
            <svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        )
    },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { currentMemberId, setCurrentMemberId, nickname, setNickname } = useMember();
    const [editingNick, setEditingNick] = useState(false);
    const [nickInput, setNickInput] = useState('');

    const startEditNick = () => {
        setNickInput(nickname ?? '');
        setEditingNick(true);
    };

    const saveNick = () => {
        setNickname(nickInput.trim() || null);
        setEditingNick(false);
    };

    return (
        <div className="page">
            <nav className="nav">
                <div className="nav-inner">
                    <span className="nav-logo">📚 천북인권</span>
                    {currentMemberId && (
                        <div className="nav-member">
                            {editingNick ? (
                                <>
                                    <input
                                        className="nav-nick-input"
                                        value={nickInput}
                                        onChange={(e) => setNickInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') saveNick(); if (e.key === 'Escape') setEditingNick(false); }}
                                        maxLength={12}
                                        autoFocus
                                        placeholder="별명 입력"
                                    />
                                    <button className="nav-nick-save" onClick={saveNick}>저장</button>
                                    <button className="nav-nick-cancel" onClick={() => setEditingNick(false)}>✕</button>
                                </>
                            ) : (
                                <>
                                    <span className="nav-member-name" onClick={startEditNick} title="클릭해서 별명 변경">
                                        {nickname ?? '별명없음'} ✏️
                                    </span>
                                    <span className="nav-member-change" onClick={() => setCurrentMemberId(null)}>
                                        나 바꾸기
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </nav>
            <main className="main">{children}</main>
            <nav className="tab-bar">
                {tabs.map((tab) => (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={`tab-item ${pathname.startsWith(tab.href) ? 'active' : ''}`}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span>{tab.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
