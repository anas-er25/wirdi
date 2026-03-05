import * as FileSystem from "expo-file-system/legacy";
import * as Location from "expo-location";
import type { PrayerTimesData, PrayerTimings } from "../constants/types";

const METHOD = 8;

// Fallback location — Ouarzazate, Morocco
const DEFAULT_LAT = 30.9189;
const DEFAULT_LNG = -6.8931;

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function monthCacheFilename(year: number, month: number, lat: number, lng: number): string {
    return `adhan_${year}_${String(month + 1).padStart(2, "0")}_${lat.toFixed(3)}_${lng.toFixed(3)}.json`;
}

// ─── Geolocation ──────────────────────────────────────────────────────────────

export type LocationResult = { lat: number; lng: number; isDefault: boolean };
let _coords: LocationResult | null = null;

/**
 * Request foreground location permission and cache the coordinates.
 * Falls back to Ouarzazate if permission denied or error.
 */
export async function requestAndCacheLocation(): Promise<LocationResult> {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            _coords = { lat: DEFAULT_LAT, lng: DEFAULT_LNG, isDefault: true };
        } else {
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            _coords = {
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
                isDefault: false,
            };
        }
    } catch {
        _coords = { lat: DEFAULT_LAT, lng: DEFAULT_LNG, isDefault: true };
    }
    return _coords;
}

export function getLocationStatus(): "default" | "custom" {
    if (!_coords || _coords.isDefault) return "default";
    return "custom";
}

// ─── Monthly calendar cache (FileSystem) ─────────────────────────────────────

type MonthlyCalendar = Record<string, PrayerTimesData>; // key = "DD-MM-YYYY"

async function readMonthlyCache(filepath: string): Promise<MonthlyCalendar | null> {
    try {
        const info = await FileSystem.getInfoAsync(filepath);
        if (!info.exists) return null;
        const raw = await FileSystem.readAsStringAsync(filepath);
        return JSON.parse(raw) as MonthlyCalendar;
    } catch {
        return null;
    }
}

async function fetchMonthlyCalendar(
    year: number,
    month: number, // 0-indexed
    lat: number,
    lng: number
): Promise<MonthlyCalendar | null> {
    try {
        const apiMonth = month + 1;
        const url = `https://api.aladhan.com/v1/calendar/${year}/${apiMonth}?latitude=${lat}&longitude=${lng}&method=${METHOD}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const json = await res.json();
        if (json?.code !== 200 || !Array.isArray(json?.data)) return null;

        const calendar: MonthlyCalendar = {};
        for (const day of json.data as any[]) {
            const dateStr: string | undefined = day?.date?.gregorian?.date;
            if (!dateStr || !day.timings || !day.date) continue;
            calendar[dateStr] = {
                timings: day.timings as PrayerTimings,
                date: {
                    readable: day.date.readable as string,
                    hijri: day.date.hijri,
                    gregorian: day.date.gregorian,
                },
            };
        }
        return calendar;
    } catch {
        return null;
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get prayer times for the given date (defaults to today).
 * Fetches the full month calendar once and caches it to device storage.
 * Uses geolocation; falls back to Ouarzazate if unavailable.
 */
export async function getPrayerTimes(date?: Date): Promise<PrayerTimesData | null> {
    const d = date ?? new Date();
    const dateStr = formatDate(d);
    const year = d.getFullYear();
    const month = d.getMonth();

    const coords = _coords ?? (await requestAndCacheLocation());

    const filename = monthCacheFilename(year, month, coords.lat, coords.lng);
    const filepath = `${FileSystem.documentDirectory}${filename}`;

    let calendar = await readMonthlyCache(filepath);

    if (!calendar) {
        calendar = await fetchMonthlyCalendar(year, month, coords.lat, coords.lng);
        if (calendar) {
            try {
                await FileSystem.writeAsStringAsync(filepath, JSON.stringify(calendar));
            } catch {
                // silently ignore write failures (e.g. low storage)
            }
        }
    }

    if (!calendar) return null;
    return calendar[dateStr] ?? null;
}

// ─── Prayer names & utils ─────────────────────────────────────────────────────

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
        // Strip timezone suffix that the API appends (e.g. " (EET)")
        const clean = timeStr.split(" ")[0];
        const [h, m] = clean.split(":").map(Number);
        const prayerMinutes = h * 60 + m;
        if (prayerMinutes > nowMinutes) {
            return { ...prayer, time: clean };
        }
    }

    // All prayers passed — next is Fajr tomorrow
    const fajrClean = timings.Fajr.split(" ")[0];
    return { ...PRAYER_NAMES[0], time: fajrClean };
}

