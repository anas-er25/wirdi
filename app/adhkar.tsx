import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Zikr = { id: string; text: string; count: number; hint?: string };

const MORNING: Zikr[] = [
  { id: "m1", text: "أَصْبَحْنَا وَأَصْبَحَ المُلْكُ لِلَّهِ", count: 1 },
  { id: "m2", text: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا", count: 1 },
  { id: "m3", text: "رَضِيتُ بِاللَّهِ رَبًّا وَبِالإِسْلاَمِ دِينًا وَبِمُحَمَّدٍ ﷺ نَبِيًّا", count: 3 },
  { id: "m4", text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ العَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ", count: 1 },
  { id: "m5", text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", count: 100 },
];

const EVENING: Zikr[] = [
  { id: "e1", text: "أَمْسَيْنَا وَأَمْسَى المُلْكُ لِلَّهِ", count: 1 },
  { id: "e2", text: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا", count: 1 },
  { id: "e3", text: "رَضِيتُ بِاللَّهِ رَبًّا وَبِالإِسْلاَمِ دِينًا وَبِمُحَمَّدٍ ﷺ نَبِيًّا", count: 3 },
  { id: "e4", text: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", count: 3 },
  { id: "e5", text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", count: 100 },
];

const STORAGE_KEY = "adhkarCounters_v2";
const DATE_KEY = "adhkar_last_reset_date_v1";

function dateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function defaultModeByTime(): "morning" | "evening" {
  const h = new Date().getHours();
  // morning: 04:00–15:59, evening: 16:00–03:59
  return h >= 16 || h < 4 ? "evening" : "morning";
}

function k(mode: "morning" | "evening", zikrId: string) {
  return `${mode}:${zikrId}`;
}

export default function Adhkar() {
  const router = useRouter();

  const lists = useMemo(() => ({ morning: MORNING, evening: EVENING }), []);
  const [mode, setMode] = useState<"morning" | "evening">(defaultModeByTime());
  const [idx, setIdx] = useState(0);

  const [counters, setCounters] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  // Daily auto-reset
  useEffect(() => {
    (async () => {
      const today = dateKey();
      const last = await AsyncStorage.getItem(DATE_KEY);

      if (last !== today) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({}));
        await AsyncStorage.setItem(DATE_KEY, today);
        setCounters({});
      } else {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Record<string, number>;
            setCounters(parsed && typeof parsed === "object" ? parsed : {});
          } catch {
            setCounters({});
          }
        }
      }
      setLoaded(true);
    })();
  }, []);

  // Keep index in range when switching mode
  useEffect(() => {
    const list = lists[mode];
    if (idx >= list.length) setIdx(0);
  }, [mode, idx, lists]);

  const list = lists[mode];
  const current = list[idx];

  const value = current ? counters[k(mode, current.id)] ?? 0 : 0;
  const total = current ? current.count : 1;
  const done = current ? value >= total : false;

  const persist = async (next: Record<string, number>) => {
    setCounters(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const goNext = () => setIdx((p) => Math.min(p + 1, list.length - 1));
  const goPrev = () => setIdx((p) => Math.max(p - 1, 0));

  const resetCurrent = async () => {
    if (!current) return;
    const key = k(mode, current.id);
    const next = { ...counters, [key]: 0 };
    await persist(next);
  };

  const incrementAndAdvance = async () => {
    if (!current) return;

    const key = k(mode, current.id);
    const cur = counters[key] ?? 0;
    const nextVal = Math.min(cur + 1, current.count);

    const nextCounters = { ...counters, [key]: nextVal };
    await persist(nextCounters);

    // UX: auto-advance immediately on every click
    if (idx < list.length - 1) setIdx(idx + 1);
  };

  const resetGroup = async () => {
    const next = { ...counters };
    for (const item of list) next[k(mode, item.id)] = 0;
    await persist(next);
    setIdx(0);
  };

  const completedCount = useMemo(() => {
    let c = 0;
    for (const item of list) {
      const v = counters[k(mode, item.id)] ?? 0;
      if (v >= item.count) c++;
    }
    return c;
  }, [counters, list, mode]);

  const percent = useMemo(() => {
    if (list.length === 0) return 0;
    return Math.round((completedCount / list.length) * 100);
  }, [completedCount, list.length]);

  if (!loaded) {
    return (
      <View style={[styles.screen, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: "#9F5921", fontWeight: "900" }}>...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push("/today")}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.headerBtnText}>↩</Text>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>الأذكار</Text>
          <Text style={styles.headerSub}>
            {mode === "morning" ? "أذكار الصباح" : "أذكار المساء"} • {percent}%
          </Text>
        </View>
      </View>

      {/* Mode switch */}
      <View style={styles.segment}>
        <Pressable
          onPress={() => {
            setMode("evening");
            setIdx(0);
          }}
          style={({ pressed }) => [
            styles.segmentBtn,
            mode === "evening" && styles.segmentBtnActive,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={[styles.segmentText, mode === "evening" && styles.segmentTextActive]}>
            المساء
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setMode("morning");
            setIdx(0);
          }}
          style={({ pressed }) => [
            styles.segmentBtn,
            mode === "morning" && styles.segmentBtnActive,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={[styles.segmentText, mode === "morning" && styles.segmentTextActive]}>
            الصباح
          </Text>
        </Pressable>
      </View>

      {/* Focus card */}
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <Text style={styles.stepText}>
            {idx + 1} / {list.length}
          </Text>
          <Text style={styles.badge}>{done ? "تم" : "جاري"}</Text>
        </View>

        <Text style={styles.zikr} numberOfLines={6}>
          {current?.text ?? ""}
        </Text>

        <View style={styles.progressRow}>
          <Text style={styles.counter}>
            {Math.min(value, total)} / {total}
          </Text>

          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${Math.round((Math.min(value, total) / total) * 100)}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={resetCurrent}
            style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.ghostBtnText}>تصفير</Text>
          </Pressable>

          <Pressable
            onPress={incrementAndAdvance}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          >
            <Text style={styles.primaryBtnText}>+ تسبيح</Text>
          </Pressable>
        </View>

        {/* Navigation */}
        <View style={styles.navRow}>
          <Pressable
            onPress={goPrev}
            disabled={idx === 0}
            style={({ pressed }) => [
              styles.navBtn,
              idx === 0 && styles.navBtnDisabled,
              pressed && idx !== 0 && { opacity: 0.9 },
            ]}
          >
            <Text style={styles.navBtnText}>السابق</Text>
          </Pressable>

          <Pressable
            onPress={resetGroup}
            style={({ pressed }) => [styles.resetGroupBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.resetGroupText}>إعادة المجموعة</Text>
          </Pressable>

          <Pressable
            onPress={goNext}
            disabled={idx === list.length - 1}
            style={({ pressed }) => [
              styles.navBtn,
              idx === list.length - 1 && styles.navBtnDisabled,
              pressed && idx !== list.length - 1 && { opacity: 0.9 },
            ]}
          >
            <Text style={styles.navBtnText}>التالي</Text>
          </Pressable>
        </View>

        <Text style={styles.hint}>
          عند الضغط على “+ تسبيح” ينتقل تلقائيًا للذكر التالي. للرجوع استخدم “السابق”.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#EDE1CF", padding: 20, paddingTop: 26 },

  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F6EBDD",
    borderWidth: 1,
    borderColor: "#E2CBB6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnText: { color: "#9F5921", fontWeight: "900", fontSize: 18 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#9F5921", textAlign: "right" },
  headerSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: "#7A4318",
    textAlign: "right",
  },

  segment: {
    flexDirection: "row-reverse",
    backgroundColor: "#F6EBDD",
    borderWidth: 1,
    borderColor: "#E2CBB6",
    borderRadius: 16,
    padding: 6,
    gap: 8,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  segmentBtnActive: { backgroundColor: "#D5A076" },
  segmentText: { color: "#9F5921", fontWeight: "900" },
  segmentTextActive: { color: "#9F5921" },

  card: {
    flex: 1,
    backgroundColor: "#F6EBDD",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2CBB6",
  },

  cardTopRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  stepText: { color: "#7A4318", fontWeight: "900", fontSize: 12 },
  badge: {
    color: "#9F5921",
    fontWeight: "900",
    fontSize: 12,
    backgroundColor: "#EDE1CF",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    overflow: "hidden",
  },

  zikr: {
    fontSize: 20,
    fontWeight: "900",
    color: "#9F5921",
    textAlign: "right",
    lineHeight: 32,
    marginTop: 6,
  },

  progressRow: { marginTop: 16 },
  counter: { color: "#7A4318", fontWeight: "900", textAlign: "right", fontSize: 13, marginBottom: 8 },
  barTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "#EDE1CF",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2CBB6",
  },
  barFill: { height: "100%", borderRadius: 999, backgroundColor: "#D5A076" },

  actionsRow: { flexDirection: "row-reverse", gap: 10, marginTop: 16 },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#D5A076",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryBtnPressed: { backgroundColor: "#C48B61" },
  primaryBtnText: { color: "#9F5921", fontWeight: "900", fontSize: 16 },
  ghostBtn: {
    width: 90,
    backgroundColor: "#F6EBDD",
    borderWidth: 1,
    borderColor: "#D5A076",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  ghostBtnText: { color: "#9F5921", fontWeight: "900" },

  navRow: { flexDirection: "row-reverse", gap: 10, marginTop: 14, alignItems: "center" },
  navBtn: {
    flex: 1,
    backgroundColor: "#EDE1CF",
    borderWidth: 1,
    borderColor: "#E2CBB6",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  navBtnDisabled: { opacity: 0.5 },
  navBtnText: { color: "#9F5921", fontWeight: "900" },

  resetGroupBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#F6EBDD",
    borderWidth: 1,
    borderColor: "#D5A076",
  },
  resetGroupText: { color: "#9F5921", fontWeight: "900", fontSize: 12 },

  hint: {
    marginTop: 12,
    color: "#7A4318",
    fontWeight: "800",
    fontSize: 12,
    textAlign: "right",
    lineHeight: 18,
  },
});
