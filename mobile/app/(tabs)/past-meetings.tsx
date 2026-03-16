import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMember } from '../../context/MemberContext';
import { getMeetings, getMembers } from '../../lib/db';
import { Meeting, Member } from '../../lib/types';
import { Picker } from '@react-native-picker/picker'; // Needs installation later if Picker is used, or a custom one. Let's use simple Custom Filters for React Native to avoid extra dependencies for now, or just basic UI.

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

    // Simple state for filters (Native Picker is complex to style across platforms without a lib, so we simplify for MVP or just show all for now, but let's implement basic sort toggle)
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
                <ActivityIndicator size="large" color="#0070f3" />
                <Text style={{ marginTop: 10, color: '#666' }}>불러오는 중…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.pageTitle}>내서재</Text>
                <TouchableOpacity 
                    style={styles.sortBtn}
                    onPress={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                >
                    <Text style={styles.sortBtnText}>
                        {sortOrder === 'DESC' ? '최신순 ▼' : '오래된순 ▲'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {filteredMeetings.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>조건에 맞는 모임이 없어요.</Text>
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
                                        <Text style={{ fontSize: 24, opacity: 0.5 }}>📓</Text>
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
        backgroundColor: '#FAFAFA'
    },
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FAFAFA',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111',
    },
    sortBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#eee',
        borderRadius: 100,
    },
    sortBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: '#888',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardInner: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        gap: 16,
    },
    coverWrapper: {
        width: 48,
        height: 68,
        borderRadius: 6,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
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
        marginBottom: 6,
    },
    badge: {
        backgroundColor: '#e6f4fe',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 100,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0070f3',
    },
    bookTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        flex: 1,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        color: '#666',
    },
    metaDot: {
        fontSize: 13,
        color: '#ccc',
    },
    metaHighlight: {
        color: '#333',
        fontWeight: '600',
    }
});
