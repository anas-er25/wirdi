import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PrayerTimesData, PrayerTimings } from "../constants/types";

const CACHE_PREFIX = "adhan_cache_";
const ADDRESS = "Ouarzazate,MA";
const METHOD = 8;

/**
 * Format date as DD-MM-YYYY for the API.
 */
function formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

/**
 * Cache key for a given date string.
 */
function cacheKey(dateStr: string): string {
    return `${CACHE_PREFIX}${dateStr}`;
}

/**
 * Fetch prayer times for the given date (defaults to today).
 * Results are cached per date in AsyncStorage.
 */
export async function getPrayerTimes(
    date?: Date
): Promise<PrayerTimesData | null> {
    const d = date ?? new Date();
    const dateStr = formatDate(d);
    const key = cacheKey(dateStr);

    // Try cache first
    try {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
            return JSON.parse(cached) as PrayerTimesData;
        }
    } catch {
        // cache miss — proceed to fetch
    }

    // Fetch from API
    try {
        const url = `https://api.aladhan.com/v1/timingsByAddress/${dateStr}?address=${encodeURIComponent(
            ADDRESS
        )}&method=${METHOD}`;

        const res = await fetch(url);
        if (!res.ok) return null;

        const json = await res.json();
        if (json?.code !== 200 || !json?.data) return null;

        const data: PrayerTimesData = {
            timings: json.data.timings,
            date: {
                readable: json.data.date.readable,
                hijri: json.data.date.hijri,
                gregorian: json.data.date.gregorian,
            },
        };

        // Cache the result
        await AsyncStorage.setItem(key, JSON.stringify(data));
        return data;
    } catch {
        return null;
    }
}

/**
 * The 5 main prayer names in order with Arabic labels.
 */
export const PRAYER_NAMES: { key: keyof PrayerTimings; ar: string }[] = [
    { key: "Fajr", ar: "الفجر" },
    { key: "Dhuhr", ar: "الظهر" },
    { key: "Asr", ar: "العصر" },
    { key: "Maghrib", ar: "المغرب" },
    { key: "Isha", ar: "العشاء" },
];

/**
 * Get the next upcoming prayer based on current time.
 */
export function getNextPrayer(
    timings: PrayerTimings
): { key: keyof PrayerTimings; ar: string; time: string } | null {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (const prayer of PRAYER_NAMES) {
        const timeStr = timings[prayer.key];
        if (!timeStr) continue;
        const [h, m] = timeStr.split(":").map(Number);
        const prayerMinutes = h * 60 + m;

        if (prayerMinutes > nowMinutes) {
            return { ...prayer, time: timeStr };
        }
    }

    // All prayers passed — next is Fajr (tomorrow)
    return { ...PRAYER_NAMES[0], time: timings.Fajr };
}
