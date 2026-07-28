import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'privacy — again',
  description:
    'What again collects from the waiting list, why, who holds it, and how to be removed.',
};

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <Link href="/" className={styles.wordmark}>again</Link>

      <div className={styles.label}>legal</div>
      <h1 className={styles.title}>privacy</h1>
      <p className={styles.updated}>last updated 28 july 2026</p>

      <p className={styles.body}>
        again is closed to new signups. The only personal data this site collects is an
        email address, and only if you choose to leave one on the waiting list. We use it
        for exactly one thing: to email you once if again reopens. Nothing else is sent to
        it, it is never shared or sold, and there is no tracking or analytics on this site.
        The list is held by <strong>Useful for Humans Ltd</strong> as data controller —
        registered in England and Wales, Unit 82a James Carter Road, Bury St Edmunds,
        IP28 7DE, and registered with the Information Commissioner&apos;s Office under
        reference <strong>ZC200994</strong>. To be removed, email{' '}
        <a href="mailto:hello@getagain.co.uk?subject=Remove%20me%20from%20the%20again%20waiting%20list" className={styles.link}>
          hello@getagain.co.uk
        </a>{' '}
        and we will delete your address — no questions asked and no confirmation loop.
      </p>

      <p className={styles.body}>
        If you already had an again account, we also still hold the phone number and
        reminder history from it. The same address above will get that deleted, or exported
        to you first if you would rather keep a copy.
      </p>

      <div className={styles.rule} />
      <Link href="/" className={styles.back}>← again</Link>
    </div>
  );
}
