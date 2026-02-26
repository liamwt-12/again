'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

type CadenceType = 'daily' | 'weekly' | 'monthly';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [normalisedPhone, setNormalisedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [taskName, setTaskName] = useState('');
  const [cadence, setCadence] = useState<CadenceType>('weekly');
  const [reminderTime, setReminderTime] = useState('09:00');

  // Step 1: Send OTP
  async function handleSendCode() {
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed to send code');
      if (data.phone) setNormalisedPhone(data.phone);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP
  async function handleVerify() {
    if (!otp.trim()) return;
    setLoading(true);
    setError('');
    try {
      const phoneToVerify = normalisedPhone || phone.trim();
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneToVerify, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'invalid code');
      if (data.phone) setNormalisedPhone(data.phone);
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Create task
  async function handleCreateTask() {
    if (!taskName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const phoneToUse = normalisedPhone || phone.trim();
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneToUse,
          title: taskName.trim().toUpperCase(),
          cadence_type: cadence,
          reminder_time_local: reminderTime,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'failed to create task');
      }
      router.push('/setup-complete');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.onboarding}>
      {/* Step 1: Phone */}
      {step === 1 && (
        <div className={styles.step}>
          <div className={styles.wordmark}>again</div>
          <div className={styles.label}>step 1 of 3</div>
          <h2 className={styles.title}>what&apos;s your number?</h2>
          <p className={styles.sub}>we&apos;ll text you when tasks are due. nothing else.</p>
          <div className={styles.phoneInput}>
            <span className={styles.phonePrefix}>🇬🇧</span>
            <input
              className={styles.phoneField}
              type="tel"
              placeholder="07700 000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
              autoFocus
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button
            className={styles.btn}
            onClick={handleSendCode}
            disabled={loading || !phone.trim()}
          >
            {loading ? 'sending...' : 'send code →'}
          </button>
          <p className={styles.hint}>uk mobile numbers only during beta.</p>
        </div>
      )}

      {/* Step 2: OTP */}
      {step === 2 && (
        <div className={styles.step}>
          <div className={styles.wordmark}>again</div>
          <div className={styles.label}>step 2 of 3</div>
          <h2 className={styles.title}>check your messages.</h2>
          <p className={styles.sub}>we sent a 6-digit code to {phone}.</p>
          <input
            className={styles.otpField}
            type="text"
            inputMode="numeric"
            placeholder="000000"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            autoFocus
          />
          {error && <p className={styles.error}>{error}</p>}
          <button
            className={styles.btn}
            onClick={handleVerify}
            disabled={loading || otp.length < 6}
          >
            {loading ? 'verifying...' : 'verify →'}
          </button>
          <button className={styles.backBtn} onClick={() => { setStep(1); setError(''); }}>
            ← back
          </button>
        </div>
      )}

      {/* Step 3: First task — tight, no preview */}
      {step === 3 && (
        <div className={styles.step}>
          <div className={styles.wordmark}>again</div>
          <div className={styles.label}>step 3 of 3</div>
          <h2 className={styles.title}>add your first task.</h2>
          <p className={styles.sub}>what keeps slipping? we&apos;ll make sure it doesn&apos;t.</p>

          <div className={styles.taskRow}>
            <label className={styles.fieldLabel}>task name</label>
            <input
              className={styles.taskField}
              type="text"
              placeholder="e.g. send invoices"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.taskRow}>
            <label className={styles.fieldLabel}>how often?</label>
            <div className={styles.cadenceGrid}>
              {(['daily', 'weekly', 'monthly'] as CadenceType[]).map((c) => (
                <button
                  key={c}
                  className={`${styles.cadenceOpt} ${cadence === c ? styles.cadenceSelected : ''}`}
                  onClick={() => setCadence(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.taskRow}>
            <label className={styles.fieldLabel}>remind me at</label>
            <input
              className={styles.taskField}
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}
          <button
            className={styles.btn}
            onClick={handleCreateTask}
            disabled={loading || !taskName.trim()}
          >
            {loading ? 'creating...' : 'create task →'}
          </button>
          <button className={styles.backBtn} onClick={() => { setStep(2); setError(''); }}>
            ← back
          </button>
        </div>
      )}
    </div>
  );
}
