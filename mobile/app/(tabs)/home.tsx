import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useMember } from '../../context/MemberContext';
import { getMeetings, getMembers } from '../../lib/db';
import { Meeting, Member } from '../../lib/types';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

function formatDate(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

export default function HomeScreen() {
    const { currentMemberId } = useMember();
    const router = useRouter();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentMemberId) {
            setLoading(false);
            router.replace('/');
            return;
        }
        Promise.all([getMeetings(), getMembers()])
            .then(([m, mb]) => { setMeetings(m); setMembers(mb); })
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

    const upcoming = meetings.filter((m) => m.status === 'upcoming').sort((a, b) => a.date - b.date);
    const next = upcoming[0] ?? null;

    const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? '미정';

    return (
        <View style={styles.wrapper}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.pageTitle}>다가오는 모임</Text>
            </View>

            {next ? (
                <TouchableOpacity 
                    style={styles.card} 
                    activeOpacity={0.8}
                    onPress={() => router.push(`/meeting/${next.id}`)}
                >
                    <LinearGradient
                        colors={['#EBE5D9', '#E2D9C8']}
                        style={styles.cardHeader}
                    >
                        <Text style={styles.meetingNumber}>
                            {next.meetingNumber != null ? `제${next.meetingNumber}회 독서모임` : '다음 모임'}
                        </Text>
                        <Text style={styles.bookTitle}>『{next.book}』</Text>
                    </LinearGradient>

                    <View style={styles.cardContent}>
                        {next.coverImageUrl && (
                            <View style={styles.coverWrapper}>
                                <Image 
                                    style={styles.coverImage} 
                                    source={{ uri: next.coverImageUrl }} 
                                />
                            </View>
                        )}
                        
                        <Text style={styles.author}>{next.author}</Text>
                        
                        <View style={styles.tagsRow}>
                            <View style={styles.tag}>
                                <Feather name="calendar" size={14} color="#7A7265" style={{ marginRight: 4 }} />
                                <Text style={styles.tagText}>{formatDate(next.date)}</Text>
                            </View>
                            <View style={[styles.tag, styles.tagPrimary]}>
                                <Feather name="mic" size={14} color="#695D4A" style={{ marginRight: 4 }} />
                                <Text style={[styles.tagText, styles.tagPrimaryText]}>
                                    {getMemberName(next.presenterMemberId)} 발제
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            ) : (
                <View style={[styles.card, styles.emptyCard]}>
                    <Feather name="book-open" size={48} color="#C1B7A7" style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyTitle}>예정된 모임이 없어요</Text>
                    <Text style={styles.emptySub}>새로운 독서 모임을 기획해 보세요.</Text>
                </View>
            )}
        </ScrollView>

        <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/meeting/new')}
            activeOpacity={0.85}
        >
            <Feather name="plus" size={24} color="#FFF" />
            <Text style={styles.fabLabel}>새 모임</Text>
        </TouchableOpacity>
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
    wrapper: {
        flex: 1,
        backgroundColor: '#FDFBF7',
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    content: {
        padding: 24,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 24,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: '600',
        color: '#2C2724',
        letterSpacing: -0.5,
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: Platform.OS === 'ios' ? 34 : 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8C7D6B',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 28,
        elevation: 8,
        shadowColor: '#3A3125',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        gap: 8,
    },
    fabLabel: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 15,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#3A3125',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        marginBottom: 24,
    },
    cardHeader: {
        padding: 28,
        paddingBottom: 32,
    },
    meetingNumber: {
        fontSize: 13,
        fontWeight: '600',
        color: '#7A7265',
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    bookTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2C2724',
        paddingRight: 80, 
        lineHeight: 32,
        letterSpacing: -0.5,
    },
    cardContent: {
        padding: 28,
        paddingTop: 32,
        position: 'relative',
    },
    coverWrapper: {
        position: 'absolute',
        top: -70,
        right: 24,
        width: 90,
        height: 130,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#FAFAFA',
        elevation: 8,
        shadowColor: '#3A3125',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    author: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4A4238',
        marginBottom: 20,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9F6F0',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 6,
    },
    tagPrimary: {
        backgroundColor: '#F0EBE1',
    },
    tagText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#7A7265',
    },
    tagPrimaryText: {
        color: '#695D4A',
        fontWeight: '600',
    },
    emptyCard: {
        padding: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EBE5D9',
        borderStyle: 'dashed',
        shadowOpacity: 0,
        elevation: 0,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4A4238',
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        color: '#7A7265',
    }
});
