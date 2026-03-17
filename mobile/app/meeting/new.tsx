import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useMember } from '../../context/MemberContext';
import { useAlert } from '../../context/AlertContext';
import { getMembers, addMeeting, getSettings, getMeetings } from '../../lib/db';
import { Member, AppSettings } from '../../lib/types';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookCoverSection } from '../../components/BookCoverSection';

const emptyForm = {
    date: '',
    book: '',
    author: '',
    presenterMemberId: '',
    status: 'upcoming' as 'upcoming' | 'done',
    coverImageUrl: '',
    meetingNumber: '',
    absentMemberIds: [] as string[],
};

export default function NewMeetingScreen() {
    const { currentMemberId } = useMember();
    const { showAlert } = useAlert();
    const router = useRouter();

    const [members, setMembers] = useState<Member[]>([]);
    const [settings, setSettings] = useState<AppSettings>({ firstMeetingNumber: 1 });
    const [meetingsCount, setMeetingsCount] = useState(0);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentMemberId) {
            router.replace('/');
            return;
        }
        Promise.all([getMembers(), getSettings(), getMeetings()])
            .then(([mb, st, mt]) => {
                setMembers(mb);
                setSettings(st);
                setMeetingsCount(mt.length);
            })
            .finally(() => setLoading(false));
    }, [currentMemberId, router]);

    const nextMeetingNumber = settings.firstMeetingNumber + meetingsCount;

    const handleSubmitMeeting = async () => {
        if (!form.date) return showAlert('오류', '모임 날짜는 필수입니다.');
        const meetingNumberVal = form.meetingNumber.trim()
            ? parseInt(form.meetingNumber)
            : nextMeetingNumber;

        const data = {
            date: new Date(form.date).getTime(),
            book: form.book.trim(),
            author: form.author.trim(),
            presenterMemberId: form.presenterMemberId,
            topics: [] as string[],
            status: form.status,
            absentMemberIds: form.absentMemberIds,
            ...(form.coverImageUrl.trim() ? { coverImageUrl: form.coverImageUrl.trim() } : {}),
            ...(meetingNumberVal != null ? { meetingNumber: meetingNumberVal } : {}),
        };

        await addMeeting(data);
        showAlert('성공', '모임이 등록되었습니다!', [
            { text: '확인', onPress: () => router.push('/(tabs)/home') }
        ]);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#8C7D6B" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Text style={styles.backBtnText}>← 뒤로가기</Text>
                        </TouchableOpacity>
                        <Text style={styles.pageTitle}>새 독서모임 등록</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.formGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>모임 번호</Text>
                                <Text style={styles.labelHint}>(자동: 제{nextMeetingNumber}회)</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder={`자동 입력 (제${nextMeetingNumber}회)`}
                                value={form.meetingNumber}
                                onChangeText={(t) => setForm((p) => ({ ...p, meetingNumber: t }))}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>모임 날짜 * (YYYY-MM-DD)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                value={form.date}
                                onChangeText={(t) => setForm((p) => ({ ...p, date: t }))}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>책 제목 <Text style={{ fontWeight: '400', color: '#888' }}>(선택)</Text></Text>
                            <TextInput
                                style={styles.input}
                                placeholder="예: 채식주의자"
                                value={form.book}
                                onChangeText={(t) => setForm((p) => ({ ...p, book: t }))}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>저자</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="예: 한강"
                                value={form.author}
                                onChangeText={(t) => setForm((p) => ({ ...p, author: t }))}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <BookCoverSection
                                bookTitle={form.book}
                                author={form.author}
                                coverImageUrl={form.coverImageUrl}
                                onChange={(url) => setForm(p => ({ ...p, coverImageUrl: url }))}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>발제자</Text>
                            <View style={styles.pickerWrap}>
                                {Platform.OS === 'web' ? (
                                    <select
                                        style={styles.webSelect}
                                        value={form.presenterMemberId}
                                        onChange={(e) => setForm({ ...form, presenterMemberId: e.target.value })}
                                    >
                                        <option value="">— 선택 안 함 —</option>
                                        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                ) : (
                                    <Picker
                                        selectedValue={form.presenterMemberId}
                                        onValueChange={(val) => setForm({ ...form, presenterMemberId: val })}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="— 선택 안 함 —" value="" />
                                        {members.map((m) => (
                                            <Picker.Item key={m.id} label={m.name} value={m.id} />
                                        ))}
                                    </Picker>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitMeeting}>
                            <Text style={styles.submitBtnText}>모임 등록 완료</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 60 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backBtn: { paddingVertical: 8, paddingRight: 10, marginRight: 10 },
    backBtnText: { color: '#666', fontSize: 15, fontWeight: '600' },
    pageTitle: { fontSize: 22, fontWeight: '700', color: '#111' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
    },
    formGroup: { marginBottom: 20 },
    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
    labelHint: { fontSize: 12, color: '#888', marginLeft: 6 },
    input: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 12, fontSize: 15,
    },
    pickerWrap: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, overflow: 'hidden', backgroundColor: '#fff' },
    webSelect: { width: '100%', padding: 12, fontSize: 15, borderWidth: 0, backgroundColor: 'transparent' },
    picker: { width: '100%', height: 50 },
    submitBtn: {
        backgroundColor: '#8C7D6B',
        paddingVertical: 16,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 10,
    },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
