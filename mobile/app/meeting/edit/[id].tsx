import { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMember } from '../../../context/MemberContext';
import { useAlert } from '../../../context/AlertContext';
import { getMeeting, getMembers, updateMeeting } from '../../../lib/db';
import { Member } from '../../../lib/types';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookCoverSection } from '../../../components/BookCoverSection';

const emptyForm = {
    date: '',
    book: '',
    author: '',
    presenterMemberId: '',
    status: 'upcoming' as 'upcoming' | 'done',
    coverImageUrl: '',
    meetingNumber: '',
};

export default function EditMeetingScreen() {
    const { currentMemberId } = useMember();
    const { showAlert } = useAlert();
    const router = useRouter();
    const { id: meetingId } = useLocalSearchParams<{ id: string }>();

    const [members, setMembers] = useState<Member[]>([]);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!currentMemberId) { router.replace('/'); return; }
        if (!meetingId) { router.back(); return; }

        Promise.all([getMeeting(meetingId), getMembers()])
            .then(([m, mb]) => {
                setMembers(mb);
                if (!m) { showAlert('오류', '모임을 찾을 수 없어요.'); router.back(); return; }
                setForm({
                    date: new Date(m.date).toISOString().slice(0, 10),
                    book: m.book ?? '',
                    author: m.author ?? '',
                    presenterMemberId: m.presenterMemberId ?? '',
                    status: m.status,
                    coverImageUrl: m.coverImageUrl ?? '',
                    meetingNumber: m.meetingNumber != null ? String(m.meetingNumber) : '',
                });
            })
            .finally(() => setLoading(false));
    }, [currentMemberId, meetingId, router, showAlert]);

    const handleSubmit = async () => {
        if (!form.date) return showAlert('오류', '모임 날짜는 필수입니다.');
        setSubmitting(true);
        const meetingNumberVal = form.meetingNumber.trim() ? parseInt(form.meetingNumber) : undefined;
        const data = {
            date: new Date(form.date).getTime(),
            book: form.book.trim(),
            author: form.author.trim(),
            presenterMemberId: form.presenterMemberId,
            status: form.status,
            coverImageUrl: form.coverImageUrl.trim() || undefined,
            ...(meetingNumberVal != null ? { meetingNumber: meetingNumberVal } : {}),
        };
        try {
            await updateMeeting(meetingId as string, data);
            showAlert('완료', '수정되었습니다.', [{ text: '확인', onPress: () => router.back() }]);
        } catch {
            showAlert('오류', '수정 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
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
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
                <ScrollView contentContainerStyle={styles.content}>
                    {/* 헤더 */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
                            <Text style={styles.backBtnText}>← 뒤로가기</Text>
                        </TouchableOpacity>
                        <Text style={styles.pageTitle}>모임 수정</Text>
                    </View>

                    <View style={styles.card}>
                        {/* 모임 번호 */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>모임 번호</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder="번호 입력 (선택)"
                                value={form.meetingNumber}
                                onChangeText={(t) => setForm(p => ({ ...p, meetingNumber: t }))}
                            />
                        </View>

                        {/* 날짜 */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>모임 날짜 * (YYYY-MM-DD)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                value={form.date}
                                onChangeText={(t) => setForm(p => ({ ...p, date: t }))}
                            />
                        </View>

                        {/* 책 제목 */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>책 제목 <Text style={styles.optional}>(선택)</Text></Text>
                            <TextInput
                                style={styles.input}
                                placeholder="예: 채식주의자"
                                value={form.book}
                                onChangeText={(t) => setForm(p => ({ ...p, book: t }))}
                            />
                        </View>

                        {/* 저자 */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>저자</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="예: 한강"
                                value={form.author}
                                onChangeText={(t) => setForm(p => ({ ...p, author: t }))}
                            />
                        </View>

                        {/* 책 표지 */}
                        <View style={styles.formGroup}>
                            <BookCoverSection
                                bookTitle={form.book}
                                author={form.author}
                                coverImageUrl={form.coverImageUrl}
                                onChange={(url) => setForm(p => ({ ...p, coverImageUrl: url }))}
                                disabled={submitting}
                            />
                        </View>

                        {/* 발제자 */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>발제자</Text>
                            <View style={styles.pickerWrap}>
                                <Picker
                                    selectedValue={form.presenterMemberId}
                                    onValueChange={(val) => setForm(p => ({ ...p, presenterMemberId: val }))}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="— 선택 안 함 —" value="" />
                                    {members.map(m => <Picker.Item key={m.id} label={m.name} value={m.id} />)}
                                </Picker>
                            </View>
                        </View>

                        {/* 상태 */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>상태</Text>
                            <View style={styles.statusRow}>
                                {(['upcoming', 'done'] as const).map(s => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.statusBtn, form.status === s && styles.statusBtnActive]}
                                        onPress={() => setForm(p => ({ ...p, status: s }))}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.statusBtnText, form.status === s && styles.statusBtnActiveText]}>
                                            {s === 'upcoming' ? '예정' : '완료'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={submitting}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.submitBtnText}>{submitting ? '수정 중…' : '수정 완료'}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FDFBF7' },
    flex: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBF7' },
    content: { padding: 20, paddingBottom: 60 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
    backBtn: { paddingVertical: 8, paddingRight: 8 },
    backBtnText: { color: '#7A7265', fontSize: 15, fontWeight: '600' },
    pageTitle: { fontSize: 22, fontWeight: '700', color: '#2C2724' },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 20,
        borderWidth: 1, borderColor: '#EBE5D9',
        elevation: 2, shadowColor: '#3A3125', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
    },
    formGroup: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '600', color: '#4A4238', marginBottom: 6 },
    optional: { fontWeight: '400', color: '#7A7265' },
    input: { backgroundColor: '#FDFBF7', borderWidth: 1, borderColor: '#EBE5D9', borderRadius: 8, padding: 12, fontSize: 15, color: '#2C2724' },
    pickerWrap: { borderWidth: 1, borderColor: '#EBE5D9', borderRadius: 8, overflow: 'hidden', backgroundColor: '#FDFBF7' },
    picker: { height: 50 },
    statusRow: { flexDirection: 'row', gap: 10 },
    statusBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#EBE5D9', alignItems: 'center' },
    statusBtnActive: { backgroundColor: '#8C7D6B', borderColor: '#8C7D6B' },
    statusBtnText: { fontSize: 14, fontWeight: '600', color: '#7A7265' },
    statusBtnActiveText: { color: '#fff' },
    submitBtn: { backgroundColor: '#8C7D6B', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 6 },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
