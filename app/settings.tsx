import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
// import { scheduleDailyNotification } from "../services/notifications";

export default function Settings() {
    const router = useRouter();
    const [hizb, setHizb] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const v = await AsyncStorage.getItem("dailyHizb");
            setHizb(v || "1");
        })();
    }, []);

    const parsed = useMemo(() => Number(hizb.replace(/[^\d]/g, "")), [hizb]);

    const save = async () => {
        setError(null);

        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 60) {
            setError("أدخل رقمًا بين 1 و 60");
            return;
        }

        await AsyncStorage.setItem("dailyHizb", String(parsed));

        // Reminder Quran daily (16:30). Change later from UI.
        // await scheduleDailyNotification(
        //     "quranReminder",
        //     "وردي",
        //     "لا تنس وردك اليوم",
        //     16,
        //     30
        // );

        // await scheduleDailyNotification(
        //     "morningAdhkar",
        //     "أذكار الصباح",
        //     "ابدأ يومك بالذكر",
        //     7,
        //     0
        // );

        // await scheduleDailyNotification(
        //     "eveningAdhkar",
        //     "أذكار المساء",
        //     "لا تنس أذكار المساء",
        //     18,
        //     30
        // );


        router.back();
    };

    const resetProgress = async () => {
        await AsyncStorage.multiSet([
            ["progressDays", "0"],
            ["lastCompletedDate", ""],
        ]);
        router.back();
    };

    return (
        <View style={styles.screen}>
            <View style={styles.card}>
                <Text style={styles.title}>الإعدادات</Text>

                <Text style={styles.label}>تعديل عدد الأحزاب يوميًا</Text>

                <TextInput
                    value={hizb}
                    onChangeText={(t) => {
                        setHizb(t);
                        setError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="مثال: 2"
                    placeholderTextColor="#B08963"
                    style={styles.input}
                    textAlign="center"
                />

                {!!error && <Text style={styles.error}>{error}</Text>}

                <Pressable
                    onPress={save}
                    style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
                >
                    <Text style={styles.btnText}>حفظ</Text>
                </Pressable>

                <Pressable
                    onPress={resetProgress}
                    style={({ pressed }) => [styles.btnGhost, pressed && styles.btnGhostPressed]}
                >
                    <Text style={styles.btnGhostText}>إعادة ضبط التقدم</Text>
                </Pressable>
                <Pressable
                    onPress={() => router.push("/about")}
                    style={({ pressed }) => [
                        styles.btnGhost,
                        pressed && styles.btnGhostPressed,
                    ]}
                >
                    <Text style={styles.btnGhostText}>من نحن</Text>
                </Pressable>
                <Pressable
                    onPress={() => router.push("/terms")}
                    style={({ pressed }) => [
                        styles.btnGhost,
                        pressed && styles.btnGhostPressed,
                    ]}
                >
                    <Text style={styles.btnGhostText}>شروط الاستخدام</Text>
                </Pressable>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#EDE1CF",
        padding: 20,
        justifyContent: "center",
    },
    card: {
        backgroundColor: "#F6EBDD",
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E2CBB6",
    },
    title: {
        fontSize: 24,
        fontWeight: "900",
        color: "#9F5921",
        textAlign: "right",
        marginBottom: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: "900",
        color: "#9F5921",
        textAlign: "right",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#E2CBB6",
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        paddingVertical: 12,
        fontSize: 20,
        fontWeight: "900",
        color: "#9F5921",
    },
    error: {
        marginTop: 8,
        color: "#B91C1C",
        fontSize: 13,
        textAlign: "right",
        fontWeight: "800",
    },
    btn: {
        marginTop: 16,
        backgroundColor: "#D5A076",
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: "center",
    },
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
});
