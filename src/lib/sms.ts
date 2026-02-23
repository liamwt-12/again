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

// SMS format helpers — locked copy from spec
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

export function formatOnboarding(): string {
  return `This is how it works.\nWhen it's due, you'll get a text.\n\nsave this contact as "again."\n\nreply DONE or SNOOZE.`;
}

export function formatNudge(): string {
  return `that worked. got another one?\ngetagain.co.uk/add`;
}

export function formatNoPending(): string {
  return `no tasks due right now.\nyou're clear.`;
}

export function formatInvalidCommand(): string {
  return `reply DONE or SNOOZE.`;
}
