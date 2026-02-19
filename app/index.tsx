import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function Home() {
  const router = useRouter();
  const [hizb, setHizb] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const value = await AsyncStorage.getItem("dailyHizb");
      if (value) router.replace("/today");
    })();
  }, [router]);

  const parsed = useMemo(() => {
    const n = Number(hizb.replace(/[^\d]/g, ""));
    if (!Number.isFinite(n)) return NaN;
    return n;
  }, [hizb]);

  const save = async () => {
    setError(null);

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 60) {
      setError("أدخل رقمًا بين 1 و 60");
      return;
    }

    await AsyncStorage.multiSet([
      ["dailyHizb", String(parsed)],
      ["progressDays", "0"],
      ["lastCompletedDate", ""],
    ]);

    router.replace("/today");
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle={Platform.OS === "ios" ? "dark-content" : "default"} />
      <View style={styles.card}>
        <View style={styles.brandRow}>
          <View style={styles.logoDot} />
          <Text style={styles.brand}>وردي</Text>
        </View>

        <Text style={styles.h1}>وردك اليومي في رمضان</Text>
        <Text style={styles.p}>
          اختر عدد الأحزاب التي تريد قراءتها يوميًا، وسنرتّب لك ورد اليوم.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>عدد الأحزاب يوميًا</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={hizb}
              onChangeText={(t) => {
                setHizb(t);
                setError(null);
              }}
              placeholder="مثال: 2"
              placeholderTextColor="#9AA4B2"
              keyboardType="number-pad"
              style={[styles.input, { writingDirection: "rtl", textAlign: "right" }]}
              textAlign="center"
              maxLength={2}
            />
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>

        <Pressable onPress={save} style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
          <Text style={styles.btnText}>حفظ والمتابعة</Text>
        </Pressable>

        <Text style={styles.footnote}>يمكنك التعديل لاحقًا من الإعدادات.</Text>
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
    padding: 22,
    borderWidth: 1,
    borderColor: "#E2CBB6",
  },
  brandRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  logoDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#D5A076",
  },
  brand: {
    fontSize: 20,
    fontWeight: "800",
    color: "#9F5921",
  },
  h1: {
    fontSize: 24,
    fontWeight: "900",
    color: "#9F5921",
    textAlign: "right",
    marginTop: 8,
  },
  p: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: "#7A4318",
    textAlign: "right",
  },
  field: {
    marginTop: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#9F5921",
    textAlign: "right",
    marginBottom: 8,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: "#E2CBB6",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 10,
  },
  input: {
    fontSize: 20,
    fontWeight: "800",
    color: "#9F5921",
    paddingVertical: 6,
  },
  error: {
    marginTop: 8,
    color: "#B91C1C",
    fontSize: 13,
    textAlign: "right",
    fontWeight: "700",
  },
  btn: {
    marginTop: 20,
    backgroundColor: "#D5A076",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },
  btnPressed: {
    backgroundColor: "#C48B61",
  },
  btnText: {
    color: "#9F5921",
    fontSize: 16,
    fontWeight: "900",
  },
  footnote: {
    marginTop: 14,
    fontSize: 12,
    color: "#7A4318",
    textAlign: "right",
  },
});

