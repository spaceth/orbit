import type { Locale, UiText } from "@/lib/localization";

export interface OperationDuration {
  years: number;
  months: number;
  days: number;
}

export function getOperationDuration(launchDate: string, now = new Date()): OperationDuration | null {
  const start = new Date(`${launchDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || now < start) {
    return null;
  }

  let years = now.getUTCFullYear() - start.getUTCFullYear();
  let months = now.getUTCMonth() - start.getUTCMonth();
  let days = now.getUTCDate() - start.getUTCDate();

  if (days < 0) {
    months -= 1;
    const daysInPreviousMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0),
    ).getUTCDate();
    days += daysInPreviousMonth;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

function plural(value: number, singular: string, pluralForm: string): string {
  return `${value} ${value === 1 ? singular : pluralForm}`;
}

export function formatOperationDuration(duration: OperationDuration, ui: UiText): string {
  const parts = [
    plural(duration.years, ui.year, ui.years),
    plural(duration.months, ui.month, ui.months),
    plural(duration.days, ui.day, ui.days),
  ];
  return `${parts.join(", ")} ${ui.inSpace}`;
}

export function formatLaunchDate(date: string, locale: Locale): string {
  const localeTag = locale === "th" ? "th-TH" : "en-US";
  return new Date(date).toLocaleDateString(localeTag, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatTleAge(date: string, ui: UiText): string {
  const epoch = new Date(date);
  const hours = Math.max(0, (Date.now() - epoch.getTime()) / (1000 * 60 * 60));
  if (hours < 24) {
    return ui.tleAgeHours.replace("{hours}", hours.toFixed(1));
  }
  return ui.tleAgeDays.replace("{days}", (hours / 24).toFixed(1));
}
