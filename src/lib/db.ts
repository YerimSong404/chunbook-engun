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
} from 'firebase/firestore';
import { Member, Meeting, Answer, AppSettings } from './types';

const isReady = () => db !== null;

// ─── Members ───────────────────────────────────────────────
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

export async function addMember(name: string): Promise<Member | null> {
    if (!isReady()) return null;
    const joinedAt = Date.now();
    const ref = await addDoc(collection(db!, 'members'), { name, joinedAt });
    return { id: ref.id, name, joinedAt };
}

const OPTIONAL_MEMBER_KEYS = ['statusMessage', 'profileImageUrl', 'color'];

export async function updateMember(id: string, data: Partial<Omit<Member, 'id'>>): Promise<void> {
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
}

export async function deleteMember(id: string): Promise<void> {
    if (!isReady()) return;
    await deleteDoc(doc(db!, 'members', id));
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

export async function addMeeting(data: Omit<Meeting, 'id'>): Promise<Meeting | null> {
    if (!isReady()) return null;
    const ref = await addDoc(collection(db!, 'meetings'), data);
    return { id: ref.id, ...data };
}

export async function updateMeeting(id: string, data: Partial<Omit<Meeting, 'id'>>): Promise<void> {
    if (!isReady()) return;
    await updateDoc(doc(db!, 'meetings', id), data);
}

export async function deleteMeeting(id: string): Promise<void> {
    if (!isReady()) return;
    await deleteDoc(doc(db!, 'meetings', id));
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
    answer: string
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

export async function updateSettings(data: Partial<AppSettings>): Promise<void> {
    if (!isReady()) return;
    await setDoc(doc(db!, SETTINGS_DOC), data, { merge: true });
}
