import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE = "https://api.quranpedia.net/v1";
const MUSHAF_ID = 4;

type MushafLight = {
    id: number;
    name: string;
    description?: string;
    image?: string;
    bismillah?: string;
    font_file?: string;
    surahs: { id: number; name: string }[];
};

type ApiAyah = {
    id: number;
    number: number;
    text: string;
    marker?: string;
    page_number?: number;
    juz?: number;
    hizb?: number;
};

type ApiSurah = {
    id: number;
    name: string;
    coded_name?: string;
    ayahs: ApiAyah[];
};

const key = (k: string) => `quranpedia:${k}`;

async function getJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return (await res.json()) as T;
}

export async function getMushafMeta(force = false): Promise<MushafLight> {
    const k = key(`mushafLight:${MUSHAF_ID}`);

    if (!force) {
        const cached = await AsyncStorage.getItem(k);
        if (cached) return JSON.parse(cached) as MushafLight;
    }

    // Fetch full, keep only light fields
    const full = await getJson<any>(`${BASE}/mushafs/${MUSHAF_ID}`);

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

    // Light object only -> safe for AsyncStorage
    await AsyncStorage.setItem(k, JSON.stringify(light));
    return light;
}

export async function getSurah(surahId: number): Promise<ApiSurah> {
    const full = await getJson<any>(`${BASE}/mushafs/${MUSHAF_ID}`);

    const found = full.surahs?.find((s: any) => Number(s.id) === surahId);

    if (!found) throw new Error("Surah not found");

    return {
        id: found.id,
        name: found.name,
        coded_name: found.coded_name,
        ayahs: found.ayahs || [],
    };
}


// Optional: clear cache if needed
export async function clearQuranCache() {
    const keys = await AsyncStorage.getAllKeys();
    const targets = keys.filter((x) => x.startsWith("quranpedia:"));
    if (targets.length) await AsyncStorage.multiRemove(targets);
}
