'use client';

import { useState } from 'react';
import styles from './WaitingList.module.css';

// Shared waiting-list capture. again is closed to new signups, so every CTA
// that used to point at the phone/OTP flow renders this instead. Posts to
// /api/waiting-list. `center` suits the blog CTA box and the final CTA band;
// the default left alignment suits the hero.
export default function WaitingList({ center = false }: { center?: boolean }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setState('loading');
    setError('');

    try {
      const res = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'could not save that. try again.');
      setState('done');
    } catch (err: any) {
      setError(err.message);
      setState('idle');
    }
  }

  const wrap = `${styles.wrap} ${center ? styles.center : ''}`;

  if (state === 'done') {
    return (
      <div className={wrap}>
        <p className={styles.done}>
          you&apos;re on the list. we&apos;ll email you if again reopens — nothing else.
        </p>
      </div>
    );
  }

  return (
    <div className={wrap}>
      <p className={styles.notice}>
        again is closed to new signups. Leave your email and you&apos;ll be first to know
        if it reopens.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.field}
          type="email"
          required
          placeholder="you@example.com"
          aria-label="email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className={styles.btn}
          type="submit"
          disabled={state === 'loading' || !email.trim()}
        >
          {state === 'loading' ? 'saving...' : 'notify me →'}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      <p className={styles.privacy}>
        email only, used once.{' '}
        <a href="/privacy" className={styles.privacyLink}>what we do with it</a>
      </p>
    </div>
  );
}
