export function zonedDateKey(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dayNumber(dateKey: string) {
  return Date.parse(`${dateKey}T00:00:00.000Z`) / 86_400_000;
}

export function daysBetween(from: string, to: string) {
  return dayNumber(to) - dayNumber(from);
}
