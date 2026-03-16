import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMember } from '../../context/MemberContext';
import { getMeetings, getMembers, getAnswers, saveAnswer, updateMeeting } from '../../lib/db';
import { Meeting, Member } from '../../lib/types';
import { Picker } from '@react-native-picker/picker';
import { Feather } from '@expo/vector-icons';

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
                        {checked && <Feather name="x" size={14} color="#B07D4F" style={{ marginRight: 4 }} />}
                        <Text style={[styles.absentBtnText, checked && styles.absentBtnCheckedText]}>
                            {m.name}
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
                <ActivityIndicator size="large" color="#8C7D6B" />
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
                                    <Feather name="edit-3" size={32} color="#C1B7A7" style={{ marginBottom: 12 }} />
                                    <Text style={styles.emptyText}>모임을 선택하면 기록을 입력할 수 있어요</Text>
                                </View>
                            </View>
                        ) : (
                            <>
                                {selectedMeeting.topics.length === 0 ? (
                                    <View style={styles.card}>
                                        <View style={styles.empty}>
                                            <Feather name="file-text" size={32} color="#C1B7A7" style={{ marginBottom: 12 }} />
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
                            <Feather name="arrow-left" size={18} color="#695D4A" style={{ marginRight: 6 }} />
                            <Text style={styles.backBtnText}>리스트로</Text>
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
                                                <Feather name="user" size={16} color="#7A7265" />
                                            </View>
                                            <Text style={styles.answerMemberName}>{mb.name}</Text>
                                        </View>
                                        <TextInput
                                            style={styles.textarea}
                                            multiline
                                            placeholder={`${mb.name}의 답변을 입력하세요`}
                                            placeholderTextColor="#C1B7A7"
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
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBF7' },
    container: { flex: 1, backgroundColor: '#FDFBF7' },
    content: { padding: 24, paddingBottom: 60 },
    pageTitle: { fontSize: 26, fontWeight: '600', color: '#2C2724', marginBottom: 20, letterSpacing: -0.5 },
    formGroup: { marginBottom: 28 },
    label: { fontSize: 13, fontWeight: '600', color: '#7A7265', marginBottom: 8, letterSpacing: 0.5 },
    pickerContainer: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0EBE1',
        borderRadius: 6,
        overflow: 'hidden',
    },
    webSelect: {
        width: '100%',
        padding: 14,
        fontSize: 16,
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    picker: {
        width: '100%',
        height: 54,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        padding: 24,
        marginBottom: 24,
        elevation: 6,
        shadowColor: '#3A3125',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
    },
    empty: { alignItems: 'center', padding: 24 },
    emptyText: { fontSize: 15, color: '#7A7265' },
    section: { marginBottom: 28 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2C2724', marginBottom: 4 },
    sectionSubtitle: { fontSize: 14, color: '#7A7265', marginBottom: 20 },
    topicCardCard: {
        flexDirection: 'row',
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0EBE1',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    topicNumberWrap: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: '#F9F6F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    topicNumber: { color: '#695D4A', fontSize: 13, fontWeight: '700' },
    topicText: { fontSize: 16, color: '#2C2724', flex: 1, lineHeight: 26, fontWeight: '500' },
    absentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    absentTitle: { fontSize: 14, fontWeight: '600', color: '#7A7265', letterSpacing: 0.5 },
    savingText: { fontSize: 13, color: '#8C7D6B' },
    emptyTextSub: { fontSize: 14, color: '#A0968A' },
    absentContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    absentBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#EBE5D9',
        backgroundColor: '#FAFAFA',
        flexDirection: 'row',
        alignItems: 'center',
    },
    absentBtnChecked: {
        borderColor: '#E8D5C4',
        backgroundColor: '#FAEDDF',
    },
    absentBtnText: { fontSize: 14, color: '#4A4238', fontWeight: '500' },
    absentBtnCheckedText: { color: '#B07D4F', fontWeight: '600' },
    absentList: { fontSize: 13, color: '#B07D4F', marginTop: 16, lineHeight: 20 },
    backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 12, paddingRight: 16, marginBottom: 12 },
    backBtnText: { color: '#695D4A', fontSize: 15, fontWeight: '600' },
    topicDetailCard: {
        backgroundColor: '#F9F6F0',
        borderRadius: 6,
        padding: 32,
        marginBottom: 32,
    },
    topicDetailHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
    topicDetailNumberWrap: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: '#695D4A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        marginTop: 2,
    },
    topicDetailNumber: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    topicDetailText: { fontSize: 18, fontWeight: '600', color: '#2C2724', flex: 1, lineHeight: 28 },
    saveAllBtn: {
        backgroundColor: '#695D4A',
        alignSelf: 'flex-end',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 6,
    },
    saveAllBtnDisabled: { backgroundColor: '#C1B7A7' },
    saveAllBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
    answersContainer: {},
    answerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        padding: 24,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#3A3125',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
    },
    answerMemberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F9F6F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    answerMemberName: { fontSize: 16, fontWeight: '600', color: '#2C2724' },
    textarea: {
        minHeight: 140,
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#EBE5D9',
        borderRadius: 12,
        padding: 20,
        fontSize: 15,
        color: '#2C2724',
        lineHeight: 24,
    },
});
