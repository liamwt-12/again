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

  // Task fields
  const [taskName, setTaskName] = useState('');
  const [cadence, setCadence] = useState<CadenceType>('daily');
  const [reminderTime, setReminderTime] = useState('09:00');

  const twilioNumber = process.env.NEXT_PUBLIC_TWILIO_NUMBER || '+447915902012';

  // Format the Twilio number for display
  function formatNumberForDisplay(num: string) {
    const digits = num.replace(/\D/g, '');
    if (digits.startsWith('44') && digits.length === 12) {
      return `0${digits.slice(2, 6)} ${digits.slice(6)}`;
    }
    return num;
  }

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
      if (!res.ok) {
        throw new Error(data.error || 'failed to send code');
      }
      // Store the normalised phone from the API
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'invalid code');
      }
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Create task + send onboarding SMS
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
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Format time for SMS preview
  function formatPreviewTime() {
    const [h, m] = reminderTime.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
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

      {/* Step 3: First task */}
      {step === 3 && (
        <div className={styles.step}>
          <div className={styles.wordmark}>again</div>
          <div className={styles.label}>step 3 of 3</div>
          <h2 className={styles.title}>add your first task.</h2>
          <p className={styles.sub}>it&apos;ll text you when it&apos;s due.</p>

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

          {/* SMS Preview */}
          <div className={styles.smsPreview}>
            <div className={styles.smsPreviewLabel}>first sms preview</div>
            <div className={styles.smsPreviewText}>
              <strong>{taskName ? taskName.toUpperCase() : 'YOUR TASK'}</strong><br />
              due today at {formatPreviewTime()}.<br />
              reply DONE or SNOOZE.
            </div>
          </div>

          {/* Save contact prompt */}
          <div className={styles.contactPrompt}>
            <div className={styles.contactPromptLabel}>save this contact</div>
            <div className={styles.contactPromptText}>
              reminders come from a uk mobile number.<br />
              save it as &quot;again&quot; so you recognise it.
            </div>
            <div className={styles.contactNumber}>{formatNumberForDisplay(twilioNumber)}</div>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          <button
            className={styles.btn}
            onClick={handleCreateTask}
            disabled={loading || !taskName.trim()}
            style={{ marginTop: '20px' }}
          >
            {loading ? 'creating...' : 'start — send first text →'}
          </button>
          <button className={styles.backBtn} onClick={() => { setStep(2); setError(''); }}>
            ← back
          </button>
        </div>
      )}
    </div>
  );
}
