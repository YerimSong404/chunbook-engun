import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useAlert } from '../../context/AlertContext';
import {
    getMembers, addMember, deleteMember,
    getMeetings, addMeeting, updateMeeting, deleteMeeting,
    getSettings, updateSettings,
} from '../../lib/db';
import { Member, Meeting, AppSettings } from '../../lib/types';
import { Feather } from '@expo/vector-icons';

function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const emptyForm = {
    date: '',
    book: '',
    author: '',
    presenterMemberId: '',
    status: 'upcoming' as 'upcoming' | 'done',
    topics: ['', '', ''],
    coverImageUrl: '',
    meetingNumber: '',
    absentMemberIds: [] as string[],
};

type Tab = 'meetings' | 'members' | 'settings';

export default function AdminScreen() {
    const { showAlert } = useAlert();
    const [tab, setTab] = useState<Tab>('meetings');
    const [members, setMembers] = useState<Member[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [settings, setSettings] = useState<AppSettings>({ firstMeetingNumber: 1 });
    const [newName, setNewName] = useState('');
    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [memberLoading, setMemberLoading] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [firstNumInput, setFirstNumInput] = useState('1');

    useEffect(() => {
        Promise.all([getMembers(), getMeetings(), getSettings()])
            .then(([mb, mt, st]) => {
                setMembers(mb);
                setMeetings(mt.sort((a, b) => b.date - a.date));
                setSettings(st);
                setFirstNumInput(String(st.firstMeetingNumber));
            })
            .finally(() => setLoading(false));
    }, []);

    const nextMeetingNumber = settings.firstMeetingNumber + meetings.length;

    // ── Members ──
    const handleAddMember = async () => {
        if (!newName.trim()) return;
        setMemberLoading(true);
        try {
            const m = await addMember(newName.trim());
            if (m) setMembers((prev) => [...prev, m]);
            setNewName('');
        } catch (e) {
            console.error(e);
        } finally {
            setMemberLoading(false);
        }
    };

    const handleDeleteMember = async (id: string) => {
        showAlert('멤버 삭제', '멤버를 삭제할까요?', [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제', style: 'destructive', onPress: async () => {
                    await deleteMember(id);
                    setMembers((prev) => prev.filter((m) => m.id !== id));
                }
            }
        ]);
    };

    // ── Settings ──
    const handleSaveSettings = async () => {
        const num = parseInt(firstNumInput);
        if (isNaN(num) || num < 1) return showAlert('오류', '1 이상의 숫자를 입력해주세요.');
        setSettingsSaving(true);
        await updateSettings({ firstMeetingNumber: num });
        setSettings({ firstMeetingNumber: num });
        setSettingsSaving(false);
        showAlert('알림', '저장됐어요!');
    };

    // ── Meetings ──
    const handleTopicChange = (i: number, val: string) => {
        setForm((prev) => {
            const topics = [...prev.topics];
            topics[i] = val;
            return { ...prev, topics };
        });
    };
    const addTopicSlot = () => {
        if (form.topics.length >= 10) return;
        setForm((prev) => ({ ...prev, topics: [...prev.topics, ''] }));
    };
    const removeTopicSlot = (i: number) => {
        if (form.topics.length <= 3) return;
        setForm((prev) => ({ ...prev, topics: prev.topics.filter((_, idx) => idx !== i) }));
    };

    const handleEditMeeting = (m: Meeting) => {
        setEditId(m.id);
        setForm({
            date: new Date(m.date).toISOString().slice(0, 10),
            book: m.book,
            author: m.author,
            presenterMemberId: m.presenterMemberId,
            status: m.status,
            topics: m.topics.length >= 3 ? m.topics : [...m.topics, ...Array(3 - m.topics.length).fill('')],
            coverImageUrl: m.coverImageUrl ?? '',
            meetingNumber: m.meetingNumber != null ? String(m.meetingNumber) : '',
            absentMemberIds: m.absentMemberIds ?? [],
        });
    };

    const handleSubmitMeeting = async () => {
        if (!editId) return;
        if (!form.date || !form.book) return showAlert('오류', '날짜와 책 제목은 필수입니다.');
        const meetingNumberVal = form.meetingNumber.trim()
            ? parseInt(form.meetingNumber)
            : undefined;

        const data = {
            date: new Date(form.date).getTime(),
            book: form.book.trim(),
            author: form.author.trim(),
            presenterMemberId: form.presenterMemberId,
            topics: form.topics.map((t) => t.trim()).filter(Boolean),
            status: form.status,
            absentMemberIds: form.absentMemberIds,
            ...(form.coverImageUrl.trim() ? { coverImageUrl: form.coverImageUrl.trim() } : {}),
            ...(meetingNumberVal != null ? { meetingNumber: meetingNumberVal } : {}),
        };
        await updateMeeting(editId, data);
        setMeetings((prev) => prev.map((m) => m.id === editId ? { ...m, ...data } : m));

        setForm(emptyForm);
        setEditId(null);
    };

    const handleDeleteMeeting = async (id: string) => {
        showAlert('모임 삭제', '모임을 삭제할까요?', [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제', style: 'destructive', onPress: async () => {
                    await deleteMeeting(id);
                    setMeetings((prev) => prev.filter((m) => m.id !== id));
                }
            }
        ]);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#8C7D6B" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.pageTitle}>관리</Text>

                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tabBtn, tab === 'meetings' && styles.tabBtnActive]}
                        onPress={() => setTab('meetings')}
                    >
                        <Feather name="calendar" size={16} color={tab === 'meetings' ? '#2C2724' : '#8C7D6B'} style={{ marginBottom: 4 }} />
                        <Text style={[styles.tabBtnText, tab === 'meetings' && styles.tabBtnTextActive]}>모임</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabBtn, tab === 'members' && styles.tabBtnActive]}
                        onPress={() => setTab('members')}
                    >
                        <Feather name="users" size={16} color={tab === 'members' ? '#2C2724' : '#8C7D6B'} style={{ marginBottom: 4 }} />
                        <Text style={[styles.tabBtnText, tab === 'members' && styles.tabBtnTextActive]}>멤버</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabBtn, tab === 'settings' && styles.tabBtnActive]}
                        onPress={() => setTab('settings')}
                    >
                        <Feather name="settings" size={16} color={tab === 'settings' ? '#2C2724' : '#8C7D6B'} style={{ marginBottom: 4 }} />
                        <Text style={[styles.tabBtnText, tab === 'settings' && styles.tabBtnTextActive]}>설정</Text>
                    </TouchableOpacity>
                </View>

                {tab === 'meetings' && (
                    <View>
                        {editId && (
                            <View style={styles.editCard}>
                                <Text style={styles.sectionTitle}>모임 편집</Text>

                                <Text style={styles.label}>모임 번호</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    placeholder="번호 입력"
                                    placeholderTextColor="#C1B7A7"
                                    value={form.meetingNumber}
                                    onChangeText={(t) => setForm((p) => ({ ...p, meetingNumber: t }))}
                                />

                                <Text style={styles.label}>모임 날짜 * (YYYY-MM-DD)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#C1B7A7"
                                    value={form.date}
                                    onChangeText={(t) => setForm((p) => ({ ...p, date: t }))}
                                />

                                <Text style={styles.label}>책 제목 *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="예: 채식주의자"
                                    placeholderTextColor="#C1B7A7"
                                    value={form.book}
                                    onChangeText={(t) => setForm((p) => ({ ...p, book: t }))}
                                />

                                <Text style={styles.label}>저자</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="예: 한강"
                                    placeholderTextColor="#C1B7A7"
                                    value={form.author}
                                    onChangeText={(t) => setForm((p) => ({ ...p, author: t }))}
                                />

                                <Text style={styles.label}>책 표지 이미지 URL (선택)</Text>
                                <View style={styles.coverInputRow}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                        placeholder="https://image.yes24.com/..."
                                        placeholderTextColor="#C1B7A7"
                                        value={form.coverImageUrl}
                                        onChangeText={(t) => setForm((p) => ({ ...p, coverImageUrl: t }))}
                                    />
                                    {form.coverImageUrl.trim() ? (
                                        <Image
                                            source={{ uri: form.coverImageUrl }}
                                            style={styles.coverPreview}
                                        />
                                    ) : null}
                                </View>

                                <Text style={styles.label}>발제자</Text>
                                <View style={styles.pickerWrap}>
                                    {Platform.OS === 'web' ? (
                                        <select
                                            style={styles.webSelect}
                                            value={form.presenterMemberId}
                                            onChange={(e) => setForm({ ...form, presenterMemberId: e.target.value })}
                                        >
                                            <option value="">— 선택 안 함 —</option>
                                            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    ) : (
                                        <Picker
                                            selectedValue={form.presenterMemberId}
                                            onValueChange={(val) => setForm({ ...form, presenterMemberId: val })}
                                            style={styles.picker}
                                        >
                                            <Picker.Item label="— 선택 안 함 —" value="" />
                                            {members.map((m) => (
                                                <Picker.Item key={m.id} label={m.name} value={m.id} />
                                            ))}
                                        </Picker>
                                    )}
                                </View>

                                <View style={styles.topicHeader}>
                                    <Text style={styles.label}>발제 주제 ({form.topics.length}/10)</Text>
                                    {form.topics.length < 10 && (
                                        <TouchableOpacity onPress={addTopicSlot}>
                                            <Text style={styles.addBtnText}>+ 추가</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {form.topics.map((t, i) => (
                                    <View key={i} style={styles.topicRow}>
                                        <View style={styles.topicNumBadge}>
                                            <Text style={styles.topicNumText}>{i + 1}</Text>
                                        </View>
                                        <TextInput
                                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                            placeholder={`주제 ${i + 1}`}
                                            placeholderTextColor="#C1B7A7"
                                            value={t}
                                            onChangeText={(val) => handleTopicChange(i, val)}
                                        />
                                        {form.topics.length > 3 && (
                                            <TouchableOpacity onPress={() => removeTopicSlot(i)} style={styles.removeTopicBtn}>
                                                <Feather name="x" size={20} color="#B07D4F" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}

                                <View style={styles.editActionsRow}>
                                    <TouchableOpacity style={[styles.btn, styles.btnPrimary, { flex: 1 }]} onPress={handleSubmitMeeting}>
                                        <Text style={styles.btnPrimaryText}>수정 완료</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.btn, styles.btnGhost, { flex: 1 }]} onPress={() => { setEditId(null); setForm(emptyForm); }}>
                                        <Text style={styles.btnGhostText}>취소</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <Text style={styles.sectionTitle}>등록된 모임 ({meetings.length})</Text>
                        {meetings.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Feather name="calendar" size={40} color="#C1B7A7" style={{ marginBottom: 12 }} />
                                <Text style={styles.emptyText}>등록된 모임이 없어요</Text>
                            </View>
                        ) : (
                            meetings.map((m) => (
                                <View key={m.id} style={styles.meetingCard}>
                                    <View style={styles.meetingCardHeader}>
                                        <View style={styles.meetingCardInfo}>
                                            <View style={styles.meetingCardTitleRow}>
                                                {m.meetingNumber != null && (
                                                    <View style={styles.meetingNumberBadge}>
                                                        <Text style={styles.meetingNumberText}>제{m.meetingNumber}회</Text>
                                                    </View>
                                                )}
                                                <Text style={styles.meetingBookTitle}>『{m.book}』</Text>
                                            </View>
                                            <Text style={styles.meetingMeta}>
                                                {formatDate(m.date)} · {members.find(mb => mb.id === m.presenterMemberId)?.name ?? '발제자 미정'}
                                            </Text>
                                            {m.absentMemberIds && m.absentMemberIds.length > 0 && (
                                                <Text style={styles.meetingAbsentText}>
                                                    불참: {m.absentMemberIds.map(id => members.find(mb => mb.id === id)?.name).filter(Boolean).join(', ')}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={[styles.statusBadge, m.status === 'upcoming' ? styles.statusUpcoming : styles.statusDone]}>
                                            <Text style={[m.status === 'upcoming' ? styles.statusUpcomingText : styles.statusDoneText]}>
                                                {m.status === 'upcoming' ? '예정' : '완료'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.meetingCardActions}>
                                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditMeeting(m)}>
                                            <Text style={styles.actionBtnText}>편집</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.actionBtnDanger} onPress={() => handleDeleteMeeting(m.id)}>
                                            <Text style={styles.actionBtnDangerText}>삭제</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {tab === 'members' && (
                    <View>
                        <Text style={styles.sectionTitle}>멤버 추가</Text>
                        <View style={styles.cardHeader}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 12 }]}
                                placeholder="이름 입력 후 추가"
                                placeholderTextColor="#C1B7A7"
                                value={newName}
                                onChangeText={setNewName}
                            />
                            <TouchableOpacity
                                style={[styles.btn, styles.btnPrimary, memberLoading && styles.btnDisabled]}
                                onPress={handleAddMember}
                                disabled={memberLoading}
                            >
                                <Text style={styles.btnPrimaryText}>추가</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionTitle}>멤버 목록 ({members.length}명)</Text>
                        <View style={styles.card}>
                            {members.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Feather name="users" size={40} color="#C1B7A7" style={{ marginBottom: 12 }} />
                                    <Text style={styles.emptyTextSub}>등록된 멤버가 없어요</Text>
                                </View>
                            ) : (
                                members.map((m, index) => (
                                    <View key={m.id} style={[styles.row, index === members.length - 1 && styles.rowLast]}>
                                        <Text style={styles.rowName}>{m.name}</Text>
                                        <TouchableOpacity style={styles.actionBtnDanger} onPress={() => handleDeleteMember(m.id)}>
                                            <Text style={styles.actionBtnDangerText}>삭제</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                )}

                {tab === 'settings' && (
                    <View>
                        <Text style={styles.sectionTitle}>모임 번호 설정</Text>
                        <View style={styles.card}>
                            <Text style={styles.settingsDesc}>
                                처음 모임을 등록할 때 몇 번째 모임부터 시작할지 설정해요.{'\n'}
                                이후 모임을 추가할 때마다 번호가 자동으로 증가해요.
                            </Text>

                            <Text style={styles.label}>첫 번째 모임 번호</Text>
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    keyboardType="numeric"
                                    value={firstNumInput}
                                    onChangeText={setFirstNumInput}
                                    placeholderTextColor="#C1B7A7"
                                />
                                <TouchableOpacity
                                    style={[styles.btn, styles.btnPrimary, settingsSaving && styles.btnDisabled]}
                                    onPress={handleSaveSettings}
                                    disabled={settingsSaving}
                                >
                                    <Text style={styles.btnPrimaryText}>{settingsSaving ? '저장 중…' : '저장'}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.settingsAlert}>
                                <Text style={styles.settingsAlertText}>
                                    현재 설정: 제{settings.firstMeetingNumber}회부터 시작{'\n'}
                                    다음 등록할 모임: <Text style={{ fontWeight: '700' }}>제{nextMeetingNumber}회</Text>
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBF7' },
    container: { flex: 1, backgroundColor: '#FDFBF7' },
    content: { padding: 24, paddingBottom: 60 },
    pageTitle: { fontSize: 26, fontWeight: '600', color: '#2C2724', marginBottom: 24, letterSpacing: -0.5 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2C2724', marginBottom: 16, marginTop: 8 },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FAFAFA',
        padding: 6,
        borderRadius: 6,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: '#EBE5D9',
    },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
    tabBtnActive: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#3A3125', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
    tabBtnText: { fontSize: 13, fontWeight: '500', color: '#8C7D6B' },
    tabBtnTextActive: { color: '#2C2724', fontWeight: '600' },
    card: { backgroundColor: '#FFFFFF', borderRadius: 6, padding: 24, marginBottom: 24, elevation: 4, shadowColor: '#3A3125', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
    editCard: {
        backgroundColor: '#FCFAF5', borderRadius: 6, padding: 24, marginBottom: 32,
        borderWidth: 1, borderColor: '#D4C8B8',
    },
    label: { fontSize: 13, fontWeight: '600', color: '#7A7265', marginBottom: 8, letterSpacing: 0.5 },
    input: {
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0EBE1', borderRadius: 6, padding: 16, fontSize: 15, marginBottom: 20, color: '#2C2724'
    },
    coverInputRow: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 20 },
    coverPreview: { width: 44, height: 62, borderRadius: 6, backgroundColor: '#F9F6F0', borderWidth: 1, borderColor: '#F0EBE1' },
    pickerWrap: { borderWidth: 1, borderColor: '#F0EBE1', borderRadius: 6, marginBottom: 20, overflow: 'hidden', backgroundColor: '#FFFFFF' },
    webSelect: { width: '100%', padding: 14, fontSize: 15, borderWidth: 0, backgroundColor: 'transparent', color: '#2C2724' },
    picker: { width: '100%', height: 54, color: '#2C2724' },
    topicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    addBtnText: { color: '#695D4A', fontSize: 14, fontWeight: '600' },
    topicRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'center' },
    topicNumBadge: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: '#F9F6F0',
        justifyContent: 'center', alignItems: 'center',
    },
    topicNumText: { color: '#695D4A', fontSize: 13, fontWeight: '700' },
    removeTopicBtn: { padding: 8 },
    editActionsRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
    btn: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    btnPrimary: { backgroundColor: '#695D4A' },
    btnPrimaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
    btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#D4C8B8' },
    btnGhostText: { color: '#695D4A', fontSize: 15, fontWeight: '600' },
    btnDisabled: { opacity: 0.5 },
    emptyCard: { alignItems: 'center', padding: 40, backgroundColor: '#FFFFFF', borderRadius: 6, elevation: 4, shadowColor: '#3A3125', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
    emptyText: { fontSize: 15, color: '#7A7265' },
    emptyTextSub: { fontSize: 14, color: '#A0968A', textAlign: 'center' },
    emptyContainer: { alignItems: 'center', padding: 24 },
    meetingCard: { backgroundColor: '#FFFFFF', borderRadius: 6, padding: 24, marginBottom: 16, elevation: 4, shadowColor: '#3A3125', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
    meetingCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    meetingCardInfo: { flex: 1, paddingRight: 12 },
    meetingCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    meetingNumberBadge: { backgroundColor: '#F0EBE1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    meetingNumberText: { color: '#695D4A', fontSize: 11, fontWeight: '600' },
    meetingBookTitle: { fontSize: 16, fontWeight: '600', color: '#2C2724', letterSpacing: -0.3 },
    meetingMeta: { fontSize: 13, color: '#7A7265', lineHeight: 20 },
    meetingAbsentText: { fontSize: 12, color: '#B07D4F', marginTop: 6 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    statusUpcoming: { backgroundColor: '#F0EBE1' },
    statusUpcomingText: { color: '#695D4A', fontSize: 11, fontWeight: '600' },
    statusDone: { backgroundColor: '#F0F0F0' },
    statusDoneText: { color: '#7A7265', fontSize: 11, fontWeight: '600' },
    meetingCardActions: { flexDirection: 'row', gap: 10 },
    actionBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#F9F6F0' },
    actionBtnText: { color: '#695D4A', fontSize: 13, fontWeight: '600' },
    actionBtnDanger: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EBE5D9' },
    actionBtnDangerText: { color: '#B07D4F', fontSize: 13, fontWeight: '600' },
    cardHeader: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 6, padding: 20, marginBottom: 32, elevation: 4, shadowColor: '#3A3125', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#FDFBF7' },
    rowLast: { borderBottomWidth: 0, paddingBottom: 0 },
    rowName: { fontSize: 16, fontWeight: '500', color: '#2C2724' },
    settingsDesc: { fontSize: 14, color: '#7A7265', lineHeight: 24, marginBottom: 24 },
    settingsAlert: { backgroundColor: '#FAEDDF', padding: 16, borderRadius: 6 },
    settingsAlertText: { color: '#8C5D3A', fontSize: 14, lineHeight: 22, fontWeight: '500' },
});
