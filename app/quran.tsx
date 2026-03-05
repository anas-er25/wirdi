import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { clearQuranCache, getMushafMeta, searchQuran, type SearchAyahResult } from "../services/quranpedia";

export default function Quran() {
  const router = useRouter();
  const [surahs, setSurahs] = useState<{ id: number; name: string }[]>([]);
  const [title, setTitle] = useState("المصحف");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchAyahResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
  (async () => {
    const cleared = await AsyncStorage.getItem("quran_cache_cleared_v1");
    if (!cleared) {
      await clearQuranCache();
      await AsyncStorage.setItem("quran_cache_cleared_v1", "1");
    }
    const meta = await getMushafMeta();
    setTitle(meta.name || "المصحف");
    setSurahs(meta.surahs || []);
    setLoading(false);
  })();
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
    searchTimer.current = setTimeout(async () => {
      const results = await searchQuran(text);
      setSearchResults(results);
      setSearching(false);
    }, 300);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>↩</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={handleSearch}
          placeholder="ابحث في القرآن..."
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
        <Text style={styles.loading}>...</Text>
      ) : query.trim() ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {searching ? (
            <Text style={styles.loading}>جاري البحث...</Text>
          ) : searchResults.length === 0 ? (
            <Text style={styles.loading}>لا نتائج</Text>
          ) : (
            searchResults.map((r, i) => (
              <Pressable
                key={`${r.surahId}-${r.ayahNumber}-${i}`}
                onPress={() => router.push(`/quran/${r.surahId}`)}
                style={({ pressed }) => [styles.resultRow, pressed && { opacity: 0.9 }]}
              >
                <View style={styles.resultMeta}>
                  <Text style={styles.resultSurah}>{r.surahName}</Text>
                  <Text style={styles.resultAyahNum}>آية {r.ayahNumber}</Text>
                </View>
                <Text style={styles.resultText} numberOfLines={3}>{r.text}</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {surahs.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => router.push(`/quran/${s.id}`)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.rowText}>{s.name}</Text>
              <Text style={styles.rowId}>{s.id}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#EDE1CF", padding: 20, paddingTop: 26, marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  header: { flexDirection: "row-reverse", alignItems: "center", gap: 12, marginBottom: 14 },
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
  title: { flex: 1, textAlign: "right", fontSize: 22, fontWeight: "900", color: "#9F5921" },
  loading: { color: "#9F5921", fontWeight: "900", textAlign: "center", marginTop: 40 },

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
  clearBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: { color: "#B89A7A", fontWeight: "900", fontSize: 14 },

  row: {
    backgroundColor: "#F6EBDD",
    borderWidth: 1,
    borderColor: "#E2CBB6",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowText: { color: "#9F5921", fontWeight: "900", fontSize: 16, textAlign: "right", flex: 1 },
  rowId: { color: "#7A4318", fontWeight: "900", marginLeft: 10 },

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
  resultSurah: { color: "#9F5921", fontWeight: "900", fontSize: 13 },
  resultAyahNum: { color: "#B89A7A", fontWeight: "700", fontSize: 12 },
  resultText: {
    color: "#5C3A1E",
    fontWeight: "700",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "right",
  },
});
