import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMember } from '../../context/MemberContext';
import { getMeetings, getMembers, getAnswers, saveAnswer, updateMeeting } from '../../lib/db';
import { Meeting, Member } from '../../lib/types';
import { Picker } from '@react-native-picker/picker';

function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

function AbsentSelector({
    members,
    absentIds,
    onChange,
}: {
    members: Member[];
    absentIds: string[];
    onChange: (ids: string[]) => void;
}) {
    const toggle = (id: string) => {
        onChange(
            absentIds.includes(id)
                ? absentIds.filter((x) => x !== id)
                : [...absentIds, id]
        );
    };
    return (
        <View style={styles.absentContainer}>
            {members.map((m) => {
                const checked = absentIds.includes(m.id);
                return (
                    <TouchableOpacity
                        key={m.id}
                        onPress={() => toggle(m.id)}
                        style={[styles.absentBtn, checked && styles.absentBtnChecked]}
                    >
                        <Text style={[styles.absentBtnText, checked && styles.absentBtnCheckedText]}>
                            {checked ? '✗ ' : ''}{m.name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default function RecordScreen() {
    const { currentMemberId } = useMember();
    const router = useRouter();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
    const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
    const [saving, setSaving] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [absentIds, setAbsentIds] = useState<string[]>([]);
    const [absentSaving, setAbsentSaving] = useState(false);
    const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!currentMemberId) {
            setLoading(false);
            router.replace('/');
            return;
        }
        Promise.all([getMeetings(), getMembers()])
            .then(([mt, mb]) => {
                setMeetings(mt);
                setMembers(mb);
                const upcoming = mt.filter(m => m.status === 'upcoming').sort((a, b) => a.date - b.date);
                const first = upcoming[0] ?? mt[0] ?? null;
                if (first) {
                    setSelectedMeetingId(first.id);
                    setAbsentIds(first.absentMemberIds ?? []);
                }
            })
            .finally(() => setLoading(false));
    }, [currentMemberId, router]);

    useEffect(() => {
        if (!selectedMeetingId) return;
        setSelectedTopicIndex(null);
        getAnswers(selectedMeetingId).then((ans) => {
            const map: Record<string, Record<string, string>> = {};
            ans.forEach((a) => {
                if (!map[a.memberId]) map[a.memberId] = {};
                map[a.memberId][a.topicIndex] = a.answer;
            });
            setAnswers(map);
        });
        const mt = meetings.find((m) => m.id === selectedMeetingId);
        setAbsentIds(mt?.absentMemberIds ?? []);
    }, [selectedMeetingId, meetings]);

    const handleTopicSave = async (topicIndex: number) => {
        if (!selectedMeetingId) return;
        setSaving(`topic_${topicIndex}`);

        const presentMembers = members.filter((m) => !absentIds.includes(m.id));
        const promises = presentMembers.map((mb) => {
            const val = answers[mb.id]?.[topicIndex] ?? '';
            return saveAnswer(selectedMeetingId, mb.id, topicIndex, val);
        });

        await Promise.all(promises);
        setSaving(null);
        Alert.alert('저장 완료', '답변이 성공적으로 저장되었습니다.');
    };

    const handleChange = (memberId: string, topicIndex: number, value: string) => {
        setAnswers((prev) => ({
            ...prev,
            [memberId]: { ...(prev[memberId] ?? {}), [topicIndex]: value },
        }));
    };

    const handleAbsentChange = async (ids: string[]) => {
        setAbsentIds(ids);
        if (!selectedMeetingId) return;
        setAbsentSaving(true);
        await updateMeeting(selectedMeetingId, { absentMemberIds: ids });
        setMeetings((prev) =>
            prev.map((m) => m.id === selectedMeetingId ? { ...m, absentMemberIds: ids } : m)
        );
        setAbsentSaving(false);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0070f3" />
            </View>
        );
    }

    const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) ?? null;
    const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? id;
    const presentMembers = members.filter((m) => !absentIds.includes(m.id));

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.content}>
                {selectedTopicIndex === null ? (
                    <>
                        <Text style={styles.pageTitle}>서기 기록</Text>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>모임 선택</Text>
                            <View style={styles.pickerContainer}>
                                {Platform.OS === 'web' ? (
                                     <select
                                        style={styles.webSelect}
                                        value={selectedMeetingId}
                                        onChange={(e) => setSelectedMeetingId(e.target.value)}
                                    >
                                        <option value="">— 모임을 선택하세요 —</option>
                                        {meetings.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.meetingNumber != null ? `제${m.meetingNumber}회 · ` : ''}{formatDate(m.date)} 『{m.book}』
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <Picker
                                        selectedValue={selectedMeetingId}
                                        onValueChange={(val) => val && setSelectedMeetingId(val)}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="— 모임을 선택하세요 —" value="" />
                                        {meetings.map((m) => (
                                            <Picker.Item 
                                                key={m.id} 
                                                label={`${m.meetingNumber != null ? `제${m.meetingNumber}회 · ` : ''}${formatDate(m.date)} 『${m.book}』`} 
                                                value={m.id} 
                                            />
                                        ))}
                                    </Picker>
                                )}
                            </View>
                        </View>

                        {!selectedMeeting ? (
                            <View style={styles.card}>
                                <View style={styles.empty}>
                                    <Text style={styles.emptyIcon}>✏️</Text>
                                    <Text style={styles.emptyText}>모임을 선택하면 기록을 입력할 수 있어요</Text>
                                </View>
                            </View>
                        ) : (
                            <>
                                {selectedMeeting.topics.length === 0 ? (
                                    <View style={styles.card}>
                                        <View style={styles.empty}>
                                            <Text style={styles.emptyIcon}>📝</Text>
                                            <Text style={styles.emptyText}>아직 발제 주제가 등록되지 않았어요</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>발제문</Text>
                                        <Text style={styles.sectionSubtitle}>기록할 발제를 선택해주세요.</Text>

                                        {selectedMeeting.topics.map((t, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                style={styles.topicCardCard}
                                                activeOpacity={0.7}
                                                onPress={() => setSelectedTopicIndex(idx)}
                                            >
                                                <View style={styles.topicNumberWrap}>
                                                    <Text style={styles.topicNumber}>{idx + 1}</Text>
                                                </View>
                                                <Text style={styles.topicText}>{t}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                <View style={styles.card}>
                                    <View style={styles.absentHeader}>
                                        <Text style={styles.absentTitle}>불참자 기록</Text>
                                        {absentSaving && <Text style={styles.savingText}>저장 중…</Text>}
                                    </View>
                                    
                                    {members.length === 0 ? (
                                        <Text style={styles.emptyTextSub}>등록된 멤버가 없어요</Text>
                                    ) : (
                                        <AbsentSelector
                                            members={members}
                                            absentIds={absentIds}
                                            onChange={handleAbsentChange}
                                        />
                                    )}

                                    {absentIds.length > 0 && (
                                        <Text style={styles.absentList}>
                                            불참: {absentIds.map(id => getMemberName(id)).join(', ')} — 답변 입력에서 제외됩니다
                                        </Text>
                                    )}
                                </View>
                            </>
                        )}
                    </>
                ) : selectedMeeting && (
                    <View>
                        <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedTopicIndex(null)}>
                            <Text style={styles.backBtnText}>← 리스트로</Text>
                        </TouchableOpacity>

                        <View style={styles.topicDetailCard}>
                            <View style={styles.topicDetailHeader}>
                                <View style={styles.topicDetailNumberWrap}>
                                    <Text style={styles.topicDetailNumber}>{selectedTopicIndex + 1}</Text>
                                </View>
                                <Text style={styles.topicDetailText}>
                                    {selectedMeeting.topics[selectedTopicIndex]}
                                </Text>
                            </View>
                            
                            <TouchableOpacity 
                                style={[styles.saveAllBtn, saving === `topic_${selectedTopicIndex}` && styles.saveAllBtnDisabled]}
                                onPress={() => handleTopicSave(selectedTopicIndex)}
                                disabled={saving === `topic_${selectedTopicIndex}`}
                            >
                                <Text style={styles.saveAllBtnText}>
                                    {saving === `topic_${selectedTopicIndex}` ? '저장 중…' : '현재 발제 답변 모두 저장'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.answersContainer}>
                            {presentMembers.map((mb) => {
                                const val = answers[mb.id]?.[selectedTopicIndex] ?? '';
                                return (
                                    <View key={mb.id} style={styles.answerCard}>
                                        <View style={styles.answerMemberRow}>
                                            <View style={styles.avatar}>
                                                <Text style={styles.avatarEmoji}>👤</Text>
                                            </View>
                                            <Text style={styles.answerMemberName}>{mb.name}</Text>
                                        </View>
                                        <TextInput
                                            style={styles.textarea}
                                            multiline
                                            placeholder={`${mb.name}의 답변을 입력하세요`}
                                            value={val}
                                            onChangeText={(text) => handleChange(mb.id, selectedTopicIndex, text)}
                                            textAlignVertical="top"
                                        />
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    content: { padding: 20, paddingBottom: 60 },
    pageTitle: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 20 },
    formGroup: { marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    pickerContainer: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        overflow: 'hidden',
    },
    webSelect: {
        width: '100%',
        padding: 12,
        fontSize: 16,
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    picker: {
        width: '100%',
        height: 50,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    empty: { alignItems: 'center', padding: 20 },
    emptyIcon: { fontSize: 32, marginBottom: 8 },
    emptyText: { fontSize: 14, color: '#666' },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4 },
    sectionSubtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
    topicCardCard: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    topicNumberWrap: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#e6f4fe',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    topicNumber: { color: '#0070f3', fontSize: 13, fontWeight: '700' },
    topicText: { fontSize: 16, color: '#111', flex: 1, lineHeight: 24, fontWeight: '500' },
    absentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    absentTitle: { fontSize: 13, fontWeight: '600', color: '#666' },
    savingText: { fontSize: 12, color: '#0070f3' },
    emptyTextSub: { fontSize: 14, color: '#888' },
    absentContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    absentBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    absentBtnChecked: {
        borderColor: '#ffcccb',
        backgroundColor: '#fff0f0',
    },
    absentBtnText: { fontSize: 14, color: '#333' },
    absentBtnCheckedText: { color: '#d32f2f', fontWeight: '600' },
    absentList: { fontSize: 12, color: '#d32f2f', marginTop: 12 },
    backBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 16, marginBottom: 16 },
    backBtnText: { color: '#0070f3', fontSize: 15, fontWeight: '600' },
    topicDetailCard: {
        backgroundColor: '#e6f4fe',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
    },
    topicDetailHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
    topicDetailNumberWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#0070f3',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    topicDetailNumber: { color: '#fff', fontSize: 14, fontWeight: '700' },
    topicDetailText: { fontSize: 18, fontWeight: '700', color: '#111', flex: 1, lineHeight: 26 },
    saveAllBtn: {
        backgroundColor: '#0070f3',
        alignSelf: 'flex-end',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 100,
    },
    saveAllBtnDisabled: { backgroundColor: '#a0c8ff' },
    saveAllBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    answersContainer: {},
    answerCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    answerMemberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    avatarEmoji: { fontSize: 16 },
    answerMemberName: { fontSize: 16, fontWeight: '600', color: '#111' },
    textarea: {
        minHeight: 120,
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#333',
    },
});
