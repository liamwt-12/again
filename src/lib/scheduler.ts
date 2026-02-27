// again — task scheduling and recurrence logic

export type CadenceType = 'daily' | 'weekly' | 'monthly' | 'once';

export interface CadenceMeta {
  day_of_week?: string;  // 'monday', 'tuesday', etc.
  day_of_month?: number; // 1-31
  once_date?: string;    // 'YYYY-MM-DD' for one-off tasks
}

/**
 * Calculate the next due date based on cadence type and meta.
 * All calculations assume Europe/London timezone for V1.
 */
export function calculateNextDue(
  cadenceType: CadenceType,
  cadenceMeta: CadenceMeta | null,
  reminderTimeLocal: string, // 'HH:MM'
  fromDate?: Date
): Date {
  const now = fromDate || new Date();
  const [hours, minutes] = reminderTimeLocal.split(':').map(Number);

  switch (cadenceType) {
    case 'once': {
      // One-off: use the specific date from meta, or today/tomorrow
      const onceDate = cadenceMeta?.once_date;
      if (onceDate) {
        const [y, m, d] = onceDate.split('-').map(Number);
        const next = new Date(Date.UTC(y, m - 1, d, hours, minutes, 0, 0));
        return next;
      }
      // Fallback: next occurrence at the given time
      const next = new Date(now);
      next.setUTCHours(hours, minutes, 0, 0);
      if (next <= now) {
        next.setUTCDate(next.getUTCDate() + 1);
      }
      return next;
    }

    case 'daily': {
      const next = new Date(now);
      next.setUTCHours(hours, minutes, 0, 0);
      if (next <= now) {
        next.setUTCDate(next.getUTCDate() + 1);
      }
      return next;
    }

    case 'weekly': {
      const dayOfWeek = cadenceMeta?.day_of_week || 'monday';
      const targetDay = dayNameToNumber(dayOfWeek);
      const next = new Date(now);
      next.setUTCHours(hours, minutes, 0, 0);

      const currentDay = next.getUTCDay();
      let daysUntil = targetDay - currentDay;

      if (daysUntil < 0) daysUntil += 7;
      if (daysUntil === 0 && next <= now) daysUntil = 7;

      next.setUTCDate(next.getUTCDate() + daysUntil);
      return next;
    }

    case 'monthly': {
      const dayOfMonth = cadenceMeta?.day_of_month || 1;
      const next = new Date(now);
      next.setUTCHours(hours, minutes, 0, 0);
      next.setUTCDate(dayOfMonth);

      if (next <= now) {
        next.setUTCMonth(next.getUTCMonth() + 1);
      }

      if (next.getUTCDate() !== dayOfMonth) {
        next.setUTCDate(0);
      }

      return next;
    }

    default:
      throw new Error(`Unknown cadence type: ${cadenceType}`);
  }
}

/**
 * Calculate smart snooze time.
 */
export function calculateSmartSnooze(now?: Date): Date {
  const current = now || new Date();
  const hour = current.getUTCHours();

  if (hour >= 8 && hour < 17) {
    const snooze = new Date(current);
    snooze.setUTCHours(snooze.getUTCHours() + 3);
    snooze.setUTCMinutes(0, 0, 0);
    return snooze;
  } else {
    const snooze = new Date(current);
    if (hour >= 17) {
      snooze.setUTCDate(snooze.getUTCDate() + 1);
    }
    snooze.setUTCHours(9, 0, 0, 0);
    return snooze;
  }
}

/**
 * Calculate explicit snooze duration.
 */
export function calculateExplicitSnooze(duration: '1H' | '3H' | '1D', reminderTime: string, now?: Date): Date {
  const current = now || new Date();
  const snooze = new Date(current);

  switch (duration) {
    case '1H':
      snooze.setUTCHours(snooze.getUTCHours() + 1);
      snooze.setUTCMinutes(0, 0, 0);
      return snooze;
    case '3H':
      snooze.setUTCHours(snooze.getUTCHours() + 3);
      snooze.setUTCMinutes(0, 0, 0);
      return snooze;
    case '1D': {
      const [hours, minutes] = reminderTime.split(':').map(Number);
      snooze.setUTCDate(snooze.getUTCDate() + 1);
      snooze.setUTCHours(hours, minutes, 0, 0);
      return snooze;
    }
    default:
      return calculateSmartSnooze(current);
  }
}

/**
 * Format a date for SMS display.
 */
export function formatDateForSMS(date: Date): { date: string; time: string } {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return {
    date: `${month} ${day}`,
    time: `${displayHour}:${displayMinutes} ${period}`,
  };
}

/**
 * Format a snooze time for SMS display.
 */
export function formatSnoozeTimeForSMS(snoozeDate: Date, now?: Date): string {
  const current = now || new Date();
  const { time } = formatDateForSMS(snoozeDate);

  const isToday = snoozeDate.getUTCDate() === current.getUTCDate() &&
                  snoozeDate.getUTCMonth() === current.getUTCMonth();

  const isTomorrow = snoozeDate.getUTCDate() === current.getUTCDate() + 1 &&
                     snoozeDate.getUTCMonth() === current.getUTCMonth();

  if (isToday) return `today at ${time}`;
  if (isTomorrow) return `tomorrow at ${time}`;

  const { date } = formatDateForSMS(snoozeDate);
  return `${date} at ${time}`;
}

function dayNameToNumber(day: string): number {
  const days: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };
  return days[day.toLowerCase()] ?? 1;
}

export function dayNumberToName(day: number): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[day] ?? 'monday';
}

/**
 * Calculate how many days a task is overdue.
 */
export function calculateOverdueDays(nextDueAtUtc: Date, now?: Date): number {
  const current = now || new Date();
  const diff = current.getTime() - nextDueAtUtc.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
