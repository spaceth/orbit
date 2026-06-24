import type { SatellitePurpose } from "@/types/satellite";

export type Locale = "en" | "th";

export const LOCALES: readonly Locale[] = ["en", "th"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "orbit-locale";

export const UI_TEXT = {
  en: {
    loadingGlobe: "Loading globe…",
    inOrbit: "In Orbit",
    sortBy: "Sort by",
    sortSatellites: "Sort satellites",
    sortAlphabet: "Alphabet",
    sortLaunchDate: "Launch date",
    sortType: "Type",
    sortOperator: "Operator",
    unavailable: "Unavailable",
    hideSatellite: "Hide {name}",
    showSatellite: "Show {name}",
    upcoming: "Upcoming",
    notYetInOrbit: "Not yet in orbit — tracking unavailable.",
    noradTle: "NORAD {noradId} · TLE {age}",
    tleAgeHours: "{hours}h ago",
    tleAgeDays: "{days}d ago",
    apogee: "Apogee",
    perigee: "Perigee",
    altitude: "Altitude",
    velocity: "Velocity",
    launchDate: "Launch date",
    launchVehicle: "Launch vehicle",
    computingPosition: "Computing position…",
    tleLoadError: "Unable to load TLE data. Please try again later.",
    tleRetry: "Try again",
    footerCopyright: "©{year} SPACETH.CO. ALL RIGHTS RESERVED.",
    footerHowItWorks: "How's this website works?",
    switchToLightMode: "Switch to light mode",
    switchToDarkMode: "Switch to dark mode",
    switchThemeFromSystem:
      "Using system appearance ({mode}). Switch to {target} mode.",
    themeModeLight: "light",
    themeModeDark: "dark",
    switchToEnglish: "Switch to English",
    switchToThai: "Switch to Thai",
    languageEnglish: "EN",
    languageThai: "TH",
    year: "year",
    years: "years",
    month: "month",
    months: "months",
    day: "day",
    days: "days",
    inSpace: "in space",
    purpose: {
      Communication: "Communication",
      Military: "Military",
      Education: "Education",
      "Earth Observation": "Earth Observation",
      "Technology Demonstration": "Technology Demonstration",
      Science: "Science",
    } satisfies Record<SatellitePurpose, string>,
  },
  th: {
    loadingGlobe: "กำลังโหลดลูกโลก…",
    inOrbit: "บนโคจร",
    sortBy: "เรียงตาม",
    sortSatellites: "เรียงดาวเทียม",
    sortAlphabet: "ตัวอักษร",
    sortLaunchDate: "วันปล่อย",
    sortType: "ประเภท",
    sortOperator: "ผู้ดำเนินการ",
    unavailable: "ไม่พร้อมใช้งาน",
    hideSatellite: "ซ่อน {name}",
    showSatellite: "แสดง {name}",
    upcoming: "กำลังจะปล่อย",
    notYetInOrbit: "ยังไม่อยู่บนโคจร — ไม่สามารถติดตามได้",
    noradTle: "NORAD {noradId} · TLE {age}",
    tleAgeHours: "{hours} ชม. ที่แล้ว",
    tleAgeDays: "{days} วัน ที่แล้ว",
    apogee: "จุดไกลสุด",
    perigee: "จุดใกล้สุด",
    altitude: "ความสูง",
    velocity: "ความเร็ว",
    launchDate: "วันปล่อย",
    launchVehicle: "จรวดนำส่ง",
    computingPosition: "กำลังคำนวณตำแหน่ง…",
    tleLoadError: "ไม่สามารถโหลดข้อมูล TLE ได้ กรุณาลองใหม่อีกครั้ง",
    tleRetry: "ลองอีกครั้ง",
    footerHowItWorks: "เว็บไซต์นี้ทำงานอย่างไร?",
    switchToLightMode: "เปลี่ยนเป็นโหมดสว่าง",
    switchToDarkMode: "เปลี่ยนเป็นโหมดมืด",
    switchThemeFromSystem: "ใช้ธีมตามระบบ ({mode}) เปลี่ยนเป็นโหมด{target}",
    themeModeLight: "สว่าง",
    themeModeDark: "มืด",
    switchToEnglish: "เปลี่ยนเป็นภาษาอังกฤษ",
    switchToThai: "เปลี่ยนเป็นภาษาไทย",
    languageEnglish: "EN",
    languageThai: "TH",
    year: "ปี",
    years: "ปี",
    month: "เดือน",
    months: "เดือน",
    day: "วัน",
    days: "วัน",
    inSpace: "บนอวกาศ",
    purpose: {
      Communication: "การสื่อสาร",
      Military: "ทหาร",
      Education: "การศึกษา",
      "Earth Observation": "สำรวจทรัพยากรโลก",
      "Technology Demonstration": "สาธิตเทคโนโลยี",
      Science: "วิทยาศาสตร์",
    } satisfies Record<SatellitePurpose, string>,
  },
} as const;

export type UiText = (typeof UI_TEXT)[Locale];

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "th";
}

export function getUiText(locale: Locale): UiText {
  return UI_TEXT[locale];
}

export function getPurposeLabel(locale: Locale, purpose: SatellitePurpose): string {
  return UI_TEXT[locale].purpose[purpose];
}

export function formatTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
