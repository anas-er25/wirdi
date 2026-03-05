import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import type { HadithItem, PrayerTimesData } from "../constants/types";
import { getLocationStatus, getNextPrayer, getPrayerTimes, PRAYER_NAMES } from "../services/adhan";
import { getRandomHadith, getSectionName } from "../services/hadith";

function KhatmatCard({ khatmat }: { khatmat: string[] }) {
    const [expanded, setExpanded] = useState(false);
    const displayed = expanded ? khatmat : khatmat.slice(-2).reverse();
    const hidden = khatmat.length - 2;

    return (
        <View style={styles.khatmatCard}>
            <View style={styles.khatmatHeaderRow}>
                <Text style={styles.khatmatTitle}>سجل الختمات 🏆</Text>
                <Text style={styles.khatmatCount}>{khatmat.length} ختمة</Text>
            </View>

            {displayed.map((k, i) => (
                <View key={i} style={styles.khatmaRow}>
                    <Text style={styles.khatmaRowText}>{k}</Text>
                    <Text style={styles.khatmaRowIcon}>✅</Text>
                </View>
            ))}

            {khatmat.length > 2 && (
                <Pressable
                    onPress={() => setExpanded(!expanded)}
                    style={({ pressed }) => [styles.expandBtn, pressed && { opacity: 0.8 }]}
                >
                    <Text style={styles.expandBtnText}>
                        {expanded ? "عرض أقل ▲" : `عرض ${hidden} ختمات أخرى ▼`}
                    </Text>
                </Pressable>
            )}
        </View>
    );
}

