import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Platform, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import type { HadithItem, HadithSection } from "../constants/types";
import { getSectionName, getSections, searchHadiths } from "../services/hadith";

export default function HadithSections() {
    const router = useRouter();
    const [sections, setSections] = useState<HadithSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<HadithItem[]>([]);
    const [searching, setSearching] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            const data = getSections();
            setSections(data);
            setLoading(false);
        }, 50);
        return () => clearTimeout(t);
    }, []);

    const handleSearch = (text: string) => {
        setQuery(text);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        if (!text.trim()) {
            setSearchResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        searchTimer.current = setTimeout(() => {
            const results = searchHadiths(text);
            setSearchResults(results);
            setSearching(false);
        }, 300);
    };

    const renderSection = useMemo(
        () =>
            ({ item }: { item: HadithSection }) =>
            (
                <Pressable
                    onPress={() => router.push(`/hadith/${item.id}` as any)}
                    style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
                >
                    <View style={styles.rowContent}>
                        <Text style={styles.rowName}>{item.name}</Text>
                        <Text style={styles.rowCount}>
                            {item.hadithCount === 0
                                ? "لا يوجد حديث الآن"
                                : item.hadithCount === 1
                                    ? "حديث"
                                    : item.hadithCount >= 3 && item.hadithCount <= 10
                                        ? `${item.hadithCount} أحاديث`
                                        : `${item.hadithCount} حديثًا`}
                        </Text>
                    </View>
                    <View style={styles.rowBadge}>
                        <Text style={styles.rowBadgeText}>{item.id}</Text>
                    </View>
                </Pressable>
            ),
        [router]
    );

    const renderResult = ({ item }: { item: HadithItem }) => (
        <Pressable
            onPress={() => router.push(`/hadith/${item.reference.book}` as any)}
            style={({ pressed }) => [styles.resultRow, pressed && { opacity: 0.9 }]}
        >
            <View style={styles.resultMeta}>
                <Text style={styles.resultSection}>{getSectionName(item.reference.book)}</Text>
                <Text style={styles.resultNum}>#{item.hadithnumber}</Text>
            </View>
            <Text style={styles.resultText} numberOfLines={4}>{item.text}</Text>
        </Pressable>
    );

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.9 }]}
                >
                    <Text style={styles.backText}>↩</Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>صحيح البخاري</Text>
                    <Text style={styles.subtitle}>{sections.length} كتاب</Text>
                </View>
            </View>

            {/* Search bar */}
            <View style={styles.searchWrap}>
                <TextInput
                    style={styles.searchInput}
                    value={query}
                    onChangeText={handleSearch}
                    placeholder="ابحث في الأحاديث..."
                    placeholderTextColor="#B89A7A"
                    textAlign="right"
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <Pressable onPress={() => handleSearch("")} style={styles.clearBtn}>
                        <Text style={styles.clearBtnText}>✕</Text>
                    </Pressable>
                )}
            </View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <Text style={styles.loadingText}>جاري التحميل...</Text>
                </View>
            ) : query.trim() ? (
                searching ? (
                    <View style={styles.loadingWrap}>
                        <Text style={styles.loadingText}>جاري البحث...</Text>
                    </View>
                ) : searchResults.length === 0 ? (
                    <View style={styles.loadingWrap}>
                        <Text style={styles.loadingText}>لا نتائج</Text>
                    </View>
                ) : (
                    <FlatList
                        data={searchResults}
                        keyExtractor={(item) => String(item.hadithnumber)}
                        renderItem={renderResult}
                        contentContainerStyle={{ paddingBottom: 30 }}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                    />
                )
            ) : (
                <FlatList
                    data={sections}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderSection}
                    contentContainerStyle={{ paddingBottom: 30 }}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={15}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#EDE1CF", padding: 20, paddingTop: 26, marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, },

    header: {
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#F6EBDD",
        borderWidth: 1,
        borderColor: "#E2CBB6",
        alignItems: "center",
        justifyContent: "center",
    },
    backText: { color: "#9F5921", fontWeight: "900", fontSize: 18 },
    title: { fontSize: 22, fontWeight: "900", color: "#9F5921", textAlign: "right" },
    subtitle: { marginTop: 4, fontSize: 12, fontWeight: "800", color: "#7A4318", textAlign: "right" },

    searchWrap: {
        flexDirection: "row-reverse",
        alignItems: "center",
        backgroundColor: "#F6EBDD",
        borderWidth: 1,
        borderColor: "#E2CBB6",
        borderRadius: 16,
        paddingHorizontal: 14,
        marginBottom: 14,
    },
    searchInput: {
        flex: 1,
        height: 46,
        color: "#9F5921",
        fontWeight: "800",
        fontSize: 15,
    },
    clearBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
    clearBtnText: { color: "#B89A7A", fontWeight: "900", fontSize: 14 },

    loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    loadingText: { color: "#9F5921", fontWeight: "900", fontSize: 14 },

    row: {
        backgroundColor: "#F6EBDD",
        borderWidth: 1,
        borderColor: "#E2CBB6",
        borderRadius: 18,
        padding: 16,
        marginBottom: 10,
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 12,
    },
    rowContent: { flex: 1 },
    rowName: { color: "#9F5921", fontWeight: "900", fontSize: 15, textAlign: "right", lineHeight: 22 },
    rowCount: { marginTop: 4, color: "#7A4318", fontWeight: "800", fontSize: 12, textAlign: "right" },
    rowBadge: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#EDE1CF",
        borderWidth: 1,
        borderColor: "#D5A076",
        alignItems: "center",
        justifyContent: "center",
    },
    rowBadgeText: { color: "#9F5921", fontWeight: "900", fontSize: 13 },

    resultRow: {
        backgroundColor: "#F6EBDD",
        borderWidth: 1,
        borderColor: "#E2CBB6",
        borderRadius: 18,
        padding: 14,
        marginBottom: 10,
    },
    resultMeta: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    resultSection: { color: "#9F5921", fontWeight: "900", fontSize: 12 },
    resultNum: { color: "#B89A7A", fontWeight: "700", fontSize: 12 },
    resultText: {
        color: "#5C3A1E",
        fontWeight: "700",
        fontSize: 15,
        lineHeight: 26,
        textAlign: "right",
    },
});
