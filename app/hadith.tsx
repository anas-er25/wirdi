import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { HadithSection } from "../constants/types";
import { getSections } from "../services/hadith";

export default function HadithSections() {
    const router = useRouter();
    const [sections, setSections] = useState<HadithSection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load on next tick to avoid blocking the UI thread
        const t = setTimeout(() => {
            const data = getSections();
            setSections(data);
            setLoading(false);
        }, 50);
        return () => clearTimeout(t);
    }, []);

    const renderItem = useMemo(
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
                            {
                                item.hadithCount === 0
                                    ? "لا يوجد حديث الآن"
                                    : item.hadithCount === 1
                                        ? "حديث"
                                        : item.hadithCount >= 3 && item.hadithCount <= 10
                                            ? `${item.hadithCount} أحاديث`
                                            : `${item.hadithCount} حديثًا`
                            }
                        </Text>
                    </View>
                    <View style={styles.rowBadge}>
                        <Text style={styles.rowBadgeText}>{item.id}</Text>
                    </View>
                </Pressable>
            ),
        [router]
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
                    <Text style={styles.subtitle}>
                        {sections.length} كتاب
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <Text style={styles.loadingText}>جاري التحميل...</Text>
                </View>
            ) : (
                <FlatList
                    data={sections}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
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
    screen: {
        flex: 1,
        backgroundColor: "#EDE1CF",
        padding: 20,
        paddingTop: 26,
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
        fontSize: 22,
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
    rowContent: {
        flex: 1,
    },
    rowName: {
        color: "#9F5921",
        fontWeight: "900",
        fontSize: 15,
        textAlign: "right",
        lineHeight: 22,
    },
    rowCount: {
        marginTop: 4,
        color: "#7A4318",
        fontWeight: "800",
        fontSize: 12,
        textAlign: "right",
    },
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
    rowBadgeText: {
        color: "#9F5921",
        fontWeight: "900",
        fontSize: 13,
    },
});