export default function Today() {
    const [dailyHizb, setDailyHizb] = useState(1);
    const [progressDays, setProgressDays] = useState(0);
    const [khatmat, setKhatmat] = useState<string[]>([]);
    const [showCelebration, setShowCelebration] = useState(false);
    const [newKhatmaNumber, setNewKhatmaNumber] = useState(0);
    const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
    const [locationStatus, setLocationStatus] = useState<"default" | "custom">("default");
    const [dailyHadith, setDailyHadith] = useState<HadithItem | null>(null);
    const router = useRouter();

    useEffect(() => {
        load();
        loadPrayerTimes();
        loadDailyHadith();
    }, []);

    const load = async () => {
        const hizb = Number((await AsyncStorage.getItem("dailyHizb")) || "1");
        const days = Number((await AsyncStorage.getItem("progressDays")) || "0");
        const storedKhatmat = await AsyncStorage.getItem("khatmat");

        const safeHizb = Number.isFinite(hizb) && hizb >= 1 && hizb <= 60 ? hizb : 1;
        const safeDays = Number.isFinite(days) && days >= 0 ? days : 0;

        setDailyHizb(safeHizb);
        setProgressDays(safeDays);
        setKhatmat(storedKhatmat ? JSON.parse(storedKhatmat) : []);
    };

    const loadPrayerTimes = async () => {
        const data = await getPrayerTimes();
        if (data) setPrayerData(data);
        setLocationStatus(getLocationStatus());
    };

    const loadDailyHadith = async () => {
        const today = new Date().toISOString().split("T")[0];
        const stored = await AsyncStorage.getItem("dailyHadith");

        if (stored) {
            const { date, hadith } = JSON.parse(stored);
            if (date === today) {
                // Même jour → on réutilise le hadith sauvegardé
                setDailyHadith(hadith);
                return;
            }
        }

        // Nouveau jour → on tire un nouveau hadith et on le sauvegarde
        const h = getRandomHadith();
        await AsyncStorage.setItem("dailyHadith", JSON.stringify({ date: today, hadith: h }));
        setDailyHadith(h);
    };

    // Total hizb completed across all khatmat
    const totalHizbDone = useMemo(() => progressDays * dailyHizb, [progressDays, dailyHizb]);

    // Current cycle progress (0–60)
    const currentCycleHizb = useMemo(() => totalHizbDone % 60, [totalHizbDone]);

    const { start, end } = useMemo(() => {
        const startH = currentCycleHizb + 1;
        const endH = Math.min(startH + dailyHizb - 1, 60);
        return { start: startH, end: endH };
    }, [currentCycleHizb, dailyHizb]);

    const percent = useMemo(() => {
        return Math.max(0, Math.min(100, Math.round((currentCycleHizb / 60) * 100)));
    }, [currentCycleHizb]);

    const getKhatmaName = (index: number): string => {
        const ordinals = [
            "الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة",
            "السادسة", "السابعة", "الثامنة", "التاسعة", "العاشرة",
        ];
        if (index < ordinals.length) return `الختمة ${ordinals[index]}`;
        return `الختمة ${index + 1}`;
    };

    const complete = async () => {
        const newDays = progressDays + 1;
        const newTotalHizb = newDays * dailyHizb;

        // Check if a new khatma is completed
        const prevCycles = Math.floor(totalHizbDone / 60);
        const newCycles = Math.floor(newTotalHizb / 60);

        if (newCycles > prevCycles) {
            // A khatma was just completed!
            const date = new Date().toLocaleDateString("ar-MA", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            const khatmaName = getKhatmaName(newCycles - 1);
            const newKhatmat = [...khatmat, `${khatmaName} — ${date}`];

            await AsyncStorage.setItem("khatmat", JSON.stringify(newKhatmat));
            setKhatmat(newKhatmat);
            setNewKhatmaNumber(newCycles);
            setShowCelebration(true);
        }

        await AsyncStorage.setItem("progressDays", String(newDays));
        setProgressDays(newDays);
    };

    const undo = async () => {
        const newDays = Math.max(0, progressDays - 1);
        await AsyncStorage.setItem("progressDays", String(newDays));
        setProgressDays(newDays);
    };

    const nextPrayer = useMemo(() => {
        if (!prayerData) return null;
        return getNextPrayer(prayerData.timings);
    }, [prayerData]);

    return (
        <View style={styles.screen}>
            <StatusBar barStyle={Platform.OS === "ios" ? "dark-content" : "default"} />

            {/* ═══ Celebration Modal ═══ */}
            <Modal
                visible={showCelebration}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCelebration(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalEmoji}>🌟</Text>
                        <Text style={styles.modalTitle}>مبارك!</Text>
                        <Text style={styles.modalSubtitle}>
                            لقد أتممت {getKhatmaName(newKhatmaNumber - 1)} للقرآن الكريم
                        </Text>
                        <Text style={styles.modalHint}>
                            تبدأ الآن من جديد في رحلة روحانية جديدة
                        </Text>
                        <Pressable
                            onPress={() => setShowCelebration(false)}
                            style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.85 }]}
                        >
                            <Text style={styles.modalBtnText}>جزاك الله خيراً</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Top bar */}
            <View style={styles.topBar}>
                <Pressable
                    onPress={() => router.push("/settings")}
                    style={({ pressed }) => [styles.settingsBtn, pressed && styles.settingsBtnPressed]}
                >
                    <Text style={styles.settingsBtnText}>⚙</Text>
                </Pressable>

                <View style={styles.topBarText}>
                    <Text style={styles.title}>ورد اليوم</Text>
                    <Text style={styles.sub}>تابع تقدمك بثبات</Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 30 }}
            >
                {/* ═══ Prayer Times Card ═══ */}
                {prayerData && (
                    <View style={styles.prayerCard}>
                        <View style={styles.prayerHeader}>
                            <Text style={styles.prayerDateHijri}>
                                {prayerData.date.hijri.day} {prayerData.date.hijri.month.ar}{" "}
                                {prayerData.date.hijri.year}
                            </Text>
                            <Text style={styles.prayerDateGreg}>
                                {prayerData.date.readable}
                            </Text>
                            <Text style={styles.locationBadge}>
                                {locationStatus === "custom" ? "📍 موقعك" : "📍 ورزازات"}
                            </Text>
                        </View>

                        {nextPrayer && (
                            <View style={styles.nextPrayerBox}>
                                <Text style={styles.nextPrayerLabel}>الصلاة القادمة</Text>
                                <View style={styles.nextPrayerRow}>
                                    <Text style={styles.nextPrayerTime}>{nextPrayer.time}</Text>
                                    <Text style={styles.nextPrayerName}>{nextPrayer.ar}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.prayerTimesRow}>
                            {PRAYER_NAMES.map((p) => {
                                const isNext = nextPrayer?.key === p.key;
                                return (
                                    <View
                                        key={p.key}
                                        style={[
                                            styles.prayerTimeItem,
                                            isNext && styles.prayerTimeItemActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.prayerTimeLabel,
                                                isNext && styles.prayerTimeLabelActive,
                                            ]}
                                        >
                                            {p.ar}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.prayerTimeValue,
                                                isNext && styles.prayerTimeValueActive,
                                            ]}
                                        >
                                            {prayerData.timings[p.key]}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* ═══ Quran Progress Hero ═══ */}
                <View style={styles.hero}>
                    {/* Khatma badge */}
                    {khatmat.length > 0 && (
                        <View style={styles.khatmaBadgeRow}>
                            <Text style={styles.khatmaBadge}>
                                ختمات مكتملة: {khatmat.length}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.heroLabel}>قراءة اليوم</Text>
                    <Text style={styles.heroRange}>
                        {end === start ? `الحزب ${start}` : `الحزب ${start} — ${end}`}
                    </Text>

                    <View style={styles.progressBox}>
                        <View style={styles.progressMeta}>
                            <Text style={styles.progressText}>التقدم في الختمة الحالية</Text>
                            <Text style={styles.progressText}>{percent}%</Text>
                        </View>

                        <View style={styles.barTrack}>
                            <View style={[styles.barFill, { width: `${percent}%` }]} />
                        </View>

                        <Text style={styles.progressHint}>
                            منجز: {currentCycleHizb} / 60 حزب
                        </Text>
                    </View>

                    <Pressable
                        onPress={complete}
                        style={({ pressed }) => [
                            styles.btn,
                            pressed && styles.btnPressed,
                        ]}
                    >
                        <Text style={styles.btnText}>تم</Text>
                    </Pressable>

                    <Pressable
                        onPress={undo}
                        style={({ pressed }) => [styles.btnGhost, pressed && styles.btnGhostPressed]}
                    >
                        <Text style={styles.btnGhostText}>تراجع</Text>
                    </Pressable>

                    <Text style={styles.note}>
                        اضغط "تم" بعد إنهاء وردك.
                    </Text>
                </View>

                {/* ═══ Khatmat History Card ═══ */}
                {khatmat.length > 0 && (
                    <KhatmatCard khatmat={khatmat} />
                )}

                {/* ═══ Daily Hadith Card ═══ */}
                {dailyHadith && (
                    <Pressable
                        onPress={() =>
                            router.push(`/hadith/${dailyHadith.reference.book}` as any)
                        }
                        style={({ pressed }) => [
                            styles.hadithCard,
                            pressed && { opacity: 0.95 },
                        ]}
                    >
                        <View style={styles.hadithHeader}>
                            <Text style={styles.hadithBadge}>حديث اليوم</Text>
                            <Text style={styles.hadithRef}>
                                {getSectionName(dailyHadith.reference.book)}
                            </Text>
                        </View>
                        <Text style={styles.hadithText} numberOfLines={4}>
                            {dailyHadith.text}
                        </Text>
                        <Text style={styles.hadithMore}>اقرأ المزيد ←</Text>
                    </Pressable>
                )}

                {/* ═══ Navigation Buttons ═══ */}
                <Pressable
                    onPress={() => router.push("/adhkar")}
                    style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.9 }]}
                >
                    <Text style={styles.navBtnText}>الذهاب إلى الأذكار</Text>
                </Pressable>

                <Pressable
                    onPress={() => router.push("/quran")}
                    style={({ pressed }) => [
                        styles.navBtn,
                        { marginTop: 10 },
                        pressed && { opacity: 0.9 },
                    ]}
                >
                    <Text style={styles.navBtnText}>المصحف</Text>
                </Pressable>

                <Pressable
                    onPress={() => router.push("/hadith")}
                    style={({ pressed }) => [
                        styles.navBtn,
                        { marginTop: 10 },
                        pressed && { opacity: 0.9 },
                    ]}
                >
                    <Text style={styles.navBtnText}>صحيح البخاري</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#EDE1CF",
        padding: 20,
        paddingTop: 28,
        marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },

    topBar: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    topBarText: {
        flex: 1,
        marginRight: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: "900",
        color: "#9F5921",
        textAlign: "right",
    },
    sub: {
        marginTop: 6,
        fontSize: 13,
        color: "#7A4318",
        textAlign: "right",
        fontWeight: "700",
    },

    settingsBtn: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: "#F6EBDD",
        borderWidth: 1,
        borderColor: "#E2CBB6",
    },
    settingsBtnPressed: { opacity: 0.9 },
    settingsBtnText: { color: "#9F5921", fontWeight: "900", fontSize: 16 },

    // ─── Celebration Modal ────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 30,
    },
    modalCard: {
        backgroundColor: "#F6EBDD",
        borderRadius: 28,
        padding: 32,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#D5A076",
        width: "100%",
    },
    modalEmoji: {
        fontSize: 56,
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 32,
        fontWeight: "900",
        color: "#9F5921",
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#9F5921",
        textAlign: "center",
        marginBottom: 10,
        lineHeight: 28,
    },
    modalHint: {
        fontSize: 13,
        fontWeight: "700",
        color: "#7A4318",
        textAlign: "center",
        marginBottom: 24,
    },
    modalBtn: {
        backgroundColor: "#D5A076",
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 16,
    },
    modalBtnText: {
        color: "#FFFFFF",
        fontWeight: "900",
        fontSize: 16,
    },

    // ─── Khatma Badge ─────────────────────────────
    khatmaBadgeRow: {
        flexDirection: "row-reverse",
        marginBottom: 10,
    },
    khatmaBadge: {
        fontSize: 12,
        fontWeight: "900",
        color: "#FFFFFF",
        backgroundColor: "#9F5921",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
        overflow: "hidden",
    },

    // ─── Khatmat History Card ─────────────────────
    khatmatCard: {
        backgroundColor: "#F6EBDD",
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2CBB6",
        marginTop: 14,
    },
    khatmatTitle: {
        fontSize: 16,
        fontWeight: "900",
        color: "#9F5921",
        textAlign: "right",
        marginBottom: 14,
    },
    khatmaRow: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#EDE1CF",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 8,
    },
    khatmaRowText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#7A4318",
        textAlign: "right",
        flex: 1,
    },
    khatmaRowIcon: {
        fontSize: 16,
        marginLeft: 8,
    },
    khatmatHeaderRow: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    khatmatCount: {
        fontSize: 12,
        fontWeight: "800",
        color: "#D5A076",
        backgroundColor: "#EDE1CF",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        overflow: "hidden",
    },
    expandBtn: {
        marginTop: 6,
        paddingVertical: 10,
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#E2CBB6",
    },
    expandBtnText: {
        fontSize: 13,
        fontWeight: "900",
        color: "#9F5921",
    },

    // ─── Prayer Times Card ────────────────────────
    prayerCard: {
        backgroundColor: "#F6EBDD",
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2CBB6",
        marginBottom: 14,
    },
    prayerHeader: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    prayerDateHijri: {
        fontSize: 14,
        fontWeight: "900",
        color: "#9F5921",
    },
    prayerDateGreg: {
        fontSize: 12,
        fontWeight: "700",
        color: "#7A4318",
    },
    locationBadge: {
        fontSize: 11,
        fontWeight: "700",
        color: "#9F5921",
        marginTop: 2,
    },
    nextPrayerBox: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "#E2CBB6",
        marginBottom: 12,
    },
    nextPrayerLabel: {
        fontSize: 11,
        fontWeight: "900",
        color: "#D5A076",
        textAlign: "right",
        marginBottom: 6,
    },
    nextPrayerRow: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
    },
    nextPrayerName: {
        fontSize: 22,
        fontWeight: "900",
        color: "#9F5921",
    },
    nextPrayerTime: {
        fontSize: 22,
        fontWeight: "900",
        color: "#9F5921",
    },
    prayerTimesRow: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        gap: 6,
    },
    prayerTimeItem: {
        flex: 1,
        alignItems: "center",
        backgroundColor: "#EDE1CF",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    prayerTimeItemActive: {
        backgroundColor: "#D5A076",
    },
    prayerTimeLabel: {
        fontSize: 10,
        fontWeight: "900",
        color: "#7A4318",
        marginBottom: 4,
    },
    prayerTimeLabelActive: {
        color: "#FFFFFF",
    },
    prayerTimeValue: {
        fontSize: 12,
        fontWeight: "900",
        color: "#9F5921",
    },
    prayerTimeValueActive: {
        color: "#FFFFFF",
    },

    // ─── Quran Progress Hero ──────────────────────
    hero: {
        backgroundColor: "#F6EBDD",
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E2CBB6",
    },
    heroLabel: {
        fontSize: 12,
        fontWeight: "900",
        color: "#D5A076",
        textAlign: "right",
    },
    heroRange: {
        marginTop: 10,
        fontSize: 26,
        fontWeight: "900",
        color: "#9F5921",
        textAlign: "right",
    },

    progressBox: {
        marginTop: 18,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "#E2CBB6",
    },
    progressMeta: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
    },
    progressText: {
        fontSize: 12,
        color: "#9F5921",
        fontWeight: "800",
    },
    barTrack: {
        marginTop: 10,
        height: 10,
        borderRadius: 999,
        backgroundColor: "#EDE1CF",
        overflow: "hidden",
    },
    barFill: {
        height: "100%",
        borderRadius: 999,
        backgroundColor: "#D5A076",
    },
    progressHint: {
        marginTop: 8,
        fontSize: 12,
        color: "#7A4318",
        textAlign: "right",
        fontWeight: "700",
    },

    btn: {
        marginTop: 18,
        backgroundColor: "#D5A076",
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: "center",
    },
    btnDisabled: { backgroundColor: "#E2CBB6" },
    btnPressed: { backgroundColor: "#C48B61" },
    btnText: { color: "#9F5921", fontSize: 16, fontWeight: "900" },

    btnGhost: {
        marginTop: 10,
        backgroundColor: "#F6EBDD",
        borderWidth: 1,
        borderColor: "#D5A076",
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: "center",
    },
    btnGhostPressed: { opacity: 0.9 },
    btnGhostText: { color: "#9F5921", fontSize: 16, fontWeight: "900" },

    note: {
        marginTop: 12,
        fontSize: 12,
        color: "#7A4318",
        textAlign: "right",
        fontWeight: "700",
    },

    // ─── Daily Hadith Card ────────────────────────
    hadithCard: {
        backgroundColor: "#F6EBDD",
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2CBB6",
        marginTop: 14,
    },
    hadithHeader: {
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    hadithBadge: {
        fontSize: 11,
        fontWeight: "900",
        color: "#FFFFFF",
        backgroundColor: "#D5A076",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        overflow: "hidden",
    },
    hadithRef: {
        fontSize: 11,
        fontWeight: "800",
        color: "#7A4318",
    },
    hadithText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#9F5921",
        lineHeight: 26,
        textAlign: "right",
    },
    hadithMore: {
        marginTop: 10,
        fontSize: 12,
        fontWeight: "900",
        color: "#D5A076",
        textAlign: "left",
    },

    // ─── Navigation Buttons ───────────────────────
    navBtn: {
        marginTop: 16,
        backgroundColor: "#F6EBDD",
        borderWidth: 1,
        borderColor: "#D5A076",
        padding: 14,
        borderRadius: 16,
        alignItems: "center",
    },
    navBtnText: { color: "#9F5921", fontWeight: "900" },
});