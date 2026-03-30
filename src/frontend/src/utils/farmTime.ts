// Date/time utilities for Farm Time calendar feature

/**
 * Get the first day of the month for a given date
 */
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of the month for a given date
 */
export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Generate a calendar grid for a month including leading/trailing days
 */
export function generateMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Get the day of week for the first day (0 = Sunday)
  const firstDayOfWeek = firstDay.getDay();

  // Calculate leading days from previous month
  const leadingDays: Date[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    leadingDays.push(date);
  }

  // Generate days of the current month
  const monthDays: Date[] = [];
  for (let day = 1; day <= lastDay.getDate(); day++) {
    monthDays.push(new Date(year, month, day));
  }

  // Calculate trailing days from next month
  const totalDays = leadingDays.length + monthDays.length;
  const trailingDaysCount = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7);
  const trailingDays: Date[] = [];
  for (let i = 1; i <= trailingDaysCount; i++) {
    trailingDays.push(new Date(year, month + 1, i));
  }

  return [...leadingDays, ...monthDays, ...trailingDays];
}

/**
 * Convert JavaScript Date to nanoseconds (bigint) for backend
 */
export function dateToNanos(date: Date): bigint {
  return BigInt(date.getTime()) * BigInt(1000000);
}

/**
 * Convert nanoseconds (bigint) from backend to JavaScript Date
 */
export function nanosToDate(nanos: bigint): Date {
  return new Date(Number(nanos / BigInt(1000000)));
}

/**
 * Get start of day in nanoseconds
 */
export function getStartOfDayNanos(date: Date): bigint {
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
  return dateToNanos(startOfDay);
}

/**
 * Parse HH:MM time string and combine with date to get timestamp in nanoseconds
 */
export function parseTimeToNanos(
  date: Date,
  timeString: string,
): bigint | null {
  if (!timeString || !timeString.match(/^\d{2}:\d{2}$/)) {
    return null;
  }

  const [hours, minutes] = timeString.split(":").map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  const dateTime = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0,
  );

  return dateToNanos(dateTime);
}

/**
 * Format nanoseconds timestamp to HH:MM string
 */
export function formatNanosToTime(nanos: bigint): string {
  const date = nanosToDate(nanos);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Format duration in nanoseconds to human-readable string (e.g., "7h 30m")
 */
export function formatDuration(nanos: bigint): string {
  const totalMinutes = Number(nanos / BigInt(60000000000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is in the current month
 */
export function isInMonth(date: Date, month: number, year: number): boolean {
  return date.getMonth() === month && date.getFullYear() === year;
}

/**
 * Format date to display string (e.g., "January 2026")
 */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Format date to short display string (e.g., "Jan 15, 2026")
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
