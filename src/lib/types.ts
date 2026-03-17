// src/lib/types.ts
export interface Member {
    id: string;
    name: string;
    joinedAt: number;
    /** 상태 메시지 (마이페이지) */
    statusMessage?: string;
    /** 프로필 이미지 URL (data URL 또는 외부 URL) */
    profileImageUrl?: string;
    /** 대표 컬러 hex (파스텔 등) */
    color?: string;
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
