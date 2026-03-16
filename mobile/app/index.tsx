import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMember } from '../context/MemberContext';
import { getMembers } from '../lib/db';
import { Member } from '../lib/types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SelectMemberScreen() {
  const { currentMemberId, setCurrentMemberId, nickname, setNickname } = useMember();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // 별명 입력 단계
  const [step, setStep] = useState<'select' | 'nickname'>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');

  useEffect(() => {
    if (currentMemberId) {
      router.replace('/(tabs)/home');
      return;
    }
    getMembers()
      .then(setMembers)
      .finally(() => setLoading(false));
  }, [currentMemberId, router]);

  // 멤버 선택 → 별명 입력 단계로
  const handleSelect = (member: Member) => {
    setSelectedId(member.id);
    setSelectedName(member.name);
    setNicknameInput('');
    setStep('nickname');
  };

  // 별명 확정 or 건너뛰기 → 홈으로
  const handleConfirm = (nick?: string) => {
    if (!selectedId) return;
    setCurrentMemberId(selectedId);
    setNickname(nick?.trim() || null);
    router.replace('/(tabs)/home');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>불러오는 중…</Text>
      </View>
    );
  }

  // ── 별명 입력 화면 ──
  if (step === 'nickname') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.logo}>✏️</Text>
          <Text style={styles.title}>
            반가워요, <Text style={styles.primaryText}>{selectedName}</Text>님!
          </Text>
          <Text style={styles.subtitle}>앱에서 쓸 별명을 설정할 수 있어요</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={`예: ${selectedName.slice(0, 1)}발제왕`}
              value={nicknameInput}
              onChangeText={setNicknameInput}
              maxLength={12}
              autoFocus
            />
            
            <TouchableOpacity 
              style={[styles.btn, styles.btnPrimary, !nicknameInput.trim() && styles.btnDisabled]} 
              onPress={() => handleConfirm(nicknameInput)}
              disabled={!nicknameInput.trim()}
            >
              <Text style={styles.btnPrimaryText}>별명으로 시작하기</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.btnGhost]} 
              onPress={() => handleConfirm()}
            >
              <Text style={styles.btnGhostText}>건너뛰기 ({selectedName}으로 표시)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ alignSelf: 'center', padding: 10, marginTop: 10 }} 
              onPress={() => setStep('select')}
            >
              <Text style={styles.backText}>← 다시 선택</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── 멤버 선택 화면 ──
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>📚</Text>
        <Text style={styles.title}>천북인권</Text>
        <Text style={styles.subtitle}>나는 누구?</Text>

        {members.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ color: '#666' }}>등록된 멤버가 없어요.</Text>
            <Text style={{ marginTop: 8, color: '#666' }}>관리자에게 멤버 추가를 요청해 주세요.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {members.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.memberBtn}
                onPress={() => handleSelect(m)}
              >
                <Text style={styles.memberBtnText}>{m.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  primaryText: {
    color: '#0070f3',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  memberBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: '40%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    margin: 6,
  },
  memberBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 360,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  btn: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnPrimary: {
    backgroundColor: '#0070f3',
  },
  btnDisabled: {
    backgroundColor: '#ccc',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  btnGhostText: {
    color: '#666',
    fontSize: 15,
  },
  backText: {
    color: '#666',
    fontSize: 14,
  },
});
