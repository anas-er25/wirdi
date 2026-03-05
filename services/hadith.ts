import type {
    HadithData,
    HadithItem,
    HadithSection,
} from "../constants/types";

// Lazy-loaded reference to the full JSON
let _data: HadithData | null = null;

/**
 * Load the hadith JSON lazily (only once, then cached in memory).
 */
function loadData(): HadithData {
    if (!_data) {
        _data = require("../constants/hadith.json") as HadithData;
    }
    return _data;
}

/**
 * Get all Bukhari sections with id, name, and hadith count.
 * Light operation — only reads metadata.
 */
export function getSections(): HadithSection[] {
    const { metadata } = loadData();
    const sections: HadithSection[] = [];

    const sectionEntries = Object.entries(metadata.sections);
    for (const [idStr, name] of sectionEntries) {
        const id = Number(idStr);
        if (id === 0 || !name) continue; // skip empty section 0

        const detail = metadata.section_details[idStr];
        const count = detail
            ? detail.hadithnumber_last - detail.hadithnumber_first + 1
            : 0;

        sections.push({ id, name, hadithCount: count });
    }

    return sections;
}

/**
 * Get hadiths for a specific section, with pagination.
 * @param sectionId  The book/section number
 * @param page       0-indexed page number
 * @param pageSize   Items per page (default 20)
 * @returns          { hadiths, hasMore, total }
 */
export function getHadithsBySection(
    sectionId: number,
    page: number = 0,
    pageSize: number = 20
): { hadiths: HadithItem[]; hasMore: boolean; total: number } {
    const { hadiths } = loadData();

    // Filter by section (reference.book === sectionId)
    const filtered = hadiths.filter((h) => h.reference.book === sectionId);
    const total = filtered.length;

    const start = page * pageSize;
    const end = Math.min(start + pageSize, total);
    const sliced = filtered.slice(start, end);

    return {
        hadiths: sliced,
        hasMore: end < total,
        total,
    };
}

/**
 * Get a random hadith from the collection.
 * Useful for the "daily hadith" feature on the dashboard.
 */
export function getRandomHadith(): HadithItem {
    const { hadiths } = loadData();
    // Use date-based seed so the same hadith shows all day
    const today = new Date();
    const seed =
        today.getFullYear() * 10000 +
        (today.getMonth() + 1) * 100 +
        today.getDate();
    const index = seed % hadiths.length;
    return hadiths[index];
}

/**
 * Get section name by id.
 */
export function getSectionName(sectionId: number): string {
    const { metadata } = loadData();
    return metadata.sections[String(sectionId)] || `القسم ${sectionId}`;
}

/**
 * Search hadiths across all sections.
 * Filters by text content (Arabic full-text search).
 * @param query     Arabic or transliterated search string
 * @param maxResults  Maximum number of results to return (default 50)
 */
export function searchHadiths(query: string, maxResults = 50): HadithItem[] {
    if (!query.trim()) return [];
    const { hadiths } = loadData();
    const q = query.trim();
    const results: HadithItem[] = [];
    for (const h of hadiths) {
        if (h.text.includes(q)) {
            results.push(h);
            if (results.length >= maxResults) break;
        }
    }
    return results;
}
