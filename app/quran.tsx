import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { clearQuranCache, getMushafMeta } from "../services/quranpedia";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Quran() {
  const router = useRouter();
  const [surahs, setSurahs] = useState<{ id: number; name: string }[]>([]);
  const [title, setTitle] = useState("المصحف");
  const [loading, setLoading] = useState(true);
//   useEffect(() => { clearQuranCache(); }, []);


  useEffect(() => {
  (async () => {
    // Clear ancien cache une seule fois (migration)
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


  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>↩</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>

      {loading ? (
        <Text style={styles.loading}>...</Text>
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
  screen: { flex: 1, backgroundColor: "#EDE1CF", padding: 20, paddingTop: 26 },
  header: { flexDirection: "row-reverse", alignItems: "center", gap: 12, marginBottom: 16 },
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
});
