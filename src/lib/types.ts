// src/lib/types.ts
export interface Member {
    id: string;
    name: string;
    joinedAt: number;
}

export interface Meeting {
    id: string;
    date: number; // timestamp ms
    book: string;
    author: string;
    presenterMemberId: string;
    topics: string[]; // 4~6개
    status: 'upcoming' | 'done';
    coverImageUrl?: string;
    meetingNumber?: number;
    absentMemberIds?: string[]; // 불참자 목록
}

export interface Answer {
    id: string;
    meetingId: string;
    memberId: string;
    topicIndex: number;
    answer: string;
    updatedAt: number;
}

export interface AppSettings {
    firstMeetingNumber: number; // 첫 번째 모임의 번호 (기본값 1)
    adminMemberIds?: string[];  // 관리자로 지정된 멤버 ID 목록
}
