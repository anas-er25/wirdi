import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

const BASE = "https://api.quranpedia.net/v1";
const MUSHAF_ID = 4;

// File paths for large cached objects
const FULL_MUSHAF_FILE = `${FileSystem.documentDirectory}quranpedia_full_${MUSHAF_ID}.json`;
const META_FILE = `${FileSystem.documentDirectory}quranpedia_meta_${MUSHAF_ID}.json`;

type MushafLight = {
    id: number;
    name: string;
    description?: string;
    image?: string;
    bismillah?: string;
    font_file?: string;
    surahs: { id: number; name: string }[];
};

export type ApiAyah = {
    id: number;
    number: number;
    text: string;
    marker?: string;
    page_number?: number;
    juz?: number;
    hizb?: number;
};

export type ApiSurah = {
    id: number;
    name: string;
    coded_name?: string;
    ayahs: ApiAyah[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return (await res.json()) as T;
}

async function readFile<T>(path: string): Promise<T | null> {
    try {
        const info = await FileSystem.getInfoAsync(path);
        if (!info.exists) return null;
        const raw = await FileSystem.readAsStringAsync(path);
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

async function writeFile(path: string, data: unknown): Promise<void> {
    try {
        await FileSystem.writeAsStringAsync(path, JSON.stringify(data));
    } catch {
        // silently ignore write failures
    }
}

// ─── Full mushaf (used for getSurah & search) ─────────────────────────────────

let _fullMushaf: any | null = null;

async function getFullMushaf(): Promise<any> {
    if (_fullMushaf) return _fullMushaf;

    // Try file cache
    const cached = await readFile<any>(FULL_MUSHAF_FILE);
    if (cached) {
        _fullMushaf = cached;
        return _fullMushaf;
    }

    // Fetch from network
    const full = await getJson<any>(`${BASE}/mushafs/${MUSHAF_ID}`);
    _fullMushaf = full;
    await writeFile(FULL_MUSHAF_FILE, full);
    return full;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getMushafMeta(force = false): Promise<MushafLight> {
    if (!force) {
        const cached = await readFile<MushafLight>(META_FILE);
        if (cached) return cached;
    }

    const full = await getFullMushaf();

    const light: MushafLight = {
        id: full.id,
        name: full.name,
        description: full.description,
        image: full.image,
        bismillah: full.bismillah,
        font_file: full.font_file,
        surahs: Array.isArray(full.surahs)
            ? full.surahs.map((s: any) => ({ id: Number(s.id), name: String(s.name) }))
            : [],
    };

    await writeFile(META_FILE, light);
    return light;
}

export async function getSurah(surahId: number): Promise<ApiSurah> {
    const full = await getFullMushaf();
    const found = full.surahs?.find((s: any) => Number(s.id) === surahId);
    if (!found) throw new Error("Surah not found");
    return {
        id: found.id,
        name: found.name,
        coded_name: found.coded_name,
        ayahs: found.ayahs || [],
    };
}

export type SearchAyahResult = {
    surahId: number;
    surahName: string;
    ayahNumber: number;
    text: string;
};

/**
 * Search the full Quran for a text query.
 * Loads and caches the full mushaf on first call.
 */
export async function searchQuran(query: string, maxResults = 40): Promise<SearchAyahResult[]> {
    if (!query.trim()) return [];
    const full = await getFullMushaf();
    const surahs: any[] = full.surahs ?? [];
    const q = query.trim();
    const results: SearchAyahResult[] = [];

    for (const surah of surahs) {
        for (const ayah of (surah.ayahs ?? []) as any[]) {
            if (typeof ayah.text === "string" && ayah.text.includes(q)) {
                results.push({
                    surahId: Number(surah.id),
                    surahName: String(surah.name),
                    ayahNumber: Number(ayah.number ?? ayah.id),
                    text: String(ayah.text),
                });
                if (results.length >= maxResults) return results;
            }
        }
    }
    return results;
}

// ─── Cache management ─────────────────────────────────────────────────────────

export async function clearQuranCache() {
    _fullMushaf = null;
    try {
        await FileSystem.deleteAsync(FULL_MUSHAF_FILE, { idempotent: true });
        await FileSystem.deleteAsync(META_FILE, { idempotent: true });
    } catch { /* ignore */ }
    // Also clear legacy AsyncStorage keys
    try {
        const keys = await AsyncStorage.getAllKeys();
        const targets = keys.filter((x) => x.startsWith("quranpedia:"));
        if (targets.length) await AsyncStorage.multiRemove(targets);
    } catch { /* ignore */ }
}
