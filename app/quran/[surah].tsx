import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { getMushafMeta, getSurah } from "../../services/quranpedia";

type Ayah = { id: number; number: number; text: string; };
type Surah = { id: number; name: string; ayahs: Ayah[] };

export default function SurahScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const surahId = Number(params.surah);

  const [loading, setLoading] = useState(true);
  const [bismillah, setBismillah] = useState<string | null>(null);
  const [surah, setSurah] = useState<Surah | null>(null);
  const [surahList, setSurahList] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const meta = await getMushafMeta();
      setBismillah(meta.bismillah || null);
      setSurahList(meta.surahs || []);

      const s = await getSurah(surahId);
      setSurah({
        id: Number(s.id),
        name: String(s.name || `سورة ${surahId}`),
        ayahs: (s.ayahs || []) as Ayah[],
      });

      setLoading(false);
    })();
  }, [surahId]);

  const nav = useMemo(() => {
    if (!surahList.length) return { prev: null as any, next: null as any, index: -1 };
    const index = surahList.findIndex((x) => x.id === surahId);
    const prev = index > 0 ? surahList[index - 1] : null;
    const next = index >= 0 && index < surahList.length - 1 ? surahList[index + 1] : null;
    return { prev, next, index };
  }, [surahList, surahId]);

  const continuousText = useMemo(() => {
    if (!surah?.ayahs?.length) return "";

    // نص متصل: آية + علامة + رقم الآية
    // يمكن حذف رقم الآية إذا لا تريده
    return surah.ayahs
      .map((a) => `${a.text} (${a.number})`)
      .join("  ");
  }, [surah]);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.9 }]}>
          <Text style={styles.iconTxt}>↩</Text>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{surah?.name || `سورة ${surahId}`}</Text>
          <Text style={styles.sub}>
            {nav.index >= 0 ? `${nav.index + 1} / ${surahList.length}` : ""}
          </Text>
        </View>

        <Pressable
          onPress={() => nav.prev && router.replace(`/quran/${nav.prev.id}`)}
          disabled={!nav.prev}
          style={({ pressed }) => [
            styles.navBtn,
            !nav.prev && styles.navBtnDisabled,
            pressed && nav.prev && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.navTxt}>السابق</Text>
        </Pressable>

        <Pressable
          onPress={() => nav.next && router.replace(`/quran/${nav.next.id}`)}
          disabled={!nav.next}
          style={({ pressed }) => [
            styles.navBtn,
            !nav.next && styles.navBtnDisabled,
            pressed && nav.next && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.navTxt}>التالي</Text>
        </Pressable>
      </View>

      {loading ? (
        <Text style={styles.loading}>...</Text>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {!!bismillah && surahId !== 9 && (
            <View style={styles.bismillahCard}>
              <Text style={styles.bismillah}>{bismillah}</Text>
            </View>
          )}

          <View style={styles.textCard}>
            <Text style={styles.quranText}>{continuousText}</Text>
          </View>
        </ScrollView>
      )}
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
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F6EBDD",
    borderWidth: 1,
    borderColor: "#E2CBB6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconTxt: { color: "#9F5921", fontWeight: "900", fontSize: 18 },

  title: { fontSize: 20, fontWeight: "900", color: "#9F5921", textAlign: "right" },
  sub: { marginTop: 4, fontSize: 12, fontWeight: "800", color: "#7A4318", textAlign: "right" },

  navBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#F6EBDD",
    borderWidth: 1,
    borderColor: "#D5A076",
  },
  navBtnDisabled: { opacity: 0.5 },
  navTxt: { color: "#9F5921", fontWeight: "900", fontSize: 12 },

  loading: { color: "#9F5921", fontWeight: "900", textAlign: "center", marginTop: 40 },

  bismillahCard: {
    backgroundColor: "#F6EBDD",
    borderWidth: 1,
    borderColor: "#E2CBB6",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  bismillah: {
    color: "#9F5921",
    fontWeight: "900",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 28,
  },

  textCard: {
    backgroundColor: "#F6EBDD",
    borderWidth: 1,
    borderColor: "#E2CBB6",
    borderRadius: 18,
    padding: 16,
  },
  quranText: {
    color: "#9F5921",
    fontWeight: "900",
    fontSize: 20,
    textAlign: "right",
    lineHeight: 38,
    writingDirection: "rtl",
  },
});
