import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useMember } from '../../context/MemberContext';
import { getMembers, getMeetings } from '../../lib/db';
import { Member, Meeting } from '../../lib/types';
import { Feather } from '@expo/vector-icons';
import { ProfileCard } from '../../components/ProfileCard';

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
    const [activeTab, setActiveTab] = useState<'members' | 'presenters'>('members');

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
                <ActivityIndicator size="large" color="#8C7D6B" />
                <Text style={{ marginTop: 10, color: '#7A7265' }}>불러오는 중…</Text>
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
            <Text style={styles.pageTitle}>멤버</Text>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'members' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('members')}
                >
                    <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>전체 멤버 ({memberCount})</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'presenters' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('presenters')}
                >
                    <Text style={[styles.tabText, activeTab === 'presenters' && styles.tabTextActive]}>발제자 현황</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'members' ? (
                <View style={styles.card}>
                    {members.map((m, index) => {
                        const isLast = index === members.length - 1;
                        return (
                            <TouchableOpacity
                                key={m.id}
                                style={[styles.row, isLast && { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}
                                onPress={() => router.push(`/member/${m.id}`)}
                            >
                                <View style={styles.rowContent}>
                                    <ProfileCard member={m} size="md" />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                    {members.length === 0 && <Text style={styles.emptyTextSub}>등록된 멤버가 없어요</Text>}
                </View>
            ) : (
                <>
                    <View style={styles.roundBadge}>
                        <Feather name="refresh-cw" size={14} color="#695D4A" style={{ marginRight: 6 }} />
                        <Text style={styles.roundBadgeText}>{currentRound}회차 진행 중 </Text>
                        <Text style={styles.roundBadgeSubtext}>({doneThisRound.length}/{memberCount}명 완료)</Text>
                    </View>

                    <Text style={styles.sectionTitle}>이번 회차 ({currentRound}회차)</Text>
                    <View style={styles.card}>
                        {members.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Feather name="users" size={40} color="#C1B7A7" style={{ marginBottom: 12 }} />
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
                                                    <TouchableOpacity onPress={() => router.push(`/member/${m.id}`)}>
                                                        <Text style={styles.name}>{m.name}</Text>
                                                    </TouchableOpacity>
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
                                                        <TouchableOpacity onPress={() => router.push(`/member/${m.id}`)}>
                                                            <Text style={[styles.name, styles.nameFaded]}>{m.name}</Text>
                                                        </TouchableOpacity>
                                                        {mt && (
                                                            <Text style={styles.countText}>
                                                                『{mt.book || '책 미정'}』({formatDate(mt.date)})
                                                            </Text>
                                                        )}
                                                    </View>
                                                    <View style={[styles.badge, styles.badgeSuccess]}>
                                                        <Feather name="check" size={12} color="#4A6A55" style={{ marginRight: 2 }} />
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

                    <Text style={styles.sectionTitle}>전체 참여 현황</Text>
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
                                                <TouchableOpacity onPress={() => router.push(`/member/${m.id}`)}>
                                                    <Text style={styles.name}>{m.name}</Text>
                                                </TouchableOpacity>
                                                {list.length > 0 && (
                                                    <Text style={styles.countText}>
                                                        {list.map((mt) => `『${mt.book || '책 미정'}』`).join(' · ')}
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
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FDFBF7'
    },
    container: {
        flex: 1,
        backgroundColor: '#FDFBF7',
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: '600',
        color: '#2C2724',
        marginBottom: 20,
        letterSpacing: -0.5,
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EBE5D9',
        marginBottom: 24,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: '#8C7D6B',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#A0968A',
    },
    tabTextActive: {
        color: '#8C7D6B',
    },
    roundBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0EBE1',
        alignSelf: 'flex-start',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        marginBottom: 24,
    },
    roundBadgeText: {
        color: '#695D4A',
        fontWeight: '600',
        fontSize: 14,
    },
    roundBadgeSubtext: {
        color: '#8C7D6B',
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C2724',
        marginBottom: 16,
        marginTop: 8,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        padding: 24,
        marginBottom: 28,
        elevation: 6,
        shadowColor: '#3A3125',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 15,
        color: '#7A7265',
        fontWeight: '500',
    },
    emptyTextSub: {
        fontSize: 14,
        color: '#A0968A',
        textAlign: 'center',
        padding: 16,
    },
    groupSection: {
        marginBottom: 4,
    },
    groupLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#A0968A',
        letterSpacing: 0.5,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#EBE5D9',
        marginVertical: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#FDFBF7',
        marginBottom: 4,
    },
    rowContent: {
        flex: 1,
        paddingRight: 16,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C2724',
        marginBottom: 6,
    },
    nameFaded: {
        color: '#7A7265',
    },
    countText: {
        fontSize: 13,
        color: '#7A7265',
        lineHeight: 18,
    },
    badge: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeAccent: {
        backgroundColor: '#FAEDDF',
    },
    badgeAccentText: {
        color: '#B07D4F',
        fontSize: 12,
        fontWeight: '600',
    },
    badgeSuccess: {
        backgroundColor: '#EBF2EE',
    },
    badgeSuccessText: {
        color: '#4A6A55',
        fontSize: 12,
        fontWeight: '600',
    },
    badgeGray: {
        backgroundColor: '#F9F6F0',
    },
    badgeGrayText: {
        color: '#7A7265',
        fontSize: 13,
        fontWeight: '600',
    },
});
