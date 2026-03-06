'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useMember } from '@/context/MemberContext';

const tabs = [
    { href: '/home', label: '홈', icon: '🏠' },
    { href: '/presenters', label: '발제자', icon: '📋' },
    { href: '/record', label: '서기기록', icon: '✏️' },
    { href: '/admin', label: '관리', icon: '⚙️' },
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
