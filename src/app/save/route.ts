import { NextResponse } from 'next/server';

export async function GET() {
  const phoneNumber = process.env.NEXT_PUBLIC_TWILIO_NUMBER || '+447915902012';
  // Format for vCard: strip + and add +
  const vcardPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:again',
    'ORG:again',
    `TEL;TYPE=CELL:${vcardPhone}`,
    'URL:https://getagain.co.uk',
    'NOTE:recurring task reminders via SMS. reply DONE or SNOOZE.',
    'END:VCARD',
  ].join('\r\n');

  return new NextResponse(vcard, {
    headers: {
      'Content-Type': 'text/vcard',
      'Content-Disposition': 'attachment; filename="again.vcf"',
    },
  });
}
