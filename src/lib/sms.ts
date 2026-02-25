import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID!;

const client = twilio(accountSid, authToken);

export async function sendSMS(to: string, body: string): Promise<string | null> {
  try {
    const message = await client.messages.create({
      body,
      messagingServiceSid,
      to,
    });
    return message.sid;
  } catch (error) {
    console.error('SMS send failed:', error);
    return null;
  }
}

// ============================================================
// CORE MESSAGES
// ============================================================

export function formatReminder(taskTitle: string, time: string): string {
  return `${taskTitle}\ndue today at ${time}.\nreply DONE or SNOOZE.`;
}

export function formatOverdue(taskTitle: string, days: number): string {
  const dayStr = days === 1 ? '1 day' : `${days} days`;
  return `${taskTitle}\noverdue by ${dayStr}.\nreply DONE or SNOOZE.`;
}

export function formatDoneConfirmation(taskTitle: string, nextDate: string, nextTime: string): string {
  return `${taskTitle}\ndone.\nnext: ${nextDate} at ${nextTime}.`;
}

export function formatSnoozeConfirmation(taskTitle: string, count: number, nextReminder: string): string {
  if (count === 1) {
    return `${taskTitle}\nsnoozed.\nnext reminder: ${nextReminder}.`;
  } else if (count === 2) {
    return `${taskTitle}\nsnoozed twice.\nnext reminder: ${nextReminder}.`;
  } else {
    return `${taskTitle}\nsnoozed ${count} times.\nreply DONE or SKIP.`;
  }
}

export function formatSkipConfirmation(taskTitle: string, nextDate: string, nextTime: string): string {
  return `${taskTitle}\nskipped.\nnext: ${nextDate} at ${nextTime}.`;
}

export function formatNoPending(): string {
  return `no tasks due right now.\nyou're clear.`;
}

export function formatInvalidCommand(): string {
  return `reply DONE or SNOOZE.`;
}

// ============================================================
// ONBOARDING — with save contact link
// ============================================================

export function formatOnboarding(): string {
  return `welcome to again.\n\nwhen a task is due, you'll get a text. reply DONE or SNOOZE. that's it.\n\nsave this contact:\ngetagain.co.uk/save`;
}

// ============================================================
// DELIGHT MESSAGES
// ============================================================

/**
 * First DONE ever — emotional hook.
 * Sent instead of normal done confirmation on a user's very first task completion.
 */
export function formatFirstDone(taskTitle: string, nextDate: string, nextTime: string): string {
  return `${taskTitle}\ndone. that's your first one.\n\nagain will be here next time.\nand the time after that.\n\nnext: ${nextDate} at ${nextTime}.`;
}

/**
 * Streak acknowledgment — sent after 4 consecutive completions of the same task.
 * Not gamified. Just a quiet nod.
 */
export function formatStreak(taskTitle: string, streakCount: number, nextDate: string, nextTime: string): string {
  return `${taskTitle}\ndone ${streakCount} times running.\n\nyou're not forgetting anymore.\n\nnext: ${nextDate} at ${nextTime}.`;
}

/**
 * Comeback message — when a task has been snoozed 3+ times.
 * Sent instead of normal snooze confirmation on the 4th snooze.
 */
export function formatComeback(taskTitle: string): string {
  return `${taskTitle}\nthis is the 4th time.\n\nsomething's blocking this.\nreply SKIP to push to next week.\nor DONE if you finally did it.`;
}

/**
 * Monday briefing — weekly overview of upcoming tasks.
 * Sent Monday 7am to users with 2+ active tasks.
 */
export function formatMondayBriefing(tasks: Array<{ title: string; day: string }>): string {
  const taskLines = tasks.map(t => `${t.title} (${t.day})`).join('\n');
  return `this week:\n\n${taskLines}\n\nyou've got this.`;
}

/**
 * Silent check-in — sent after 7 days of no activity.
 */
export function formatSilentCheckin(): string {
  return `haven't heard from you in a while.\n\nreply YES and we'll keep going.\nreply STOP and we'll pause everything.`;
}

/**
 * Nudge — sent 24-48h after first DONE to encourage second task.
 */
export function formatNudge(): string {
  return `that worked. got another one?\ngetagain.co.uk`;
}

/**
 * Pause confirmation — when user replies STOP.
 */
export function formatPauseConfirmation(taskCount: number): string {
  return `all ${taskCount} task${taskCount === 1 ? '' : 's'} paused.\n\ntext START when you're ready.`;
}

/**
 * Resume confirmation — when user replies START/YES after pause or check-in.
 */
export function formatResumeConfirmation(taskCount: number): string {
  return `welcome back. ${taskCount} task${taskCount === 1 ? '' : 's'} resumed.`;
}
