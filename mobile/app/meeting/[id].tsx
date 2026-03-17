import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Image, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMember } from '../../context/MemberContext';
import { getMeeting, getMembers, getAnswers, updateMeeting } from '../../lib/db';
import { Meeting, Member, Answer } from '../../lib/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function MeetingDetailScreen() {
    const { currentMemberId } = useMember();
    const router = useRouter();
    const { id: meetingId } = useLocalSearchParams<{ id: string }>();

    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);

    const [isEditingTopics, setIsEditingTopics] = useState(false);
    const [editingTopics, setEditingTopics] = useState<string[]>([]);
    const [savingTopics, setSavingTopics] = useState(false);

    useEffect(() => {
        if (!currentMemberId) {
            setLoading(false);
            router.replace('/');
            return;
        }

        if (!meetingId) {
            router.back();
            return;
        }

        Promise.all([getMeeting(meetingId), getMembers(), getAnswers(meetingId)])
            .then(([mt, mb, ans]) => {
                setMeeting(mt);
                setMembers(mb);
                setAnswers(ans);
            })
            .finally(() => setLoading(false));
    }, [currentMemberId, meetingId, router]);

    const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? id;

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
    };

    const getDDay = (meetingDateTs: number) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const meeting = new Date(meetingDateTs);
        const meetingDay = new Date(meeting.getFullYear(), meeting.getMonth(), meeting.getDate()).getTime();
        const diffMs = meetingDay - today;
        const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
        if (diffDays === 0) return 'D-Day';
        if (diffDays > 0) return `D-${diffDays}`;
        return `D+${-diffDays}`;
    };

    const handleComplete = async () => {
        if (!meetingId) return;
        Alert.alert('모임 완료', '모임을 완료 처리하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            {
                text: '완료',
                onPress: async () => {
                    try {
                        await updateMeeting(meetingId, { status: 'done' });
                        setMeeting(prev => prev ? { ...prev, status: 'done' } : null);
                        Alert.alert('알림', '완료 처리되었습니다.');
                    } catch (e) {
                        console.error(e);
                        Alert.alert('오류', '완료 처리 중 오류가 발생했습니다.');
                    }
                }
            }
        ]);
    };

    const handleRevertComplete = async () => {
        if (!meetingId) return;
        Alert.alert('완료 취소', '모임 완료를 취소하시겠습니까?', [
            { text: '아니오', style: 'cancel' },
            {
                text: '예',
                onPress: async () => {
                    try {
                        await updateMeeting(meetingId, { status: 'upcoming' });
                        setMeeting(prev => prev ? { ...prev, status: 'upcoming' } : null);
                        Alert.alert('알림', '완료가 취소되었습니다.');
                    } catch (e) {
                        console.error(e);
                        Alert.alert('오류', '완료 취소 중 오류가 발생했습니다.');
                    }
                }
            }
        ]);
    };

    const startEditTopics = () => {
        const initialTopics = meeting?.topics.length ? meeting.topics : [];
        setEditingTopics(initialTopics.length >= 3 ? initialTopics : [...initialTopics, ...Array(3 - initialTopics.length).fill('')]);
        setIsEditingTopics(true);
    };

    const handleTopicChange = (i: number, val: string) => {
        setEditingTopics(prev => {
            const next = [...prev];
            next[i] = val;
            return next;
        });
    };

    const addTopicSlot = () => setEditingTopics(prev => prev.length < 10 ? [...prev, ''] : prev);
    const removeTopicSlot = (i: number) => setEditingTopics(prev => prev.length > 3 ? prev.filter((_, idx) => idx !== i) : prev);

    const handleSaveTopics = async () => {
        if (!meetingId) return;
        setSavingTopics(true);
        const filteredTopics = editingTopics.map(t => t.trim()).filter(Boolean);
        try {
            await updateMeeting(meetingId, { topics: filteredTopics });
            setMeeting(prev => prev ? { ...prev, topics: filteredTopics } : null);
            setIsEditingTopics(false);
        } catch (e) {
            console.error(e);
            Alert.alert('오류', '발제 저장 중 오류가 발생했습니다.');
        } finally {
            setSavingTopics(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0070f3" />
            </View>
        );
    }

    if (!meeting) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>모임을 찾을 수 없어요.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {selectedTopicIndex === null && (
                <View style={styles.heroBackground}>
                    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                        <View style={styles.heroHeaderRow}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.heroBackBtn}>
                                <Text style={styles.heroBackText}>← 뒤로가기</Text>
                            </TouchableOpacity>

                            {meeting.status === 'upcoming' && (
                                <TouchableOpacity onPress={handleComplete} style={styles.completeBtn}>
                                    <Text style={styles.completeBtnText}>모임 완료 처리</Text>
                                </TouchableOpacity>
                            )}
                            {meeting.status === 'done' && (
                                <TouchableOpacity onPress={handleRevertComplete} style={styles.revertBtn}>
                                    <Text style={styles.revertBtnText}>완료 취소</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </SafeAreaView>
                </View>
            )}

            <ScrollView
                contentContainerStyle={selectedTopicIndex === null ? styles.contentWithHero : styles.contentNormal}
                showsVerticalScrollIndicator={false}
            >
                {selectedTopicIndex === null && (
                    <View style={styles.heroContent}>
                        {meeting.coverImageUrl ? (
                            <View style={styles.coverImageContainer}>
                                <Image
                                    source={{ uri: meeting.coverImageUrl }}
                                    style={styles.coverImage}
                                />
                            </View>
                        ) : (
                            <View style={styles.coverPlaceholder}>
                                <Feather name="book-open" size={40} color="#aaa" />
                            </View>
                        )}

                        <View style={styles.heroTextContainer}>
                            <Text style={styles.heroMeetingNumber}>
                                {meeting.meetingNumber != null ? `제${meeting.meetingNumber}회 독서모임` : '독서모임'}
                            </Text>
                            <Text style={styles.heroTitle}>{meeting.book || '책 미정'}</Text>
                            <Text style={styles.heroAuthor}>{meeting.author}</Text>

                            <View style={styles.heroMetaRow}>
                                <View style={styles.heroMetaBadge}>
                                    <Feather name="calendar" size={14} color="#555" />
                                    <Text style={styles.heroMetaBadgeText}>{formatDate(meeting.date)}</Text>
                                    {meeting.status === 'upcoming' && (
                                        <Text style={styles.dday}>{getDDay(meeting.date)}</Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={[styles.heroMetaBadge, styles.heroMetaBadgePrimary]}
                                    onPress={() => router.push(`/member/${meeting.presenterMemberId}`)}
                                >
                                    <Feather name="mic" size={14} color="#0070f3" />
                                    <Text style={[styles.heroMetaBadgeText, styles.heroMetaBadgePrimaryText]}>
                                        발제자: {getMemberName(meeting.presenterMemberId)}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {selectedTopicIndex === null ? (
                    <View style={styles.topicsSection}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>발제 키워드</Text>
                            {!isEditingTopics && meeting.status === 'upcoming' && (
                                <TouchableOpacity onPress={startEditTopics} style={styles.editTopicsBtn}>
                                    <Text style={styles.editTopicsBtnText}>
                                        {meeting.topics.length === 0 ? '+ 발제 등록' : '수정'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {isEditingTopics ? (
                            <View style={styles.editCard}>
                                <View style={styles.editHeaderRow}>
                                    <Text style={styles.editLabel}>발제 주제 ({editingTopics.length}/10)</Text>
                                    {editingTopics.length < 10 && (
                                        <TouchableOpacity onPress={addTopicSlot}>
                                            <Text style={styles.addTopicBtnText}>+ 추가</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {editingTopics.map((t, i) => (
                                    <View key={i} style={styles.topicEditRow}>
                                        <View style={styles.topicNumBadge}>
                                            <Text style={styles.topicNumText}>{i + 1}</Text>
                                        </View>
                                        <TextInput
                                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                            placeholder={`주제 ${i + 1}`}
                                            value={t}
                                            onChangeText={(val) => handleTopicChange(i, val)}
                                        />
                                        {editingTopics.length > 3 && (
                                            <TouchableOpacity onPress={() => removeTopicSlot(i)} style={styles.removeTopicBtn}>
                                                <Text style={styles.removeTopicText}>✕</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}

                                <View style={styles.editActionsRow}>
                                    <TouchableOpacity
                                        style={[styles.btn, styles.btnPrimary, savingTopics && styles.btnDisabled]}
                                        onPress={handleSaveTopics}
                                        disabled={savingTopics}
                                    >
                                        <Text style={styles.btnPrimaryText}>{savingTopics ? '저장 중…' : '저장 완료'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setIsEditingTopics(false)} disabled={savingTopics}>
                                        <Text style={styles.btnGhostText}>취소</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : meeting.topics.length === 0 ? (
                            <View style={styles.emptyTopicsCard}>
                                <Text style={styles.emptyTopicsText}>아직 등록된 발제가 없어요.</Text>
                            </View>
                        ) : (
                            <View style={styles.topicsContainer}>
                                {meeting.topics.map((t, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.topicCardCard}
                                        activeOpacity={0.7}
                                        onPress={() => setSelectedTopicIndex(idx)}
                                    >
                                        <View style={styles.topicCardBadge}>
                                            <Text style={styles.topicCardBadgeText}>{idx + 1}</Text>
                                        </View>
                                        <Text style={styles.topicCardText}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.detailViewSection}>
                        <SafeAreaView edges={['top']}>
                            <TouchableOpacity onPress={() => setSelectedTopicIndex(null)} style={styles.backToListBtn}>
                                <Text style={styles.backToListText}>← 발제 목록</Text>
                            </TouchableOpacity>
                        </SafeAreaView>

                        <View style={styles.topicDetailHeroCard}>
                            <View style={styles.topicDetailHeroBadge}>
                                <Text style={styles.topicDetailHeroBadgeText}>{selectedTopicIndex + 1}</Text>
                            </View>
                            <Text style={styles.topicDetailHeroText}>
                                {meeting.topics[selectedTopicIndex]}
                            </Text>
                        </View>

                        <Text style={styles.answersSectionTitle}>멤버 답변</Text>

                        {members.filter(m => !meeting.absentMemberIds?.includes(m.id)).length === 0 ? (
                            <View style={styles.emptyTopicsCard}>
                                <Text style={styles.emptyTopicsText}>참석한 멤버가 없습니다.</Text>
                            </View>
                        ) : (
                            <View style={styles.answersContainer}>
                                {members
                                    .filter(m => !meeting.absentMemberIds?.includes(m.id))
                                    .map(m => {
                                        const answer = answers.find(a => a.memberId === m.id && a.topicIndex === selectedTopicIndex)?.answer;
                                        const hasAnswer = Boolean(answer?.trim());

                                        return (
                                            <View key={m.id} style={styles.answerCard}>
                                                <View style={styles.answerHeaderRow}>
                                                    <View style={styles.answerAvatar}>
                                                        <Feather name="user" size={16} color="#888" />
                                                    </View>
                                                    <Text style={styles.answerName}>{m.name}</Text>
                                                </View>
                                                {hasAnswer ? (
                                                    <Text style={styles.answerText}>{answer}</Text>
                                                ) : (
                                                    <Text style={styles.answerEmptyText}>아직 기록된 답변이 없습니다.</Text>
                                                )}
                                            </View>
                                        );
                                    })}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    emptyText: { fontSize: 16, color: '#666' },

    // Hero Section
    heroBackground: {
        backgroundColor: '#9D48B4', // Fallback
        paddingBottom: 20,
        ...StyleSheet.absoluteFillObject,
        height: 250,
        bottom: undefined,
    },
    heroHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 50,
    },
    heroBackBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 6,
    },
    heroBackText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    completeBtn: {
        backgroundColor: '#fff',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    completeBtnText: { color: '#111', fontSize: 13, fontWeight: '600' },
    revertBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    revertBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    // Content Layouts
    contentWithHero: { paddingTop: 60, paddingBottom: 60 },
    contentNormal: { paddingHorizontal: 20, paddingBottom: 60 },

    heroContent: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    coverImageContainer: {
        width: 140,
        height: 200,
        borderRadius: 6,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
        overflow: 'hidden',
        marginBottom: 20,
    },
    coverImage: { width: '100%', height: '100%' },
    coverPlaceholder: {
        width: 140,
        height: 200,
        borderRadius: 6,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    coverPlaceholderIcon: { fontSize: 40 },
    heroTextContainer: { alignItems: 'center' },
    heroMeetingNumber: { fontSize: 12, fontWeight: '600', color: '#0070f3', marginBottom: 6, letterSpacing: 0.5 },
    heroTitle: { fontSize: 24, fontWeight: '800', color: '#111', textAlign: 'center', marginBottom: 6 },
    heroAuthor: { fontSize: 14, color: '#666', marginBottom: 16 },
    heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
    heroMetaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eee', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    heroMetaBadgeText: { fontSize: 12, fontWeight: '600', color: '#555' },
    heroMetaBadgePrimary: { backgroundColor: '#e6f4fe' },
    heroMetaBadgePrimaryText: { color: '#0070f3' },
    dday: { marginLeft: 6, fontSize: 11, fontWeight: '700', color: '#FFF', backgroundColor: '#8C7D6B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },

    // Topics Section
    topicsSection: { paddingHorizontal: 20 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
    editTopicsBtn: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#f0f0f0' },
    editTopicsBtnText: { fontSize: 12, fontWeight: '600', color: '#333' },
    sectionDesc: { fontSize: 13, color: '#666', marginBottom: 20 },

    // Topics Edit
    editCard: { backgroundColor: '#fff', borderRadius: 6, padding: 16, borderWidth: 1, borderColor: '#eee', marginBottom: 20 },
    editHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    editLabel: { fontSize: 13, fontWeight: '600', color: '#444' },
    addTopicBtnText: { color: '#0070f3', fontSize: 13, fontWeight: '600' },
    topicEditRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
    topicNumBadge: {
        width: 26, height: 26, borderRadius: 13, backgroundColor: '#e6f4fe',
        justifyContent: 'center', alignItems: 'center',
    },
    topicNumText: { color: '#0070f3', fontSize: 12, fontWeight: '700' },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, fontSize: 14 },
    removeTopicBtn: { padding: 6 },
    removeTopicText: { color: '#d32f2f', fontSize: 16, fontWeight: '700' },
    editActionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    btnPrimary: { backgroundColor: '#0070f3' },
    btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ddd' },
    btnGhostText: { color: '#555', fontSize: 13, fontWeight: '600' },
    btnDisabled: { opacity: 0.7 },

    // Topics List
    emptyTopicsCard: { backgroundColor: '#f9f9f9', borderRadius: 6, padding: 30, alignItems: 'center' },
    emptyTopicsText: { fontSize: 14, color: '#888' },
    topicsContainer: { gap: 12 },
    topicCardCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fff',
        borderRadius: 6,
        padding: 16,
        borderWidth: 1,
        borderColor: '#eee',
        // Instead of hover effect, rely on activeOpacity
    },
    topicCardBadge: {
        width: 26, height: 26, borderRadius: 13, backgroundColor: '#e6f4fe',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    topicCardBadgeText: { color: '#0070f3', fontSize: 13, fontWeight: '700' },
    topicCardText: { flex: 1, fontSize: 15, color: '#111', lineHeight: 22 },

    // Detail View
    detailViewSection: { paddingTop: 10 },
    backToListBtn: { paddingVertical: 8, alignSelf: 'flex-start', marginBottom: 16 },
    backToListText: { color: '#555', fontSize: 14, fontWeight: '600' },
    topicDetailHeroCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#e6f4fe',
        borderRadius: 6,
        padding: 20,
        marginBottom: 24,
    },
    topicDetailHeroBadge: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: '#0070f3',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
    },
    topicDetailHeroBadgeText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    topicDetailHeroText: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111', lineHeight: 24 },
    answersSectionTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 16 },
    answersContainer: { gap: 16 },
    answerCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#eee' },
    answerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    answerAvatar: {
        width: 32, height: 32, borderRadius: 12, backgroundColor: '#f0f0f0',
        justifyContent: 'center', alignItems: 'center',
    },
    answerAvatarIcon: { fontSize: 16 },
    answerName: { fontSize: 15, fontWeight: '700', color: '#111' },
    answerText: { fontSize: 15, lineHeight: 24, color: '#333' },
    answerEmptyText: { fontSize: 14, fontStyle: 'italic', color: '#888' },
});
