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

function plural(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

export function formatOperationDuration(duration: OperationDuration): string {
  const parts = [
    plural(duration.years, "year"),
    plural(duration.months, "month"),
    plural(duration.days, "day"),
  ];
  return `${parts.join(", ")} in space`;
}
