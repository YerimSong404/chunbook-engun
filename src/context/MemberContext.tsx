'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'chun_book_member_id';
const NICKNAME_KEY = 'chun_book_nickname';

interface MemberContextValue {
    currentMemberId: string | null;
    setCurrentMemberId: (id: string | null) => void;
    nickname: string | null;
    setNickname: (name: string | null) => void;
}

const MemberContext = createContext<MemberContextValue>({
    currentMemberId: null,
    setCurrentMemberId: () => { },
    nickname: null,
    setNickname: () => { },
});

export function MemberProvider({ children }: { children: React.ReactNode }) {
    const [currentMemberId, setCurrentMemberIdState] = useState<string | null>(null);
    const [nickname, setNicknameState] = useState<string | null>(null);

    useEffect(() => {
        const savedId = localStorage.getItem(STORAGE_KEY);
        const savedNick = localStorage.getItem(NICKNAME_KEY);
        if (savedId) setCurrentMemberIdState(savedId);
        if (savedNick) setNicknameState(savedNick);
    }, []);

    const setCurrentMemberId = (id: string | null) => {
        if (id) {
            localStorage.setItem(STORAGE_KEY, id);
        } else {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(NICKNAME_KEY);
            setNicknameState(null);
        }
        setCurrentMemberIdState(id);
    };

    const setNickname = (name: string | null) => {
        if (name) {
            localStorage.setItem(NICKNAME_KEY, name);
        } else {
            localStorage.removeItem(NICKNAME_KEY);
        }
        setNicknameState(name);
    };

    return (
        <MemberContext.Provider value={{ currentMemberId, setCurrentMemberId, nickname, setNickname }}>
            {children}
        </MemberContext.Provider>
    );
}

export function useMember() {
    return useContext(MemberContext);
}
