import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMember } from '../../context/MemberContext';
import { getMembers, getMeetings } from '../../lib/db';
import { Member, Meeting } from '../../lib/types';
import { ProfileCard } from '../../components/ProfileCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function MemberProfileScreen() {
  const { id: memberId } = useLocalSearchParams<{ id: string }>();
  const { currentMemberId } = useMember();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const member = members.find((m) => m.id === memberId) ?? null;
  const isMe = currentMemberId === memberId;

  useEffect(() => {
    if (!currentMemberId) {
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
      </View>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>멤버를 찾을 수 없어요</Text>
          <TouchableOpacity style={styles.linkBtn} onPress={() => router.replace('/(tabs)/presenters')}>
            <Text style={styles.linkBtnText}>멤버 목록으로</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const presentedMeetings = meetings
    .filter((m) => m.presenterMemberId === memberId)
    .sort((a, b) => b.date - a.date);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#2C2724" />
            <Text style={styles.backBtnText}>뒤로</Text>
          </TouchableOpacity>
          {isMe && (
            <TouchableOpacity style={styles.mypageLink} onPress={() => router.push('/mypage')}>
              <Text style={styles.mypageLinkText}>마이페이지에서 수정</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <ProfileCard member={member} size="lg" />
        </View>

        <Text style={styles.sectionTitle}>{member.name}님이 발제한 모임</Text>
        {presentedMeetings.length === 0 ? (
          <View style={styles.card}>
            <View style={styles.empty}>
              <Feather name="book-open" size={40} color="#C1B7A7" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>아직 발제한 모임이 없어요</Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            {presentedMeetings.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.listItem}
                onPress={() => router.push(`/meeting/${m.id}`)}
              >
                <Text style={styles.listBook}>{m.book || '책 미정'}</Text>
                <Text style={styles.listMeta}>
                  {formatDate(m.date)} · {m.status === 'done' ? '완료' : '예정'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backBtnText: { fontSize: 16, color: '#2C2724', fontWeight: '600', marginLeft: 8 },
  mypageLink: { paddingVertical: 8, paddingHorizontal: 12 },
  mypageLinkText: { fontSize: 14, color: '#8C7D6B', fontWeight: '600' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EBE5D9',
  },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, color: '#7A7265', marginBottom: 12 },
  empty: { alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 15, color: '#7A7265' },
  linkBtn: { marginTop: 16 },
  linkBtnText: { fontSize: 15, color: '#8C7D6B', fontWeight: '600' },
  listItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EBE5D9' },
  listBook: { fontSize: 15, fontWeight: '600', color: '#2C2724' },
  listMeta: { fontSize: 13, color: '#7A7265', marginTop: 4 },
});
