'use client';

import styles from './page.module.css';

export default function SetupCompletePage() {
  const twilioNumber = process.env.NEXT_PUBLIC_TWILIO_NUMBER || '+447915902012';

  function formatNumber(num: string) {
    const digits = num.replace(/\D/g, '');
    if (digits.startsWith('44') && digits.length === 12) {
      return `0${digits.slice(2, 6)} ${digits.slice(6)}`;
    }
    return num;
  }

  return (
    <div className={styles.page}>
      <div className={styles.wordmark}>again</div>

      <div className={styles.check}>✓</div>

      <h1 className={styles.title}>you&apos;re set up.</h1>
      <p className={styles.sub}>
        your first reminder is on its way.<br />
        when it arrives, reply <strong>DONE</strong> or <strong>SNOOZE</strong>.
      </p>

      <div className={styles.card}>
        <div className={styles.cardLabel}>one thing</div>
        <p className={styles.cardText}>
          save this number as &quot;again&quot; so you<br />
          recognise it when it texts you.
        </p>
        <a href="/save" className={styles.saveBtn}>
          save contact →
        </a>
        <div className={styles.number}>{formatNumber(twilioNumber)}</div>
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          that&apos;s it. no app to check.<br />
          it finds you.
        </p>
        <a href="/" className={styles.homeLink}>getagain.co.uk</a>
      </div>
    </div>
  );
}
