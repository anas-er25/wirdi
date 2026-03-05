import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

type Zikr = { id: string; text: string; count: number; hint?: string };
type Mode = "morning" | "evening" | "afterPrayer" | "sleep" | "travel" | "prayersForTheMessengerOfGod" | "istighfar";

const MORNING: Zikr[] = [
  { id: "m1", text: "أَصْبَحْنَا وَأَصْبَحَ المُلْكُ لِلَّهِ", count: 1 },
  { id: "m2", text: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا", count: 1 },
  { id: "m3", text: "رَضِيتُ بِاللَّهِ رَبًّا وَبِالإِسْلاَمِ دِينًا وَبِمُحَمَّدٍ صلى الله عليه وسلم نَبِيًّا", count: 3 },
  { id: "m4", text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُنْيَا وَالآخِرَةِ", count: 1 },
  { id: "m5", text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", count: 100, hint: "١٠٠ مرة" },
];

const EVENING: Zikr[] = [
  { id: "e1", text: "أَمْسَيْنَا وَأَمْسَى المُلْكُ لِلَّهِ", count: 1 },
  { id: "e2", text: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا", count: 1 },
  { id: "e3", text: "رَضِيتُ بِاللَّهِ رَبًّا وَبِالإِسْلاَمِ دِينًا وَبِمُحَمَّدٍ صلى الله عليه وسلم نَبِيًّا", count: 3 },
  { id: "e4", text: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", count: 3 },
  { id: "e5", text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", count: 100, hint: "١٠٠ مرة" },
];

const AFTER_PRAYER: Zikr[] = [
  { id: "ap1", text: "أَسْتَغْفِرُ اللَّهَ", count: 3, hint: "٣ مرات" },
  { id: "ap2", text: "اللَّهُمَّ أَنْتَ السَّلاَمُ وَمِنْكَ السَّلاَمُ تَبَارَكْتَ يَا ذَا الجَلاَلِ وَالإِكْرَامِ", count: 1 },
  { id: "ap3", text: "لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", count: 1 },
  { id: "ap4", text: "سُبْحَانَ اللَّهِ", count: 33, hint: "٣٣ مرة" },
  { id: "ap5", text: "الْحَمْدُ لِلَّهِ", count: 33, hint: "٣٣ مرة" },
  { id: "ap6", text: "اللَّهُ أَكْبَرُ", count: 34, hint: "٣٤ مرة" },
];

const SLEEP: Zikr[] = [
  { id: "sl1", text: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", count: 1 },
  { id: "sl2", text: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ", count: 3, hint: "٣ مرات" },
  { id: "sl3", text: "سُبْحَانَ اللَّهِ", count: 33, hint: "٣٣ مرة" },
  { id: "sl4", text: "الْحَمْدُ لِلَّهِ", count: 33, hint: "٣٣ مرة" },
  { id: "sl5", text: "اللَّهُ أَكْبَرُ", count: 34, hint: "٣٤ مرة" },
];

const TRAVEL: Zikr[] = [
  { id: "tr1", text: "اللَّهُ أَكْبَرُ ، اللَّهُ أَكْبَرُ ، اللَّهُ أَكْبَرُ", count: 1 },
  { id: "tr2", text: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ", count: 1 },
  { id: "tr3", text: "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى", count: 1 },
  { id: "tr4", text: "اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ وَالخَلِيفَةُ فِي الأَهْلِ", count: 1 },
];

const PrayersfortheMessengerofGod: Zikr[] = [
  { id: "tr1", text: "اللهم صل على محمد وعلى آل محمد، كما صليت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد، اللهم بارك على محمد وعلى آل محمد كما باركت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد", count: 100, hint: "١٠٠ مرة" },
  { id: "tr2", text: "اللهم صل على محمد وعلى أزواجه وذريته كما صليت على آل إبراهيم، وبارك على محمد وعلى أزواجه وذريته كما باركت على آل إبراهيم، إنك حميد مجيد", count: 100, hint: "١٠٠ مرة" },
  { id: "tr3", text: "اللهم صل على محمد عبدك ورسولك كما صليت على إبراهيم ، وبارك على محمد وعلى آل محمد كما باركت على إبراهيم وعلى آل إبراهيم", count: 100, hint: "١٠٠ مرة" },
];

const ISTIGHFAR: Zikr[] = [
  { id: "tr1", text: "اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي، وأبوء بذنبي فاغفر لي؛ فإنه لا يغفر الذنوب إلا أنت", count: 100, hint: "١٠٠ مرة" },
  { id: "tr2", text: "اللهم اغفر لي ما قدمت، وما أخرت، وما أسررت وما أعلنت، وما أسرفت وما أنت أعلم به مني،، أنت المقدم وأنت المؤخر لا إله إلا أنت", count: 100, hint: "١٠٠ مرة" },
  { id: "tr3", text: "اللهم اغفر لي خطيئتي وجهلي، وإسرافي في أمري، وما أنت أعلم به مني، اللهم اغفر لي جدي وهزلي، وخطئي وعمدي وكل ذلك عندي، اللهم اغفر لي ما قدمت وما أخرت وما أسررت وما أعلنت وما أنت أعلم به مني، أنت المقدم، وأنت المؤخر، وأنت على كل شيء قدير", count: 100, hint: "١٠٠ مرة" },
];

const ALL_LISTS: Record<Mode, Zikr[]> = {
  morning: MORNING,
  evening: EVENING,
  afterPrayer: AFTER_PRAYER,
  sleep: SLEEP,
  travel: TRAVEL,
  prayersForTheMessengerOfGod: PrayersfortheMessengerofGod,
  istighfar: ISTIGHFAR,
};

const MODE_LABELS: Record<Mode, string> = {
  morning: "الصباح",
  evening: "المساء",
  afterPrayer: "بعد الصلاة",
  sleep: "النوم",
  travel: "السفر",
  prayersForTheMessengerOfGod: "الصلاة على رسول الله",
  istighfar: "الاستغفار",
};

const MODES: Mode[] = ["morning", "evening", "afterPrayer", "sleep", "travel", "prayersForTheMessengerOfGod", "istighfar"];

const STORAGE_KEY = "adhkarCounters_v3";
const DATE_KEY = "adhkar_last_reset_date_v1";

function dateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultModeByTime(): Mode {
  const h = new Date().getHours();
  return h >= 16 || h < 4 ? "evening" : "morning";
}

function k(mode: Mode, zikrId: string) {
  return `${mode}:${zikrId}`;
}

export default function Adhkar() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>(defaultModeByTime());
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
    const list = ALL_LISTS[mode];
    if (idx >= list.length) setIdx(0);
  }, [mode, idx]);

  const list = ALL_LISTS[mode];
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
    await persist({ ...counters, [key]: 0 });
  };

  const incrementAndAdvance = async () => {
    if (!current) return;
    const key = k(mode, current.id);
    const cur = counters[key] ?? 0;
    const nextVal = Math.min(cur + 1, current.count);
    const isComplete = nextVal >= current.count && cur < current.count;

    // Haptic feedback
    if (isComplete) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const nextCounters = { ...counters, [key]: nextVal };
    await persist(nextCounters);

    // Auto-advance after completing a zikr
    if (isComplete && idx < list.length - 1) {
      setTimeout(() => setIdx((p) => p + 1), 250);
    }
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
      if ((counters[k(mode, item.id)] ?? 0) >= item.count) c++;
    }
    return c;
  }, [counters, list, mode]);

  const percent = useMemo(
    () => (list.length === 0 ? 0 : Math.round((completedCount / list.length) * 100)),
    [completedCount, list.length]
  );

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
            {MODE_LABELS[mode]} • {percent}%
          </Text>
        </View>
      </View>

      {/* Category horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
        style={{ flexGrow: 0 }}
      >
        {MODES.map((m) => (
          <Pressable
            key={m}
            onPress={() => { setMode(m); setIdx(0); }}
            style={({ pressed }) => [
              styles.categoryBtn,
              mode === m && styles.categoryBtnActive,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.categoryText, mode === m && styles.categoryTextActive]}>
              {MODE_LABELS[m]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Full-screen tappable card */}
      <Pressable
        onPress={incrementAndAdvance}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        accessible
        accessibilityRole="button"
        accessibilityLabel="اضغط للتسبيح"
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.stepText}>{idx + 1} / {list.length}</Text>
          <Text style={styles.badge}>{done ? "✓ تم" : "جاري"}</Text>
        </View>

        <Text style={styles.zikr} numberOfLines={7}>
          {current?.text ?? ""}
        </Text>

        {current?.hint && (
          <Text style={styles.hintText}>{current.hint}</Text>
        )}

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

        <Text style={styles.tapHint}>اضغط في أي مكان للتسبيح</Text>
      </Pressable>

      {/* Controls */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={resetCurrent}
          style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.ghostBtnText}>تصفير</Text>
        </Pressable>

        <View style={styles.navBtns}>
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

        <Pressable
          onPress={resetGroup}
          style={({ pressed }) => [styles.resetGroupBtn, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.resetGroupText}>إعادة</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#EDE1CF", padding: 20, paddingTop: 26, marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, },

  header: { flexDirection: "row-reverse", alignItems: "center", gap: 10, marginBottom: 12 },
  headerBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "#F6EBDD", borderWidth: 1, borderColor: "#E2CBB6",
    alignItems: "center", justifyContent: "center",
  },
  headerBtnText: { color: "#9F5921", fontWeight: "900", fontSize: 18 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#9F5921", textAlign: "right" },
  headerSub: { marginTop: 4, fontSize: 12, fontWeight: "800", color: "#7A4318", textAlign: "right" },

  categoryRow: {
    flexDirection: "row-reverse",
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 4,
    marginBottom: 12,
  },
  categoryBtn: {
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F6EBDD",
    borderWidth: 1, borderColor: "#E2CBB6",
  },
  categoryBtnActive: { backgroundColor: "#D5A076", borderColor: "#C48B61" },
  categoryText: { color: "#9F5921", fontWeight: "800", fontSize: 13 },
  categoryTextActive: { color: "#5C3A1E" },

  card: {
    flex: 1,
    backgroundColor: "#F6EBDD",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2CBB6",
    marginBottom: 12,
  },
  cardPressed: { backgroundColor: "#EDD9C0" },

  cardTopRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  stepText: { color: "#7A4318", fontWeight: "900", fontSize: 12 },
  badge: {
    color: "#9F5921", fontWeight: "900", fontSize: 12,
    backgroundColor: "#EDE1CF",
    paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: 999, overflow: "hidden",
  },

  zikr: {
    fontSize: 20, fontWeight: "900", color: "#9F5921",
    textAlign: "right", lineHeight: 34, marginTop: 6, flex: 1,
  },

  hintText: {
    marginTop: 6, color: "#B89A7A", fontWeight: "800",
    fontSize: 12, textAlign: "right",
  },

  progressRow: { marginTop: 16 },
  counter: { color: "#7A4318", fontWeight: "900", textAlign: "right", fontSize: 13, marginBottom: 8 },
  barTrack: {
    height: 12, borderRadius: 999,
    backgroundColor: "#EDE1CF", overflow: "hidden",
    borderWidth: 1, borderColor: "#E2CBB6",
  },
  barFill: { height: "100%", borderRadius: 999, backgroundColor: "#D5A076" },

  tapHint: {
    marginTop: 14, color: "#B89A7A", fontWeight: "700",
    fontSize: 12, textAlign: "center",
  },

  actionsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingBottom: 6,
  },
  ghostBtn: {
    backgroundColor: "#F6EBDD", borderWidth: 1, borderColor: "#D5A076",
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 16,
  },
  ghostBtnText: { color: "#9F5921", fontWeight: "900" },

  navBtns: { flex: 1, flexDirection: "row-reverse", gap: 8 },
  navBtn: {
    flex: 1,
    backgroundColor: "#EDE1CF", borderWidth: 1, borderColor: "#E2CBB6",
    paddingVertical: 12, borderRadius: 16, alignItems: "center",
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { color: "#9F5921", fontWeight: "900" },

  resetGroupBtn: {
    backgroundColor: "#F6EBDD", borderWidth: 1, borderColor: "#D5A076",
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 16,
  },
  resetGroupText: { color: "#9F5921", fontWeight: "900", fontSize: 12 },
});
