'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMembers, getMeetings } from '@/lib/db';
import { Member, Meeting } from '@/lib/types';

interface DataContextValue {
  members: Member[];
  meetings: Meeting[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const DataContext = createContext<DataContextValue>({
  members: [],
  meetings: [],
  loading: true,
  error: null,
  refetch: async () => {},
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [mb, mt] = await Promise.all([getMembers(), getMeetings()]);
      setMembers(mb);
      setMeetings(mt.sort((a, b) => b.date - a.date));
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
    <DataContext.Provider value={{ members, meetings, loading, error, refetch }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
