import { db } from './firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    deleteField,
    query,
    orderBy,
    where,
    writeBatch,
} from 'firebase/firestore';
import { Member, Meeting, Answer, AppSettings, LogEvent, LogAction, LogTarget } from './types';

const isReady = () => db !== null;

// ─── Logs ──────────────────────────────────────────────
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function logEvent(params: {
    action: LogAction;
    target: LogTarget;
    targetId?: string;
    label?: string;
    memberId?: string;
    memberName?: string;
    detail?: string;
}): Promise<void> {
    if (!isReady()) return;
    try {
        const now = Date.now();
        const payload: Record<string, any> = {
            createdAt: now,
            expiresAt: now + SEVEN_DAYS_MS,
        };
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined) payload[k] = v;
        }
        await addDoc(collection(db!, 'logs'), payload);
    } catch (e) {
        console.error('logEvent:', e);
    }
}

export async function getLogs(): Promise<LogEvent[]> {
    if (!isReady()) return [];
    try {
        const now = Date.now();
        // 만료된 로그 일괄 삭제
        const expiredSnap = await getDocs(
            query(collection(db!, 'logs'), where('expiresAt', '<', now))
        );
        if (!expiredSnap.empty) {
            const batch = writeBatch(db!);
            expiredSnap.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();
        }
        // 유효 로그 조회
        const snap = await getDocs(
            query(collection(db!, 'logs'), orderBy('createdAt', 'desc'))
        );
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LogEvent, 'id'>) }));
    } catch (e) {
        console.error('getLogs:', e);
        return [];
    }
}

export async function getMembers(): Promise<Member[]> {
    if (!isReady()) return [];
    try {
        const snap = await getDocs(query(collection(db!, 'members'), orderBy('joinedAt')));
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Member, 'id'>) }));
    } catch (e) {
        console.error('getMembers:', e);
        return [];
    }
}

export async function addMember(name: string, actorId?: string, actorName?: string): Promise<Member | null> {
    if (!isReady()) return null;
    const joinedAt = Date.now();
    const ref = await addDoc(collection(db!, 'members'), { name, joinedAt });
    logEvent({ action: 'create', target: 'member', targetId: ref.id, label: name, memberId: actorId, memberName: actorName });
    return { id: ref.id, name, joinedAt };
}

const OPTIONAL_MEMBER_KEYS = ['statusMessage', 'profileImageUrl', 'color'];

export async function updateMember(id: string, data: Partial<Omit<Member, 'id'>>, actorId?: string, actorName?: string): Promise<void> {
    if (!isReady()) return;
    const updateData: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
        if (OPTIONAL_MEMBER_KEYS.includes(k) && (v === undefined || v === '')) {
            updateData[k] = deleteField();
        } else if (v !== undefined) {
            updateData[k] = v;
        }
    }
    if (Object.keys(updateData).length === 0) return;
    await updateDoc(doc(db!, 'members', id), updateData);
    logEvent({ action: 'update', target: 'member', targetId: id, label: data.name || actorName || '프로필', memberId: actorId, memberName: actorName });
}

export async function deleteMember(id: string, label?: string, actorId?: string, actorName?: string): Promise<void> {
    if (!isReady()) return;
    await deleteDoc(doc(db!, 'members', id));
    logEvent({ action: 'delete', target: 'member', targetId: id, label, memberId: actorId, memberName: actorName });
}

// ─── Meetings ──────────────────────────────────────────────
export async function getMeetings(): Promise<Meeting[]> {
    if (!isReady()) return [];
    try {
        const snap = await getDocs(query(collection(db!, 'meetings'), orderBy('date', 'desc')));
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Meeting, 'id'>) }));
    } catch (e) {
        console.error('getMeetings:', e);
        return [];
    }
}

export async function getMeeting(id: string): Promise<Meeting | null> {
    if (!isReady()) return null;
    try {
        const snap = await getDoc(doc(db!, 'meetings', id));
        if (!snap.exists()) return null;
        return { id: snap.id, ...(snap.data() as Omit<Meeting, 'id'>) };
    } catch (e) {
        console.error('getMeeting:', e);
        return null;
    }
}

export async function addMeeting(data: Omit<Meeting, 'id'>, actorId?: string, actorName?: string): Promise<Meeting | null> {
    if (!isReady()) return null;
    const ref = await addDoc(collection(db!, 'meetings'), data);
    logEvent({ action: 'create', target: 'meeting', targetId: ref.id, label: data.book || '제목 없음', memberId: actorId, memberName: actorName });
    return { id: ref.id, ...data };
}

export async function updateMeeting(id: string, data: Partial<Omit<Meeting, 'id'>>, actorId?: string, actorName?: string): Promise<void> {
    if (!isReady()) return;
    await updateDoc(doc(db!, 'meetings', id), data);
    logEvent({ action: 'update', target: 'meeting', targetId: id, label: data.book, memberId: actorId, memberName: actorName });
}

export async function deleteMeeting(id: string, label?: string, actorId?: string, actorName?: string): Promise<void> {
    if (!isReady()) return;
    await deleteDoc(doc(db!, 'meetings', id));
    logEvent({ action: 'delete', target: 'meeting', targetId: id, label, memberId: actorId, memberName: actorName });
}

// ─── Answers ───────────────────────────────────────────────
export async function getAnswers(meetingId: string): Promise<Answer[]> {
    if (!isReady()) return [];
    try {
        const snap = await getDocs(collection(db!, 'meetings', meetingId, 'answers'));
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Answer, 'id'>) }));
    } catch (e) {
        console.error('getAnswers:', e);
        return [];
    }
}

export async function saveAnswer(
    meetingId: string,
    memberId: string,
    topicIndex: number,
    answer: string,
    memberName?: string,
    meetingLabel?: string
): Promise<void> {
    if (!isReady()) return;
    const docId = `${topicIndex}_${memberId}`;
    await setDoc(doc(db!, 'meetings', meetingId, 'answers', docId), {
        meetingId,
        memberId,
        topicIndex,
        answer,
        updatedAt: Date.now(),
    });
    logEvent({ action: 'update', target: 'answer', targetId: docId, label: meetingLabel, memberId, memberName, detail: `발제문 ${topicIndex + 1}번` });
}

// ─── Settings ──────────────────────────────────────────
const SETTINGS_DOC = 'settings/general';

const DEFAULT_SETTINGS: AppSettings = { firstMeetingNumber: 1, adminMemberIds: [] };

export async function getSettings(): Promise<AppSettings> {
    if (!isReady()) return DEFAULT_SETTINGS;
    try {
        const snap = await getDoc(doc(db!, SETTINGS_DOC));
        if (!snap.exists()) return DEFAULT_SETTINGS;
        const data = snap.data() as AppSettings;
        return { ...DEFAULT_SETTINGS, ...data };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export async function updateSettings(data: Partial<AppSettings>, actorId?: string, actorName?: string): Promise<void> {
    if (!isReady()) return;
    await setDoc(doc(db!, SETTINGS_DOC), data, { merge: true });
    logEvent({ action: 'update', target: 'settings', memberId: actorId, memberName: actorName });
}
