import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";

function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
}

export default function Today() {
    const [dailyHizb, setDailyHizb] = useState(1);
    const [progressDays, setProgressDays] = useState(0);
    const [doneToday, setDoneToday] = useState(false);
    const router = useRouter();

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        const hizb = Number((await AsyncStorage.getItem("dailyHizb")) || "1");
        const days = Number((await AsyncStorage.getItem("progressDays")) || "0");
        const last = (await AsyncStorage.getItem("lastCompletedDate")) || "";
        const tk = todayKey();

        const safeHizb = Number.isFinite(hizb) && hizb >= 1 && hizb <= 60 ? hizb : 1;
        const safeDays = Number.isFinite(days) && days >= 0 ? days : 0;

        setDailyHizb(safeHizb);
        setProgressDays(safeDays);
        setDoneToday(last === tk);
    };

    const { start, end } = useMemo(() => {
        const startH = progressDays * dailyHizb + 1;
        const endH = Math.min(startH + dailyHizb - 1, 60);
        return { start: startH, end: endH };
    }, [progressDays, dailyHizb]);

    const percent = useMemo(() => {
        const totalDone = Math.min(progressDays * dailyHizb, 60);
        return Math.max(0, Math.min(100, Math.round((totalDone / 60) * 100)));
    }, [progressDays, dailyHizb]);

    const complete = async () => {
        if (doneToday) return;

        const newDays = progressDays + 1;
        await AsyncStorage.multiSet([
            ["progressDays", String(newDays)],
            ["lastCompletedDate", todayKey()],
        ]);

        setProgressDays(newDays);
        setDoneToday(true);
    };

    const undo = async () => {
        if (!doneToday) return;

        const newDays = Math.max(0, progressDays - 1);

        await AsyncStorage.multiSet([
            ["progressDays", String(newDays)],
            ["lastCompletedDate", ""],
        ]);

        setProgressDays(newDays);
        setDoneToday(false);
    };

    return (
        <View style={styles.screen}>
            <StatusBar barStyle={Platform.OS === "ios" ? "dark-content" : "default"} />

            {/* Top bar: title + settings */}
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

            <View style={styles.hero}>
                <Text style={styles.heroLabel}>قراءة اليوم</Text>
                <Text style={styles.heroRange}>
                    {end === start ? `الحزب ${start}` : `الحزب ${start} — ${end}`}
                </Text>

                <View style={styles.progressBox}>
                    <View style={styles.progressMeta}>
                        <Text style={styles.progressText}>التقدم</Text>
                        <Text style={styles.progressText}>{percent}%</Text>
                    </View>

                    <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${percent}%` }]} />
                    </View>

                    <Text style={styles.progressHint}>
                        منجز: {Math.min(progressDays * dailyHizb, 60)} / 60 حزب
                    </Text>
                </View>

                <Pressable
                    onPress={complete}
                    style={({ pressed }) => [
                        styles.btn,
                        doneToday && styles.btnDisabled,
                        pressed && !doneToday && styles.btnPressed,
                    ]}
                >
                    <Text style={styles.btnText}>{doneToday ? "تم اليوم" : "تمّ اليوم"}</Text>
                </Pressable>

                {doneToday && (
                    <Pressable
                        onPress={undo}
                        style={({ pressed }) => [styles.btnGhost, pressed && styles.btnGhostPressed]}
                    >
                        <Text style={styles.btnGhostText}>تراجع</Text>
                    </Pressable>
                )}

                <Text style={styles.note}>
                    {doneToday ? "تم تسجيل إنجاز اليوم." : "سجّل إنجاز اليوم مرة واحدة فقط."}
                </Text>
            </View>
            <Pressable
                onPress={() => router.push("/adhkar")}
                style={({ pressed }) => [
                    {
                        marginTop: 16,
                        backgroundColor: "#F6EBDD",
                        borderWidth: 1,
                        borderColor: "#D5A076",
                        padding: 14,
                        borderRadius: 16,
                        alignItems: "center",
                    },
                    pressed && { opacity: 0.9 },
                ]}
            >
                <Text style={{ color: "#9F5921", fontWeight: "900" }}>
                    الذهاب إلى الأذكار
                </Text>
            </Pressable>

        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#EDE1CF",
        padding: 20,
        paddingTop: 28,
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
    settingsBtnPressed: {
        opacity: 0.9,
    },
    settingsBtnText: {
        color: "#9F5921",
        fontWeight: "900",
        fontSize: 16,
    },

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
    btnDisabled: {
        backgroundColor: "#E2CBB6",
    },
    btnPressed: {
        backgroundColor: "#C48B61",
    },
    btnText: {
        color: "#9F5921",
        fontSize: 16,
        fontWeight: "900",
    },

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
    btnGhostText: {
        color: "#9F5921",
        fontSize: 16,
        fontWeight: "900",
    },

    note: {
        marginTop: 12,
        fontSize: 12,
        color: "#7A4318",
        textAlign: "right",
        fontWeight: "700",
    },
});
