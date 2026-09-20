/**
 * Date utility functions for auto-renewing daily dates, formatting,
 * and automatic midnight rollover tracking.
 */

/**
 * Returns today's date in local 'YYYY-MM-DD' format.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Appends ordinal suffix to a number (e.g., 1 -> 1st, 2 -> 2nd, 20 -> 20th).
 */
export function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Formats a 'YYYY-MM-DD' string into a friendly human-readable format.
 * Examples:
 * - 'short': "20 Sep 2026"
 * - 'medium': "Sun, 20 Sep 2026"
 * - 'long': "Sunday, 20th of September, 2026"
 */
export function formatFriendlyDate(
  dateStr: string,
  style: 'short' | 'medium' | 'long' = 'medium'
): string {
  if (!dateStr) return '';
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    if (!year || !month || !day) return dateStr;

    const date = new Date(year, month - 1, day);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const shortMonthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const weekdayNames = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
    const shortWeekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const monthName = monthNames[month - 1];
    const shortMonthName = shortMonthNames[month - 1];
    const weekday = weekdayNames[date.getDay()];
    const shortWeekday = shortWeekdayNames[date.getDay()];

    if (style === 'short') {
      return `${day} ${shortMonthName} ${year}`;
    }

    if (style === 'long') {
      return `${weekday}, ${getOrdinalSuffix(day)} of ${monthName}, ${year}`;
    }

    // Default medium: e.g. "Sun, 20 Sep 2026"
    return `${shortWeekday}, ${day} ${shortMonthName} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Checks whether a given 'YYYY-MM-DD' string matches today's current calendar date.
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

/**
 * Calculates milliseconds remaining until the upcoming midnight.
 */
export function getMsUntilNextMidnight(): number {
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 0, 1 // 1 second past midnight
  );
  return Math.max(1000, nextMidnight.getTime() - now.getTime());
}
