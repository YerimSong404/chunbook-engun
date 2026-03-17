import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Image, ScrollView,
    ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

interface BookSearchResult {
    title: string;
    author: string;
    coverUrl: string;
    coverId: string | number;
}

interface Props {
    bookTitle: string;
    author: string;
    coverImageUrl: string;
    onChange: (url: string) => void;
    disabled?: boolean;
}

type Mode = 'search' | 'gallery';

export function BookCoverSection({ bookTitle, author, coverImageUrl, onChange, disabled }: Props) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>('search');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<BookSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const hasCover = !!coverImageUrl?.trim();
    const autoQuery = [bookTitle, author].filter(Boolean).join(' ');
    const effectiveQuery = query.trim() || autoQuery;

    const searchAladin = async (q: string): Promise<BookSearchResult[] | null> => {
        const ttbKey = process.env.EXPO_PUBLIC_ALADIN_TTB_KEY;
        if (!ttbKey) return null;
        try {
            const params = new URLSearchParams({
                ttbkey: ttbKey,
                Query: q,
                QueryType: 'Keyword',
                MaxResults: '8',
                Start: '1',
                SearchTarget: 'Book',
                Cover: 'Big',
                output: 'js',
                Version: '20131101',
            });
            const res = await fetch(`https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?${params}`, {
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) return null;
            const raw = await res.text();
            const jsonStr = raw.replace(/;\s*$/, '').trim();
            const data = JSON.parse(jsonStr) as {
                item?: Array<{ title?: string; author?: string; cover?: string; isbn13?: string }>;
            };
            const items = (data.item ?? [])
                .filter(it => !!it.cover)
                .slice(0, 8)
                .map((it, i) => ({
                    title: it.title ?? '제목 없음',
                    author: it.author ?? '',
                    coverUrl: it.cover!,
                    coverId: i,
                }));
            return items.length > 0 ? items : null;
        } catch {
            return null;
        }
    };

    const searchOpenLibrary = async (q: string): Promise<BookSearchResult[]> => {
        const res = await fetch(
            `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=title,author_name,cover_i`
        );
        if (!res.ok) throw new Error('검색에 실패했어요.');
        const data = await res.json() as {
            docs?: Array<{ title?: string; author_name?: string[]; cover_i?: number }>;
        };
        return (data.docs ?? [])
            .filter(d => d.cover_i != null)
            .slice(0, 8)
            .map(d => ({
                title: d.title ?? '제목 없음',
                author: d.author_name?.[0] ?? '',
                coverUrl: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`,
                coverId: d.cover_i!,
            }));
    };

    const handleSearch = async () => {
        const q = effectiveQuery.trim();
        if (q.length < 2) {
            setSearchError('책 제목 또는 저자를 2자 이상 입력해 주세요.');
            return;
        }
        setSearchError(null);
        setSearching(true);
        setResults([]);
        try {
            // 알라딘 우선 검색, 없으면 Open Library 폴백
            const aladinResults = await searchAladin(q);
            const items = aladinResults ?? await searchOpenLibrary(q);
            setResults(items);
            if (items.length === 0) {
                setSearchError('검색 결과가 없어요. 다른 검색어를 시도하거나 URL을 직접 입력해 주세요.');
            }
        } catch {
            setSearchError('검색 중 오류가 발생했어요.');
        } finally {
            setSearching(false);
        }
    };

    const handlePickImage = async () => {
        setUploadError(null);
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            setUploadError('갤러리 접근 권한이 필요해요.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.6,
            base64: true,
        });
        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            if (asset.base64) {
                const ext = asset.mimeType?.includes('png') ? 'png' : 'jpeg';
                onChange(`data:image/${ext};base64,${asset.base64}`);
            } else if (asset.uri) {
                onChange(asset.uri);
            }
        }
    };

    return (
        <View>
            {/* 헤더 토글 */}
            <TouchableOpacity
                style={styles.header}
                onPress={() => !disabled && setOpen(o => !o)}
                activeOpacity={0.7}
                disabled={disabled}
            >
                <View style={styles.headerLeft}>
                    <Feather name="image" size={16} color="#695D4A" />
                    <Text style={styles.headerTitle}>
                        책 표지 <Text style={styles.optional}>(선택)</Text>
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    {hasCover && (
                        <View style={styles.thumbWrap}>
                            <Image source={{ uri: coverImageUrl }} style={styles.thumb} />
                        </View>
                    )}
                    <Feather name={open ? 'chevron-up' : 'chevron-down'} size={20} color="#8C7D6B" />
                </View>
            </TouchableOpacity>

            {open && (
                <View style={styles.body}>
                    {/* 탭 */}
                    <View style={styles.tabs}>
                        {(['search', 'gallery'] as const).map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, mode === tab && styles.tabActive]}
                                onPress={() => setMode(tab)}
                                activeOpacity={0.7}
                            >
                                <Feather
                                    name={tab === 'search' ? 'search' : 'image'}
                                    size={14}
                                    color={mode === tab ? '#695D4A' : '#8C7D6B'}
                                />
                                <Text style={[styles.tabText, mode === tab && styles.tabTextActive]}>
                                    {tab === 'search' ? '검색으로 찾기' : '갤러리에서 선택'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* 검색 탭 */}
                    {mode === 'search' && (
                        <View>
                            <Text style={styles.hint}>
                                Open Library에서 책 표지를 검색해요. 제목·저자를 입력하세요.
                            </Text>
                            <View style={styles.searchRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    placeholder={autoQuery ? `비우면 「${autoQuery}」로 검색` : '예: 채식주의자 한강'}
                                    value={query}
                                    onChangeText={setQuery}
                                    onSubmitEditing={handleSearch}
                                    returnKeyType="search"
                                    editable={!disabled}
                                />
                                <TouchableOpacity
                                    style={[styles.searchBtn, (searching || disabled) && styles.btnDisabled]}
                                    onPress={handleSearch}
                                    disabled={searching || disabled}
                                    activeOpacity={0.8}
                                >
                                    {searching
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : <Text style={styles.searchBtnText}>검색</Text>
                                    }
                                </TouchableOpacity>
                            </View>

                            {!!searchError && <Text style={styles.errorText}>{searchError}</Text>}

                            {results.length > 0 && (
                                <View style={styles.resultsWrap}>
                                    <Text style={styles.resultsLabel}>결과에서 선택</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.resultsScroll}>
                                        {results.map(r => (
                                            <TouchableOpacity
                                                key={r.coverId}
                                                style={[
                                                    styles.resultCard,
                                                    coverImageUrl === r.coverUrl && styles.resultCardSelected,
                                                ]}
                                                onPress={() => onChange(r.coverUrl)}
                                                activeOpacity={0.7}
                                            >
                                                <Image source={{ uri: r.coverUrl }} style={styles.resultImg} />
                                                <Text style={styles.resultTitle} numberOfLines={2}>{r.title}</Text>
                                                {!!r.author && <Text style={styles.resultAuthor} numberOfLines={1}>{r.author}</Text>}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* URL 직접 입력 */}
                            <Text style={[styles.hint, { marginTop: 12 }]}>또는 이미지 URL 직접 입력</Text>
                            <View style={styles.urlRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    placeholder="https://covers.openlibrary.org/..."
                                    value={hasCover && !coverImageUrl.startsWith('data:') ? coverImageUrl : ''}
                                    onChangeText={onChange}
                                    editable={!disabled}
                                    autoCapitalize="none"
                                    keyboardType="url"
                                />
                                {hasCover && (
                                    <View style={styles.thumbWrap}>
                                        <Image source={{ uri: coverImageUrl }} style={styles.thumb} />
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* 갤러리 탭 */}
                    {mode === 'gallery' && (
                        <View style={styles.galleryWrap}>
                            <TouchableOpacity
                                style={[styles.galleryBtn, disabled && styles.btnDisabled]}
                                onPress={handlePickImage}
                                disabled={disabled}
                                activeOpacity={0.8}
                            >
                                <Feather name="upload" size={18} color="#695D4A" />
                                <Text style={styles.galleryBtnText}>사진 선택 (갤러리)</Text>
                            </TouchableOpacity>
                            {!!uploadError && <Text style={styles.errorText}>{uploadError}</Text>}
                            {hasCover && (
                                <View style={styles.previewWrap}>
                                    <Image source={{ uri: coverImageUrl }} style={styles.previewImg} />
                                </View>
                            )}
                        </View>
                    )}

                    {/* 초기화 버튼 */}
                    {hasCover && (
                        <TouchableOpacity onPress={() => onChange('')} style={styles.clearBtn}>
                            <Text style={styles.clearBtnText}>표지 제거</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 2,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 13, fontWeight: '600', color: '#4A4238' },
    optional: { fontWeight: '400', color: '#7A7265' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    thumbWrap: { width: 28, height: 40, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#EBE5D9' },
    thumb: { width: '100%', height: '100%' },

    body: {
        borderTopWidth: 1,
        borderTopColor: '#EBE5D9',
        paddingTop: 14,
        gap: 0,
    },

    tabs: {
        flexDirection: 'row',
        backgroundColor: '#F0EBE1',
        borderRadius: 8,
        padding: 3,
        marginBottom: 14,
        gap: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        borderRadius: 6,
    },
    tabActive: { backgroundColor: '#fff' },
    tabText: { fontSize: 12, fontWeight: '600', color: '#8C7D6B' },
    tabTextActive: { color: '#695D4A' },

    hint: { fontSize: 11, color: '#7A7265', marginBottom: 8 },

    searchRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    input: { backgroundColor: '#FDFBF7', borderWidth: 1, borderColor: '#EBE5D9', borderRadius: 8, padding: 10, fontSize: 14, color: '#2C2724' },
    searchBtn: { backgroundColor: '#8C7D6B', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', minWidth: 60 },
    searchBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    btnDisabled: { opacity: 0.6 },
    errorText: { fontSize: 12, color: '#C45C4A', marginTop: 6, marginBottom: 4 },

    resultsWrap: { marginTop: 12 },
    resultsLabel: { fontSize: 12, fontWeight: '600', color: '#4A4238', marginBottom: 8 },
    resultsScroll: { marginBottom: 4 },
    resultCard: {
        width: 90,
        marginRight: 10,
        alignItems: 'center',
        borderRadius: 8,
        padding: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    resultCardSelected: { borderColor: '#8C7D6B', backgroundColor: '#F0EBE1' },
    resultImg: { width: 76, height: 110, borderRadius: 4, marginBottom: 6, backgroundColor: '#EBE5D9' },
    resultTitle: { fontSize: 11, color: '#2C2724', textAlign: 'center', fontWeight: '500' },
    resultAuthor: { fontSize: 10, color: '#7A7265', textAlign: 'center', marginTop: 2 },

    urlRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },

    galleryWrap: { alignItems: 'flex-start', gap: 12 },
    galleryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D4C9B8',
        backgroundColor: '#FDFBF7',
    },
    galleryBtnText: { fontSize: 14, fontWeight: '600', color: '#695D4A' },
    previewWrap: { width: 80, height: 116, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#EBE5D9' },
    previewImg: { width: '100%', height: '100%' },

    clearBtn: { marginTop: 10, alignSelf: 'flex-end' },
    clearBtnText: { fontSize: 12, color: '#C45C4A', fontWeight: '600' },
});
