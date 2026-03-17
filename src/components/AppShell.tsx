'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMember } from '@/context/MemberContext';
import { Home, BookOpen, Users, Edit2, Settings, User } from 'lucide-react';

const tabs = [
    { href: '/home', label: '홈', icon: <Home size={24} /> },
    { href: '/past-meetings', label: '기록', icon: <BookOpen size={24} /> },
    { href: '/presenters', label: '멤버', icon: <Users size={24} /> },
    { href: '/record', label: '서기', icon: <Edit2 size={24} /> },
    { href: '/admin', label: '설정', icon: <Settings size={24} /> },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { currentMemberId, setCurrentMemberId } = useMember();

    return (
        <div className="page">
            <nav className="nav">
                <div className="nav-inner">
                    <span className="nav-logo" style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BookOpen size={20} color="var(--primary)" strokeWidth={2.5} style={{ marginTop: -2 }} /> 
                        <span style={{ fontWeight: 800 }}>천북인권</span>
                    </span>
                    {currentMemberId && (
                        <Link href="/mypage" className="nav-member-mypage-btn">
                            <User size={14} color="#000" strokeWidth={2.5} /> 마이페이지
                        </Link>
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
