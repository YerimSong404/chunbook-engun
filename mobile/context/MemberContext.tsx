import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        const load = async () => {
            const savedId = await AsyncStorage.getItem(STORAGE_KEY);
            const savedNick = await AsyncStorage.getItem(NICKNAME_KEY);
            if (savedId) setCurrentMemberIdState(savedId);
            if (savedNick) setNicknameState(savedNick);
        };
        load();
    }, []);

    const setCurrentMemberId = async (id: string | null) => {
        if (id) {
            await AsyncStorage.setItem(STORAGE_KEY, id);
        } else {
            await AsyncStorage.removeItem(STORAGE_KEY);
            await AsyncStorage.removeItem(NICKNAME_KEY);
            setNicknameState(null);
        }
        setCurrentMemberIdState(id);
    };

    const setNickname = async (name: string | null) => {
        if (name) {
            await AsyncStorage.setItem(NICKNAME_KEY, name);
        } else {
            await AsyncStorage.removeItem(NICKNAME_KEY);
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
