import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMember } from '../../context/MemberContext';
import { getMeetings, getMembers } from '../../lib/db';
import { Meeting, Member } from '../../lib/types';
import { SafeAreaView } from 'react-native-safe-area-context';

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
                <ActivityIndicator size="large" color="#0070f3" />
                <Text style={{ marginTop: 10, color: '#666' }}>불러오는 중…</Text>
            </View>
        );
    }

    const upcoming = meetings.filter((m) => m.status === 'upcoming').sort((a, b) => a.date - b.date);
    const next = upcoming[0] ?? null;

    const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? '미정';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.pageTitle}>모임 정보</Text>
                <TouchableOpacity 
                    style={styles.newBtn} 
                    onPress={() => router.push('/meeting/new')}
                >
                    <Text style={styles.newBtnText}>+ 새 독서모임</Text>
                </TouchableOpacity>
            </View>

            {next ? (
                <TouchableOpacity 
                    style={styles.card} 
                    activeOpacity={0.8}
                    onPress={() => router.push(`/meeting/${next.id}`)}
                >
                    <View style={styles.cardHeader}>
                        <Text style={styles.meetingNumber}>
                            {next.meetingNumber != null ? `제${next.meetingNumber}회 모임` : '다음 모임'}
                        </Text>
                        <Text style={styles.bookTitle}>『{next.book}』</Text>
                    </View>

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
                                <Text style={styles.tagText}>📅 {formatDate(next.date)}</Text>
                            </View>
                            <View style={[styles.tag, styles.tagPrimary]}>
                                <Text style={[styles.tagText, styles.tagPrimaryText]}>
                                    🎤 {getMemberName(next.presenterMemberId)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            ) : (
                <View style={[styles.card, styles.emptyCard]}>
                    <Text style={{ fontSize: 40, marginBottom: 10 }}>📅</Text>
                    <Text style={{ fontSize: 16, color: '#666' }}>예정된 모임이 없어요</Text>
                </View>
            )}
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111',
    },
    newBtn: {
        backgroundColor: '#0070f3',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    newBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        marginBottom: 20,
    },
    cardHeader: {
        backgroundColor: '#FFDE59',
        padding: 24,
        paddingBottom: 24,
    },
    meetingNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.6)',
        marginBottom: 8,
    },
    bookTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111',
        paddingRight: 80, 
    },
    cardContent: {
        padding: 24,
        paddingTop: 30,
        position: 'relative',
    },
    coverWrapper: {
        position: 'absolute',
        top: -60,
        right: 20,
        width: 86,
        height: 124,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#fff',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    author: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    tag: {
        backgroundColor: '#f5f5f5',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 100,
    },
    tagPrimary: {
        backgroundColor: '#e6f4fe',
    },
    tagText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    tagPrimaryText: {
        color: '#0070f3',
    },
    emptyCard: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
