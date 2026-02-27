'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface Task {
  id: string;
  title: string;
  cadence_type: string;
  cadence_meta: any;
  reminder_time_local: string;
  next_due_at_utc: string;
  status: string;
  stuck: boolean;
}

type CadenceType = 'once' | 'daily' | 'weekly' | 'monthly';

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plan, setPlan] = useState('free');
  const [stats, setStats] = useState({ completedThisMonth: 0, overdueCount: 0 });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'tasks' | 'add' | 'upgrade'>('tasks');

  // Add task form
  const [taskName, setTaskName] = useState('');
  const [cadence, setCadence] = useState<CadenceType>('once');
  const [time, setTime] = useState('09:00');
  const [onceDate, setOnceDate] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => { load(); }, []);

  // Set default once date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setOnceDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  async function load() {
    try {
      const res = await fetch('/api/dashboard');
      if (res.status === 401) { router.push('/onboarding'); return; }
      const data = await res.json();
      setTasks(data.tasks || []);
      setPlan(data.plan || 'free');
      setStats(data.stats || { completedThisMonth: 0, overdueCount: 0 });
    } catch {}
    setLoading(false);
  }

  async function addTask() {
    if (!taskName.trim()) return;
    if (cadence === 'once' && !onceDate) { setAddError('pick a date.'); return; }
    setAdding(true);
    setAddError('');
    try {
      const body: any = {
        title: taskName.trim().toUpperCase(),
        cadence_type: cadence,
        reminder_time_local: time,
      };
      if (cadence === 'once') {
        body.cadence_meta = { once_date: onceDate };
      }
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      if (data.inactive) {
        setView('upgrade');
      } else {
        setTaskName('');
        setCadence('once');
        setTime('09:00');
        setView('tasks');
        load();
      }
    } catch (err: any) {
      setAddError(err.message);
    }
    setAdding(false);
  }

  async function handleUpgrade(type: 'annual' | 'monthly') {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType: type }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {}
  }

  function formatNext(task: Task): string {
    if (task.status === 'inactive') return 'upgrade to activate';
    if (task.status === 'paused') return 'paused';
    if (task.status === 'completed') return 'completed';

    const due = new Date(task.next_due_at_utc);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffH = diffMs / (1000 * 60 * 60);
    const diffD = diffMs / (1000 * 60 * 60 * 24);

    if (diffMs < 0) {
      const overdueDays = Math.floor(Math.abs(diffD));
      if (overdueDays === 0) return 'due now';
      return `overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`;
    }

    if (diffH < 1) return 'due soon';
    if (diffH < 24) return `in ${Math.floor(diffH)}h`;
    if (diffD < 2) return 'tomorrow';
    if (diffD < 7) {
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      return days[due.getUTCDay()];
    }

    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return `${months[due.getUTCMonth()]} ${due.getUTCDate()}`;
  }

  function formatCadence(task: Task): string {
    if (task.cadence_type === 'once') return 'one-off';
    const t = formatTime(task.reminder_time_local);
    if (task.cadence_type === 'daily') return `daily · ${t}`;
    if (task.cadence_type === 'weekly') return `weekly · ${t}`;
    if (task.cadence_type === 'monthly') return `monthly · ${t}`;
    return t;
  }

  function formatTime(t: string): string {
    const [h, m] = t.split(':').map(Number);
    const p = h >= 12 ? 'pm' : 'am';
    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${dh}:${m.toString().padStart(2, '0')}${p}`;
  }

  function isOverdue(task: Task): boolean {
    if (task.status !== 'active') return false;
    return new Date(task.next_due_at_utc) < new Date();
  }

  function share() {
    const text = 'I use again — it texts me when recurring stuff is due. No app, just SMS. getagain.co.uk';
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      window.location.href = `sms:?body=${encodeURIComponent(text)}`;
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.wm}>again</div>
        <div className={styles.loading}>loading...</div>
      </div>
    );
  }

  // ============================================================
  // ADD TASK VIEW
  // ============================================================
  if (view === 'add') {
    return (
      <div className={styles.page}>
        <div className={styles.wm}>again</div>
        <h1 className={styles.viewTitle}>add a task.</h1>
        <p className={styles.viewSub}>what needs remembering?</p>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>task name</label>
          <input
            className={styles.input}
            type="text"
            placeholder="e.g. chase late payments"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>how often?</label>
          <div className={styles.cadenceRow}>
            {(['once', 'daily', 'weekly', 'monthly'] as CadenceType[]).map(c => (
              <button
                key={c}
                className={`${styles.cadenceBtn} ${cadence === c ? styles.cadenceActive : ''}`}
                onClick={() => setCadence(c)}
              >{c}</button>
            ))}
          </div>
        </div>

        {cadence === 'once' && (
          <div className={styles.field}>
            <label className={styles.fieldLabel}>when?</label>
            <input
              className={styles.input}
              type="date"
              value={onceDate}
              onChange={(e) => setOnceDate(e.target.value)}
            />
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.fieldLabel}>{cadence === 'once' ? 'remind me at' : 'remind me at'}</label>
          <input
            className={styles.input}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        {addError && <p className={styles.error}>{addError}</p>}

        <button className={styles.primaryBtn} onClick={addTask} disabled={adding || !taskName.trim()}>
          {adding ? 'adding...' : 'add task →'}
        </button>
        <button className={styles.ghostBtn} onClick={() => { setView('tasks'); setAddError(''); }}>
          ← back
        </button>
      </div>
    );
  }

  // ============================================================
  // UPGRADE VIEW
  // ============================================================
  if (view === 'upgrade') {
    return (
      <div className={styles.page}>
        <div className={styles.wm}>again</div>
        <h1 className={styles.viewTitle}>one task isn&apos;t enough.</h1>
        <p className={styles.viewSub}>
          you&apos;ve used your free task. upgrade for unlimited tasks.
        </p>

        <div className={styles.priceCards}>
          <button className={`${styles.priceCard} ${styles.priceCardFeat}`} onClick={() => handleUpgrade('annual')}>
            <div className={styles.priceBadge}>best value</div>
            <div className={styles.priceLabel}>yearly</div>
            <div className={styles.priceAmount}>£49.99<span>/yr</span></div>
            <div className={styles.priceNote}>£4.17/month</div>
          </button>
          <button className={styles.priceCard} onClick={() => handleUpgrade('monthly')}>
            <div className={styles.priceLabel}>monthly</div>
            <div className={styles.priceAmount}>£7<span>/mo</span></div>
            <div className={styles.priceNote}>cancel anytime</div>
          </button>
        </div>

        <button className={styles.ghostBtn} onClick={() => setView('tasks')}>
          ← not yet
        </button>
      </div>
    );
  }

  // ============================================================
  // TASKS VIEW
  // ============================================================
  const activeTasks = tasks.filter(t => t.status === 'active');
  const inactiveTasks = tasks.filter(t => t.status === 'inactive');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.wm}>again</div>
        {stats.completedThisMonth > 0 && (
          <div className={styles.stat}>{stats.completedThisMonth} done this month</div>
        )}
      </div>

      {/* Active tasks */}
      {activeTasks.length > 0 && (
        <div className={styles.section}>
          {activeTasks.map(task => (
            <div key={task.id} className={`${styles.taskCard} ${isOverdue(task) ? styles.taskCardOverdue : ''}`}>
              <div className={styles.taskTop}>
                <div className={styles.taskTitle}>{task.title}</div>
                <div className={`${styles.taskNext} ${isOverdue(task) ? styles.taskNextOverdue : ''}`}>
                  {formatNext(task)}
                </div>
              </div>
              <div className={styles.taskCadence}>{formatCadence(task)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Inactive tasks */}
      {inactiveTasks.length > 0 && (
        <div className={styles.section}>
          {inactiveTasks.map(task => (
            <div key={task.id} className={styles.taskCardInactive} onClick={() => setView('upgrade')}>
              <div className={styles.taskTitleInactive}>{task.title}</div>
              <div className={styles.taskNextInactive}>upgrade to activate →</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyText}>no tasks yet.</p>
          <p className={styles.emptySub}>add one and we&apos;ll start texting you.</p>
        </div>
      )}

      {/* Add button */}
      <button className={styles.addBtn} onClick={() => setView('add')}>
        + add task
      </button>

      {/* Share */}
      <button className={styles.shareBtn} onClick={share}>
        know someone who keeps forgetting stuff?
      </button>

      {/* Plan */}
      <div className={styles.planInfo}>
        {plan === 'free' ? 'free plan · 1 task' : 'pro · unlimited tasks'}
      </div>
    </div>
  );
}
