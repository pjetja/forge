/**
 * Returns ISO calendar week boundaries (Mon 00:00 – Sun 23:59:59.999) in local time.
 * Week boundaries are computed in the user's local timezone to match gym-day semantics.
 * Pass results as .toISOString() to Supabase queries (converts to UTC automatically).
 */
export function getCurrentWeekBounds(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
  const daysToMonday = day === 0 ? 6 : day - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

/**
 * Returns the previous ISO week's boundaries (Mon 00:00 – Sun 23:59:59.999).
 * Used for "last week's results" queries on the exercise detail page.
 */
export function getPreviousWeekBounds(): { weekStart: Date; weekEnd: Date } {
  const { weekStart } = getCurrentWeekBounds();
  const prevWeekEnd = new Date(weekStart.getTime() - 1); // 1ms before this Monday
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(weekStart.getDate() - 7);
  prevWeekStart.setHours(0, 0, 0, 0);
  return { weekStart: prevWeekStart, weekEnd: prevWeekEnd };
}
