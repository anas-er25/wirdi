import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Platform, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import type { HadithItem } from "../../constants/types";
import { getHadithsBySection, getSectionName } from "../../services/hadith";

const PAGE_SIZE = 20;

export default function HadithReader() {
    const router = useRouter();
    const { sectionId } = useLocalSearchParams<{ sectionId: string }>();

    const id = Number(sectionId);

    const [hadiths, setHadiths] = useState<HadithItem[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const sectionName = useMemo(() => getSectionName(id), [id]);

    // Load first page
    useEffect(() => {
        const t = setTimeout(() => {
            const result = getHadithsBySection(id, 0, PAGE_SIZE);
            setHadiths(result.hadiths);
            setHasMore(result.hasMore);
            setTotal(result.total);
            setPage(1);
            setLoading(false);
        }, 50);
        return () => clearTimeout(t);
    }, [id]);

    // Load more pages
    const loadMore = useCallback(() => {
        if (!hasMore) return;

        const result = getHadithsBySection(id, page, PAGE_SIZE);
        setHadiths((prev) => [...prev, ...result.hadiths]);
        setHasMore(result.hasMore);
        setPage((p) => p + 1);
    }, [id, page, hasMore]);

    const renderItem = useCallback(
        ({ item }: { item: HadithItem }) => (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.hadithNum}>حديث رقم {item.hadithnumber}</Text>
                    <Text style={styles.bookRef}>
                        كتاب {item.reference.book} • {item.reference.hadith}
                    </Text>
                </View>
                <Text style={styles.hadithText}>{item.text}</Text>
            </View>
        ),
        []
    );

    const keyExtractor = useCallback(
        (item: HadithItem) => String(item.hadithnumber),
        []
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
                    <Text style={styles.title} numberOfLines={1}>
                        {sectionName}
                    </Text>
                    <Text style={styles.subtitle}>{total} حديث</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <Text style={styles.loadingText}>جاري التحميل...</Text>
                </View>
            ) : (
                <FlatList
                    data={hadiths}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 30 }}
                    showsVerticalScrollIndicator={false}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    ListFooterComponent={
                        hasMore ? (
                            <Text style={styles.loadingMore}>جاري تحميل المزيد...</Text>
                        ) : null
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#EDE1CF",
        padding: 20,
        paddingTop: 26,
        marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },

    header: {
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
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
    title: {
        fontSize: 20,
        fontWeight: "900",
        color: "#9F5921",
        textAlign: "right",
    },
    subtitle: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: "800",
        color: "#7A4318",
        textAlign: "right",
    },

    loadingWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        color: "#9F5921",
        fontWeight: "900",
        fontSize: 14,
    },
    loadingMore: {
        color: "#7A4318",
        fontWeight: "800",
        fontSize: 12,
        textAlign: "center",
        padding: 16,
    },

    card: {
        backgroundColor: "#F6EBDD",
        borderWidth: 1,
        borderColor: "#E2CBB6",
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    hadithNum: {
        color: "#D5A076",
        fontWeight: "900",
        fontSize: 12,
    },
    bookRef: {
        color: "#7A4318",
        fontWeight: "800",
        fontSize: 11,
    },
    hadithText: {
        color: "#9F5921",
        fontWeight: "700",
        fontSize: 16,
        lineHeight: 28,
        textAlign: "right",
    },
});
