import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMember } from '../../context/MemberContext';
import { getMeetings, getMembers } from '../../lib/db';
import { Meeting, Member } from '../../lib/types';
import { Feather } from '@expo/vector-icons';

function formatDate(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

export default function PastMeetingsScreen() {
    const { currentMemberId } = useMember();
    const router = useRouter();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

    useEffect(() => {
        if (!currentMemberId) {
            setLoading(false);
            router.replace('/');
            return;
        }
        Promise.all([getMeetings(), getMembers()])
            .then(([m, mb]) => { setMeetings(m.filter(m => m.status === 'done')); setMembers(mb); })
            .finally(() => setLoading(false));
    }, [currentMemberId, router]);

    const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? '미정';

    const filteredMeetings = useMemo(() => {
        let result = [...meetings];
        result.sort((a, b) => sortOrder === 'DESC' ? b.date - a.date : a.date - b.date);
        return result;
    }, [meetings, sortOrder]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#8C7D6B" />
                <Text style={{ marginTop: 10, color: '#7A7265' }}>불러오는 중…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.pageTitle}>기록</Text>
                <TouchableOpacity 
                    style={styles.sortBtn}
                    onPress={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                >
                    <Text style={styles.sortBtnText}>
                        {sortOrder === 'DESC' ? '최신순 ▾' : '오래된순 ▴'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {filteredMeetings.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Feather name="inbox" size={48} color="#C1B7A7" style={{ marginBottom: 16 }} />
                        <Text style={styles.emptyText}>아직 완료된 모임이 없어요.</Text>
                    </View>
                ) : (
                    filteredMeetings.map((m) => (
                        <TouchableOpacity
                            key={m.id}
                            style={styles.card}
                            activeOpacity={0.7}
                            onPress={() => router.push(`/meeting/${m.id}`)}
                        >
                            <View style={styles.cardInner}>
                                <View style={styles.coverWrapper}>
                                    {m.coverImageUrl ? (
                                        <Image source={{ uri: m.coverImageUrl }} style={styles.coverImage} />
                                    ) : (
                                        <Feather name="book" size={24} color="#C1B7A7" />
                                    )}
                                </View>
                                
                                <View style={styles.cardInfo}>
                                    <View style={styles.titleRow}>
                                        {m.meetingNumber != null && (
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>제{m.meetingNumber}회</Text>
                                            </View>
                                        )}
                                        <Text style={styles.bookTitle} numberOfLines={1}>
                                            {m.book}
                                        </Text>
                                    </View>
                                    
                                    <View style={styles.metaRow}>
                                        <Text style={styles.metaText}>{formatDate(m.date)}</Text>
                                        <Text style={styles.metaDot}>•</Text>
                                        <Text style={styles.metaText}>
                                            발제: <Text style={styles.metaHighlight}>{getMemberName(m.presenterMemberId)}</Text>
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 16,
        backgroundColor: '#FDFBF7',
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: '600',
        color: '#2C2724',
        letterSpacing: -0.5,
    },
    sortBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#F9F6F0',
        borderRadius: 20,
    },
    sortBtnText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#7A7265',
    },
    content: {
        padding: 24,
        paddingTop: 8,
        paddingBottom: 80,
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: '#7A7265',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#3A3125',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
    },
    cardInner: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
        gap: 16,
    },
    coverWrapper: {
        width: 52,
        height: 76,
        borderRadius: 6,
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F0EBE1',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    cardInfo: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    badge: {
        backgroundColor: '#F0EBE1',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 100,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#695D4A',
    },
    bookTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C2724',
        flex: 1,
        letterSpacing: -0.3,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        color: '#7A7265',
    },
    metaDot: {
        fontSize: 13,
        color: '#C1B7A7',
    },
    metaHighlight: {
        color: '#4A4238',
        fontWeight: '500',
    }
});
