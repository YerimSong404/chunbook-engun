'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useMember } from '@/context/MemberContext';
import { Home, BookOpen, Users, Edit2, Settings } from 'lucide-react';

const tabs = [
    { href: '/home', label: '홈', icon: <Home size={24} /> },
    { href: '/past-meetings', label: '기록', icon: <BookOpen size={24} /> },
    { href: '/presenters', label: '멤버', icon: <Users size={24} /> },
    { href: '/record', label: '서기', icon: <Edit2 size={24} /> },
    { href: '/admin', label: '설정', icon: <Settings size={24} /> },
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
                    <span className="nav-logo" style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BookOpen size={20} color="var(--primary)" strokeWidth={2.5} style={{ marginTop: -2 }} /> 
                        <span style={{ fontWeight: 800 }}>천북인권</span>
                    </span>
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
                                    <button className="nav-nick-save" style={{ background: 'var(--primary)', color: '#FFF' }} onClick={saveNick}>저장</button>
                                    <button className="nav-nick-cancel" onClick={() => setEditingNick(false)}>✕</button>
                                </>
                            ) : (
                                <>
                                    <span className="nav-member-name" onClick={startEditNick} title="클릭해서 별명 변경">
                                        {nickname ?? '별명없음'} <Edit2 size={14} style={{ marginLeft: 4, marginBottom: -2 }} />
                                    </span>
                                    <span className="nav-member-change" style={{ color: 'var(--primary)' }} onClick={() => setCurrentMemberId(null)}>
                                        변경
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </nav>
            <main className="main">{children}</main>
            <nav className="tab-bar">
                {tabs.map((tab) => {
                    const isActive = pathname.startsWith(tab.href);
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`tab-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
