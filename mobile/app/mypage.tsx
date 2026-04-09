import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMember } from '../context/MemberContext';
import { useAlert } from '../context/AlertContext';
import { getMembers, getMeetings, updateMember } from '../lib/db';
import { Member, Meeting } from '../lib/types';
import { ProfileCard } from '../components/ProfileCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const PROFILE_COLORS = [
  '#FFB5C2', '#B5EAD7', '#C7CEEA', '#FFDAC1',
  '#E2F0CB', '#B4D7FF', '#F9D5E5', '#FFF0B5', '#DDA0DD',
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function MypageScreen() {
  const { currentMemberId, nickname, setNickname, setCurrentMemberId } = useMember();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [nickInput, setNickInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [color, setColor] = useState('');
  const [saving, setSaving] = useState(false);

  const member = members.find((m) => m.id === currentMemberId) ?? null;

  useEffect(() => {
    if (!currentMemberId) {
      router.replace('/');
      return;
    }
    Promise.all([getMembers(), getMeetings()])
      .then(([mb, mt]) => {
        setMembers(mb);
        setMeetings(mt);
        const m = mb.find((x) => x.id === currentMemberId);
        if (m) {
          setNickInput(nickname ?? '');
          setStatusMessage(m.statusMessage ?? '');
          setProfileImageUrl(m.profileImageUrl ?? '');
          setColor(m.color ?? '');
        } else {
          setCurrentMemberId(null);
          router.replace('/');
        }
      })
      .finally(() => setLoading(false));
  }, [currentMemberId, nickname, router]);

  const handleSave = async () => {
    if (!currentMemberId) return;
    setSaving(true);
    try {
      await setNickname(nickInput.trim() || null);
      await updateMember(currentMemberId, {
        statusMessage: statusMessage.trim() || undefined,
        profileImageUrl: profileImageUrl.trim() || undefined,
        color: color.trim() || undefined,
      });
      const [mb] = await Promise.all([getMembers()]);
      setMembers(mb);
      showAlert('저장 완료', '프로필이 저장되었어요.');
    } catch {
      showAlert('오류', '저장 중 오류가 발생했어요.');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setProfileImageUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const removeImage = () => setProfileImageUrl('');

  const handleChangeUser = () => {
    showAlert('다른 사용자로 변경', '다른 멤버로 전환할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '변경',
        onPress: async () => {
          await setCurrentMemberId(null);
          router.replace('/');
        },
      },
    ]);
  };

  if (!currentMemberId) return null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8C7D6B" />
      </View>
    );
  }

  if (!member) return null;

  const myPresentedMeetings = meetings
    .filter((m) => m.presenterMemberId === currentMemberId)
    .sort((a, b) => b.date - a.date);

  const displayMember: Member = {
    ...member,
    profileImageUrl: profileImageUrl || member.profileImageUrl,
    statusMessage: statusMessage !== '' ? statusMessage : member.statusMessage,
    color: color || member.color,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#2C2724" />
          <Text style={styles.backBtnText}>뒤로가기</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>마이페이지</Text>

        <View style={styles.card}>
          <ProfileCard
            member={displayMember}
            displayName={nickInput.trim() || nickname || member.name}
            size="lg"
          />
        </View>

        <Text style={styles.sectionTitle}>프로필 수정</Text>
        <View style={styles.card}>
          <Text style={styles.label}>별명 (앱에서 표시되는 이름)</Text>
          <TextInput
            style={styles.input}
            value={nickInput}
            onChangeText={setNickInput}
            placeholder="별명을 입력하면 상단에 이 이름이 표시돼요"
            placeholderTextColor="#C1B7A7"
            maxLength={12}
          />

          <Text style={[styles.label, { marginTop: 20 }]}>상태 메시지</Text>
          <TextInput
            style={styles.input}
            value={statusMessage}
            onChangeText={setStatusMessage}
            placeholder="한 줄로 나를 소개해 보세요"
            placeholderTextColor="#C1B7A7"
            maxLength={80}
          />

          <Text style={[styles.label, { marginTop: 20 }]}>프로필 이미지</Text>
          <View style={styles.imageRow}>
            <View style={styles.previewWrap}>
              <View style={styles.previewCircle}>
                {profileImageUrl ? (
                  <>
                    <Image source={{ uri: profileImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    <TouchableOpacity style={styles.removeBtn} onPress={removeImage} hitSlop={12}>
                      <Feather name="x" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Feather name="image" size={28} color="#7A7265" />
                )}
              </View>
              <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
                <Text style={styles.imageBtnText}>{profileImageUrl ? '사진 변경' : '사진 올리기'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>대표 컬러</Text>
          <View style={styles.colorRow}>
            {PROFILE_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorBtn, { backgroundColor: c }, color === c && styles.colorBtnActive]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Feather name="save" size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>{saving ? '저장 중…' : '저장'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>내가 발제한 모임</Text>
        {myPresentedMeetings.length === 0 ? (
          <View style={styles.card}>
            <View style={styles.empty}>
              <Feather name="book-open" size={40} color="#C1B7A7" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>아직 발제한 모임이 없어요</Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            {myPresentedMeetings.map((m) => (
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

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>계정</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.changeUserBtn} onPress={handleChangeUser}>
            <Feather name="log-out" size={18} color="#8C7D6B" style={{ marginRight: 8 }} />
            <Text style={styles.changeUserBtnText}>다른 사용자로 변경</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBF7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBF7' },
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtnText: { fontSize: 16, color: '#2C2724', fontWeight: '600', marginLeft: 8 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#2C2724', marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, color: '#7A7265', marginBottom: 12 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EBE5D9',
  },
  label: { fontSize: 12, fontWeight: '600', color: '#7A7265', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#EBE5D9',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: '#2C2724',
    backgroundColor: '#FFF',
  },
  imageRow: { marginTop: 8 },
  previewWrap: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  previewCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBE5D9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  removeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  imageBtnText: { fontSize: 14, color: '#8C7D6B', fontWeight: '600' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorBtn: { width: 40, height: 40, borderRadius: 20 },
  colorBtnActive: { borderWidth: 3, borderColor: '#2C2724' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8C7D6B',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
  },
  saveBtnDisabled: { backgroundColor: '#C1B7A7' },
  saveBtnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  empty: { alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 15, color: '#7A7265' },
  listItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EBE5D9' },
  listBook: { fontSize: 15, fontWeight: '600', color: '#2C2724' },
  listMeta: { fontSize: 13, color: '#7A7265', marginTop: 4 },
  changeUserBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  changeUserBtnText: { fontSize: 15, color: '#8C7D6B', fontWeight: '600' },
});
