import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMember } from '../../context/MemberContext';
import { getMembers, getMeetings } from '../../lib/db';
import { Member, Meeting } from '../../lib/types';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatDate(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function PresentersScreen() {
    const { currentMemberId } = useMember();
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentMemberId) {
            setLoading(false);
            router.replace('/');
            return;
        }
        Promise.all([getMembers(), getMeetings()])
            .then(([mb, mt]) => { setMembers(mb); setMeetings(mt); })
            .finally(() => setLoading(false));
    }, [currentMemberId, router]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0070f3" />
                <Text style={{ marginTop: 10, color: '#666' }}>불러오는 중…</Text>
            </View>
        );
    }

    // ── 회차 계산 ──────────────────────────────────────────
    const doneMeetings = meetings
        .filter((m) => m.status === 'done' && m.presenterMemberId)
        .sort((a, b) => a.date - b.date);

    const memberCount = members.length;

    const allPresented = new Map<string, Meeting[]>();
    members.forEach((m) => allPresented.set(m.id, []));
    doneMeetings.forEach((mt) => {
        const list = allPresented.get(mt.presenterMemberId);
        if (list) list.push(mt);
    });

    const maxCount = memberCount > 0
        ? Math.max(...members.map((m) => allPresented.get(m.id)!.length))
        : 0;

    const currentRound = Math.max(1, maxCount);

    const doneThisRound = members.filter((m) => (allPresented.get(m.id)?.length ?? 0) >= currentRound);
    const pendingThisRound = members.filter((m) => (allPresented.get(m.id)?.length ?? 0) < currentRound);

    const getRoundMeeting = (memberId: string) => {
        const list = allPresented.get(memberId) ?? [];
        return list[currentRound - 1] ?? null;
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.pageTitle}>발제자 현황</Text>

            <View style={styles.roundBadge}>
                <Text style={styles.roundBadgeText}>🔄 {currentRound}회차 진행 중 </Text>
                <Text style={styles.roundBadgeSubtext}>({doneThisRound.length}/{memberCount}명 완료)</Text>
            </View>

            <Text style={styles.sectionTitle}>이번 회차 ({currentRound}회차)</Text>
            <View style={styles.card}>
                {members.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>👥</Text>
                        <Text style={styles.emptyText}>등록된 멤버가 없어요</Text>
                    </View>
                ) : (
                    <>
                        {pendingThisRound.length > 0 && (
                            <View style={styles.groupSection}>
                                <Text style={styles.groupLabel}>대기 중</Text>
                                {pendingThisRound.map((m) => (
                                    <View key={m.id} style={styles.row}>
                                        <View style={styles.rowContent}>
                                            <Text style={styles.name}>{m.name}</Text>
                                        </View>
                                        <View style={[styles.badge, styles.badgeAccent]}>
                                            <Text style={styles.badgeAccentText}>미발제</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                        
                        {pendingThisRound.length > 0 && doneThisRound.length > 0 && (
                            <View style={styles.divider} />
                        )}

                        {doneThisRound.length > 0 && (
                            <View style={styles.groupSection}>
                                <Text style={styles.groupLabel}>완료</Text>
                                {doneThisRound.map((m) => {
                                    const mt = getRoundMeeting(m.id);
                                    return (
                                        <View key={m.id} style={styles.row}>
                                            <View style={styles.rowContent}>
                                                <Text style={[styles.name, styles.nameFaded]}>{m.name}</Text>
                                                {mt && (
                                                    <Text style={styles.countText}>
                                                        『{mt.book}』({formatDate(mt.date)})
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={[styles.badge, styles.badgeSuccess]}>
                                                <Text style={styles.badgeSuccessText}>완료</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </>
                )}
            </View>

            <Text style={styles.sectionTitle}>전체 발제 횟수</Text>
            <View style={styles.card}>
                {members.length === 0 ? (
                    <Text style={styles.emptyTextSub}>등록된 멤버가 없어요</Text>
                ) : (
                    [...members]
                        .sort((a, b) => (allPresented.get(b.id)?.length ?? 0) - (allPresented.get(a.id)?.length ?? 0))
                        .map((m, index) => {
                            const list = allPresented.get(m.id) ?? [];
                            const isLast = index === members.length - 1;
                            return (
                                <View key={m.id} style={[styles.row, isLast && { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
                                    <View style={styles.rowContent}>
                                        <Text style={styles.name}>{m.name}</Text>
                                        {list.length > 0 && (
                                            <Text style={styles.countText}>
                                                {list.map((mt) => `『${mt.book}』`).join(' · ')}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={[styles.badge, styles.badgeGray]}>
                                        <Text style={styles.badgeGrayText}>{list.length}회</Text>
                                    </View>
                                </View>
                            );
                        })
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA'
    },
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111',
        marginBottom: 16,
    },
    roundBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e6f4fe',
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 100,
        marginBottom: 24,
    },
    roundBadgeText: {
        color: '#0070f3',
        fontWeight: '700',
        fontSize: 14,
    },
    roundBadgeSubtext: {
        color: '#0070f3',
        opacity: 0.75,
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
        marginTop: 8,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 24,
    },
    emptyIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
    },
    emptyTextSub: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        padding: 16,
    },
    groupSection: {
        marginBottom: 8,
    },
    groupLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
        marginBottom: 4,
    },
    rowContent: {
        flex: 1,
        paddingRight: 16,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    nameFaded: {
        opacity: 0.55,
    },
    countText: {
        fontSize: 13,
        color: '#777',
        lineHeight: 18,
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeAccent: {
        backgroundColor: '#ffebeb',
    },
    badgeAccentText: {
        color: '#d32f2f',
        fontSize: 12,
        fontWeight: '600',
    },
    badgeSuccess: {
        backgroundColor: '#e6ffe6',
    },
    badgeSuccessText: {
        color: '#2e7d32',
        fontSize: 12,
        fontWeight: '600',
    },
    badgeGray: {
        backgroundColor: '#f5f5f5',
    },
    badgeGrayText: {
        color: '#555',
        fontSize: 12,
        fontWeight: '600',
    },
});
