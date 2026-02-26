// ─── Prayer Times (Adhan) ───────────────────────────────────────────

export interface PrayerTimings {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    Imsak: string;
    Midnight: string;
}

export interface HijriDate {
    date: string;
    day: string;
    weekday: { en: string; ar: string };
    month: { number: number; en: string; ar: string; days: number };
    year: string;
}

export interface GregorianDate {
    date: string;
    day: string;
    weekday: { en: string };
    month: { number: number; en: string };
    year: string;
}

export interface PrayerTimesData {
    timings: PrayerTimings;
    date: {
        readable: string;
        hijri: HijriDate;
        gregorian: GregorianDate;
    };
}

// ─── Hadith ─────────────────────────────────────────────────────────

export interface HadithItem {
    hadithnumber: number;
    arabicnumber: number;
    text: string;
    grades: unknown[];
    reference: {
        book: number;
        hadith: number;
    };
}

export interface HadithSection {
    id: number;
    name: string;
    hadithCount: number;
}

export interface HadithMetadata {
    name: string;
    sections: Record<string, string>;
    section_details: Record<
        string,
        {
            hadithnumber_first: number;
            hadithnumber_last: number;
        }
    >;
}

export interface HadithData {
    metadata: HadithMetadata;
    hadiths: HadithItem[];
}
