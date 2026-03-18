import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Image } from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useMember } from '../../context/MemberContext';
import { useAlert } from '../../context/AlertContext';
import { getMeeting, getMembers, getAnswers, updateMeeting } from '../../lib/db';
import { Meeting, Member, Answer } from '../../lib/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function MeetingDetailScreen() {
    const { currentMemberId } = useMember();
    const { showAlert } = useAlert();
    const router = useRouter();
    const navigation = useNavigation();
    const { id: meetingId } = useLocalSearchParams<{ id: string }>();

    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);

    const [isEditingTopics, setIsEditingTopics] = useState(false);
    const [editingTopics, setEditingTopics] = useState<string[]>([]);
    const [savingTopics, setSavingTopics] = useState(false);
    const [topicHeights, setTopicHeights] = useState<Record<number, number>>({});

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

    // 발제 상세 보기 중일 때 기기 뒤로가기 → 발제 목록으로만 이동 (한 화면씩)
    useEffect(() => {
        if (selectedTopicIndex === null) return;
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            e.preventDefault();
            setSelectedTopicIndex(null);
        });
        return unsubscribe;
    }, [navigation, selectedTopicIndex]);

    const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? id;

    const formatDate = (ts: number) =>
        new Date(ts).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

    const getDDay = (ts: number) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(ts);
        d.setHours(0, 0, 0, 0);
        const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
        if (diff === 0) return 'D-Day';
        if (diff > 0) return `D-${diff}`;
        return `D+${-diff}`;
    };

    const handleComplete = useCallback(async () => {
        if (!meetingId) return;
        showAlert('모임 완료', '모임을 완료 처리하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            {
                text: '완료',
                onPress: async () => {
                    try {
                        await updateMeeting(meetingId, { status: 'done' });
                        setMeeting(prev => prev ? { ...prev, status: 'done' } : null);
                        showAlert('알림', '완료 처리되었습니다.');
                    } catch (e) {
                        console.error(e);
                        showAlert('오류', '완료 처리 중 오류가 발생했습니다.');
                    }
                },
            },
        ]);
    }, [meetingId, showAlert]);

    const handleRevertComplete = useCallback(async () => {
        if (!meetingId) return;
        showAlert('완료 취소', '모임 완료를 취소하시겠습니까?', [
            { text: '아니오', style: 'cancel' },
            {
                text: '예',
                onPress: async () => {
                    try {
                        await updateMeeting(meetingId, { status: 'upcoming' });
                        setMeeting(prev => prev ? { ...prev, status: 'upcoming' } : null);
                        showAlert('알림', '완료가 취소되었습니다.');
                    } catch (e) {
                        console.error(e);
                        showAlert('오류', '완료 취소 중 오류가 발생했습니다.');
                    }
                },
            },
        ]);
    }, [meetingId, showAlert]);

    const startEditTopics = () => {
        const t = meeting?.topics ?? [];
        setEditingTopics(t.length >= 3 ? t : [...t, ...Array(3 - t.length).fill('')]);
        setIsEditingTopics(true);
    };

    const handleTopicChange = (i: number, val: string) =>
        setEditingTopics(prev => { const n = [...prev]; n[i] = val; return n; });

    const addTopicSlot = () => setEditingTopics(prev => prev.length < 10 ? [...prev, ''] : prev);
    const removeTopicSlot = (i: number) => setEditingTopics(prev => prev.length > 3 ? prev.filter((_, idx) => idx !== i) : prev);

    const handleSaveTopics = async () => {
        if (!meetingId) return;
        setSavingTopics(true);
        const filtered = editingTopics.map(t => t.trim()).filter(Boolean);
        try {
            await updateMeeting(meetingId, { topics: filtered });
            setMeeting(prev => prev ? { ...prev, topics: filtered } : null);
            setIsEditingTopics(false);
        } catch (e) {
            console.error(e);
            showAlert('오류', '발제 저장 중 오류가 발생했습니다.');
        } finally {
            setSavingTopics(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#8C7D6B" />
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

    // ── 발제 상세 뷰 ──
    if (selectedTopicIndex !== null) {
        return (
            <SafeAreaView style={styles.detailRoot} edges={['top']}>
                <View style={styles.detailHeader}>
                    <TouchableOpacity onPress={() => setSelectedTopicIndex(null)} style={styles.detailBackBtn} activeOpacity={0.7}>
                        <Text style={styles.detailBackText}>← 발제 목록</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.topicHeroCard}>
                        <View style={styles.topicHeroBadge}>
                            <Text style={styles.topicHeroBadgeText}>{selectedTopicIndex + 1}</Text>
                        </View>
                        <Text style={styles.topicHeroText}>{meeting.topics[selectedTopicIndex]}</Text>
                    </View>

                    <Text style={styles.answersSectionTitle}>멤버 답변</Text>

                    {members.filter(m => !meeting.absentMemberIds?.includes(m.id)).length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyCardText}>참석한 멤버가 없습니다.</Text>
                        </View>
                    ) : (
                        <View style={{ gap: 12 }}>
                            {members
                                .filter(m => !meeting.absentMemberIds?.includes(m.id))
                                .map(m => {
                                    const answer = answers.find(a => a.memberId === m.id && a.topicIndex === selectedTopicIndex)?.answer;
                                    return (
                                        <View key={m.id} style={styles.answerCard}>
                                            <View style={styles.answerHeaderRow}>
                                                <View style={styles.answerAvatar}>
                                                    <Feather name="user" size={16} color="#888" />
                                                </View>
                                                <Text style={styles.answerName}>{m.name}</Text>
                                            </View>
                                            {answer?.trim() ? (
                                                <Text style={styles.answerText}>{answer}</Text>
                                            ) : (
                                                <Text style={styles.answerEmptyText}>아직 기록된 답변이 없습니다.</Text>
                                            )}
                                        </View>
                                    );
                                })}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ── 메인 뷰 (버튼 고정 + 히어로·토픽 전체 스크롤) ──
    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
            >
                {/* ── 고정 버튼 행: ScrollView 내부 sticky header ── */}
                <View style={styles.headerStickyWrap}>
                    <SafeAreaView edges={['top']}>
                        <View style={styles.headerRow}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
                                <Text style={styles.headerBtnText}>← 뒤로가기</Text>
                            </TouchableOpacity>
                            <View style={styles.headerActions}>
                                <TouchableOpacity
                                    onPress={() => router.push(`/meeting/edit/${meetingId}` as never)}
                                    style={styles.headerBtn}
                                    activeOpacity={0.7}
                                >
                                    <Feather name="edit-2" size={14} color="#695D4A" />
                                    <Text style={[styles.headerBtnText, { marginLeft: 4 }]}>수정</Text>
                                </TouchableOpacity>
                                {meeting.status === 'upcoming' && (
                                    <TouchableOpacity onPress={handleComplete} style={styles.headerBtn} activeOpacity={0.7}>
                                        <Text style={styles.headerBtnText}>완료 처리</Text>
                                    </TouchableOpacity>
                                )}
                                {meeting.status === 'done' && (
                                    <TouchableOpacity onPress={handleRevertComplete} style={styles.headerBtn} activeOpacity={0.7}>
                                        <Text style={styles.headerBtnText}>완료 취소</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </SafeAreaView>
                </View>

                {/* 히어로: 그라데이션 배경 + 책 표지·제목·정보 */}
                <LinearGradient
                    colors={['#8C7D6B', '#695D4A', '#D4A373']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroGradient}
                >
                    <View style={styles.heroContent}>
                        {meeting.coverImageUrl ? (
                            <View style={styles.coverShadowWrap}>
                                <Image source={{ uri: meeting.coverImageUrl }} style={styles.coverImage} />
                            </View>
                        ) : (
                            <View style={styles.coverPlaceholder}>
                                <Feather name="book-open" size={40} color="rgba(255,255,255,0.5)" />
                            </View>
                        )}

                        <Text style={styles.heroMeetingNumber}>
                            {meeting.meetingNumber != null ? `제${meeting.meetingNumber}회 독서모임` : ' '}
                        </Text>
                        <Text style={styles.heroTitle}>{meeting.book || '책 미정'}</Text>
                        {!!meeting.author && <Text style={styles.heroAuthor}>{meeting.author}</Text>}

                        <View style={styles.heroMetaRow}>
                            <View style={styles.heroBadge}>
                                <Feather name="calendar" size={13} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.heroBadgeText}>{formatDate(meeting.date)}</Text>
                                {meeting.status === 'upcoming' && (
                                    <Text style={styles.dday}>{getDDay(meeting.date)}</Text>
                                )}
                            </View>
                            {!!meeting.presenterMemberId && (
                                <TouchableOpacity
                                    style={[styles.heroBadge, styles.heroBadgePrimary]}
                                    onPress={() => router.push(`/member/${meeting.presenterMemberId}` as never)}
                                    activeOpacity={0.7}
                                >
                                    <Feather name="mic" size={13} color="rgba(255,255,255,0.9)" />
                                    <Text style={styles.heroBadgeText}>
                                        발제: {getMemberName(meeting.presenterMemberId)}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </LinearGradient>

                {/* ── 흰색 카드: 위쪽 모서리 라운드 ── */}
                <View style={styles.whiteCard}>
                    <View style={styles.topicsContent}>
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
                                        style={[
                                            styles.input,
                                            styles.inputMultiline,
                                            { flex: 1, marginBottom: 0, height: Math.max(44, topicHeights[i] ?? 44) },
                                        ]}
                                        placeholder={`주제 ${i + 1}`}
                                        value={t}
                                        onChangeText={(val) => handleTopicChange(i, val)}
                                        multiline
                                        textAlignVertical="top"
                                        onContentSizeChange={(e) => {
                                            const height = e.nativeEvent.contentSize.height + 20;
                                            setTopicHeights((prev) => ({ ...prev, [i]: height }));
                                        }}
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
                                <TouchableOpacity
                                    style={[styles.btn, styles.btnGhost]}
                                    onPress={() => setIsEditingTopics(false)}
                                    disabled={savingTopics}
                                >
                                    <Text style={styles.btnGhostText}>취소</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : meeting.topics.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyCardText}>아직 등록된 발제가 없어요.</Text>
                        </View>
                    ) : (
                        <View style={{ gap: 10 }}>
                            {meeting.topics.map((t, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={styles.topicCard}
                                    activeOpacity={0.7}
                                    onPress={() => setSelectedTopicIndex(idx)}
                                >
                                    <View style={styles.topicCardBadge}>
                                        <Text style={styles.topicCardBadgeText}>{idx + 1}</Text>
                                    </View>
                                    <Text style={styles.topicCardText}>{t}</Text>
                                    <Feather name="chevron-right" size={16} color="#C1B7A7" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBF7' },
    emptyText: { fontSize: 16, color: '#666' },
    container: { flex: 1, backgroundColor: '#D4A373' }, // gradient 색으로 하단 빈 공간 방지

    // 헤더 버튼 행 (발제 키워드와 같은 배경으로 의도적 분리)
    headerStickyWrap: {
        backgroundColor: '#FDFBF7',
        borderBottomWidth: 1,
        borderBottomColor: '#EBE5D9',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    headerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F0EBE1',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EBE5D9',
    },
    headerBtnText: { color: '#695D4A', fontSize: 13, fontWeight: '600' },

    // 히어로 섹션 (모바일 넉넉한 여백·크기)
    heroContent: {
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingTop: 20,
        paddingBottom: 48,
    },
    coverShadowWrap: {
        width: 140,
        height: 200,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
        marginBottom: 24,
    },
    coverImage: { width: '100%', height: '100%' },
    coverPlaceholder: {
        width: 140,
        height: 200,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    heroMeetingNumber: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 0.8,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 34,
        paddingHorizontal: 4,
    },
    heroAuthor: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.75)',
        marginBottom: 20,
    },
    heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.18)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    heroBadgePrimary: { backgroundColor: 'rgba(255,255,255,0.22)' },
    heroBadgeText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.95)' },
    dday: {
        marginLeft: 4,
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
        backgroundColor: 'rgba(0,0,0,0.25)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },

    scrollView: { flex: 1 },

    // 히어로 그라데이션 (ScrollView 내부)
    heroGradient: { paddingBottom: 0 },

    // 흰색 카드 (그라데이션 아래)
    whiteCard: {
        backgroundColor: '#FDFBF7',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -20,
        minHeight: 400,
    },
    topicsContent: { padding: 24, paddingBottom: 80 },

    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2C2724' },
    editTopicsBtn: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F0EBE1' },
    editTopicsBtnText: { fontSize: 12, fontWeight: '600', color: '#695D4A' },

    // 발제 편집
    editCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#EBE5D9', marginBottom: 16 },
    editHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    editLabel: { fontSize: 13, fontWeight: '600', color: '#4A4238' },
    addTopicBtnText: { color: '#8C7D6B', fontSize: 13, fontWeight: '600' },
    topicEditRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' },
    topicNumBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F0EBE1', justifyContent: 'center', alignItems: 'center' },
    topicNumText: { color: '#8C7D6B', fontSize: 12, fontWeight: '700' },
    input: { backgroundColor: '#FDFBF7', borderWidth: 1, borderColor: '#EBE5D9', borderRadius: 8, padding: 10, fontSize: 14 },
    inputMultiline: { paddingTop: 10, paddingBottom: 10 },
    removeTopicBtn: { padding: 6 },
    removeTopicText: { color: '#C45C4A', fontSize: 16, fontWeight: '700' },
    editActionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    btnPrimary: { backgroundColor: '#8C7D6B' },
    btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#EBE5D9' },
    btnGhostText: { color: '#7A7265', fontSize: 13, fontWeight: '600' },
    btnDisabled: { opacity: 0.7 },

    // 발제 카드
    emptyCard: { backgroundColor: '#F9F6F0', borderRadius: 10, padding: 28, alignItems: 'center' },
    emptyCardText: { fontSize: 14, color: '#7A7265' },
    topicCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EBE5D9',
        gap: 12,
    },
    topicCardBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F0EBE1', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    topicCardBadgeText: { color: '#8C7D6B', fontSize: 12, fontWeight: '700' },
    topicCardText: { flex: 1, fontSize: 15, color: '#2C2724', lineHeight: 22 },

    // 발제 상세 뷰
    detailRoot: { flex: 1, backgroundColor: '#FDFBF7' },
    detailHeader: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EBE5D9' },
    detailBackBtn: { paddingVertical: 8, alignSelf: 'flex-start' },
    detailBackText: { color: '#8C7D6B', fontSize: 14, fontWeight: '600' },
    detailContent: { padding: 20, paddingBottom: 60 },

    topicHeroCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F0EBE1', borderRadius: 10, padding: 18, marginBottom: 24, gap: 12 },
    topicHeroBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#8C7D6B', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    topicHeroBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    topicHeroText: { flex: 1, fontSize: 16, fontWeight: '700', color: '#2C2724', lineHeight: 24 },
    answersSectionTitle: { fontSize: 15, fontWeight: '700', color: '#2C2724', marginBottom: 14 },
    answerCard: { backgroundColor: '#fff', borderRadius: 12, padding: 18, borderWidth: 1, borderColor: '#EBE5D9' },
    answerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    answerAvatar: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#F0EBE1', justifyContent: 'center', alignItems: 'center' },
    answerName: { fontSize: 14, fontWeight: '700', color: '#2C2724' },
    answerText: { fontSize: 14, lineHeight: 22, color: '#4A4238' },
    answerEmptyText: { fontSize: 13, fontStyle: 'italic', color: '#7A7265' },
});
