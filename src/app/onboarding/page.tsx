import type { Metadata } from 'next';
import Link from 'next/link';
import WaitingList from '@/components/WaitingList';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'waiting list — again',
  description: 'again is closed to new signups. Leave your email to hear if it reopens.',
  robots: { index: false, follow: true },
};

// This was the phone/OTP signup flow. again closed to new signups on
// 2026-07-28, so it captures an email for the waiting list instead. The
// /api/auth/* and /api/tasks/create routes it used to call are no longer
// reachable from anywhere in the UI.
export default function WaitingListPage() {
  return (
    <div className={styles.onboarding}>
      <div className={styles.step}>
        <Link href="/" className={styles.wordmarkLink}>again</Link>

        <div className={styles.label}>waiting list</div>
        <h2 className={styles.title}>we&apos;re closed for now.</h2>
        <p className={styles.sub}>
          again isn&apos;t taking new signups. no date promised — but if that changes,
          the list hears first.
        </p>

        <WaitingList />

        <div className={styles.closedNote}>
          had an account? sign-in was the same text-message flow, so it has gone too. to
          get your tasks and reminder history exported or deleted, email{' '}
          <a
            href="mailto:hello@getagain.co.uk?subject=again%20account%20data"
            className={styles.closedNoteLink}
          >
            hello@getagain.co.uk
          </a>
          . see <Link href="/privacy" className={styles.closedNoteLink}>privacy</Link>.
        </div>
      </div>
    </div>
  );
}
