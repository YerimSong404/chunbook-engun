'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMembers, getMeetings, getSettings } from '@/lib/db';
import type { AppSettings } from '@/lib/types';
import { Member, Meeting } from '@/lib/types';

const DEFAULT_SETTINGS: AppSettings = { firstMeetingNumber: 1, adminMemberIds: [] };

interface DataContextValue {
  members: Member[];
  meetings: Meeting[];
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const DataContext = createContext<DataContextValue>({
  members: [],
  meetings: [],
  settings: DEFAULT_SETTINGS,
  loading: true,
  error: null,
  refetch: async () => {},
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [mb, mt, st] = await Promise.all([getMembers(), getMeetings(), getSettings()]);
      setMembers(mb);
      setMeetings(mt.sort((a, b) => b.date - a.date));
      setSettings(st);
    } catch (e) {
      console.error('DataContext refetch:', e);
      setError('데이터를 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <DataContext.Provider value={{ members, meetings, settings, loading, error, refetch }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
