'use client';

import { useState, useEffect } from 'react';
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
  snooze_count: number;
}

interface Stats {
  completedThisMonth: number;
  overdueCount: number;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats>({ completedThisMonth: 0, overdueCount: 0 });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState('free');

  // New task form
  const [newTaskName, setNewTaskName] = useState('');
  const [newCadence, setNewCadence] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [newTime, setNewTime] = useState('09:00');

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await fetch('/api/dashboard');
      if (res.status === 401) {
        window.location.href = '/';
        return;
      }
      const data = await res.json();
      setTasks(data.tasks || []);
      setStats(data.stats || { completedThisMonth: 0, overdueCount: 0 });
      setUserPlan(data.plan || 'free');
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  // Categorize tasks
  const now = new Date();
  const overdueTasks = tasks.filter(t => {
    if (t.status !== 'active') return false;
    const due = new Date(t.next_due_at_utc);
    return due < new Date(now.getTime() - 60 * 60 * 1000); // > 1 hour past due
  });
  const dueTodayTasks = tasks.filter(t => {
    if (t.status !== 'active') return false;
    const due = new Date(t.next_due_at_utc);
    const hoursPastDue = (now.getTime() - due.getTime()) / (1000 * 60 * 60);
    return hoursPastDue >= 0 && hoursPastDue <= 1;
  });
  const upcomingTasks = tasks.filter(t => {
    if (t.status === 'inactive') return true;
    if (t.status !== 'active') return false;
    const due = new Date(t.next_due_at_utc);
    return due > now;
  });
  const inactiveTasks = tasks.filter(t => t.status === 'inactive');

  async function handleAction(taskId: string, action: 'done' | 'snooze' | 'skip' | 'pause') {
    try {
      await fetch('/api/tasks/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, action }),
      });
      fetchDashboard();
    } catch (err) {
      console.error('Action failed:', err);
    }
  }

  async function handleAddTask() {
    if (!newTaskName.trim()) return;
    try {
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskName.trim().toUpperCase(),
          cadence_type: newCadence,
          reminder_time_local: newTime,
        }),
      });
      const data = await res.json();
      if (data.inactive) {
        setShowAddModal(false);
        setShowUpgradeModal(true);
      } else {
        setShowAddModal(false);
        setNewTaskName('');
        setNewCadence('daily');
        setNewTime('09:00');
      }
      fetchDashboard();
    } catch (err) {
      console.error('Add task failed:', err);
    }
  }

  async function handleUpgrade(priceType: 'annual' | 'monthly') {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  }

  function handleShare() {
    const text = `I use this thing called again that texts me when recurring stuff is due. No app, just SMS. getagain.co.uk`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      // Fallback: open SMS compose
      window.location.href = `sms:?body=${encodeURIComponent(text)}`;
    }
  }

  function formatMeta(task: Task): string {
    const time = formatTime(task.reminder_time_local);
    switch (task.cadence_type) {
      case 'daily': return `${time} · daily`;
      case 'weekly': return `${time} · weekly · ${task.cadence_meta?.day_of_week || 'monday'}s`;
      case 'monthly': return `${task.cadence_meta?.day_of_month || 1}${ordinal(task.cadence_meta?.day_of_month || 1)} · monthly · ${time}`;
      default: return time;
    }
  }

  function formatTime(t: string): string {
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${dh}:${m.toString().padStart(2, '0')} ${period}`;
  }

  function ordinal(n: number): string {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <div className={styles.wordmark}>again</div>
        </div>
        <div className={styles.rule} />
        <p style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text-3)' }}>loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.wordmark}>again</div>
      </div>
      <div className={styles.rule} />

      {/* Stats */}
      <div className={styles.stats}>
        <span>{stats.completedThisMonth} completed this month</span>
        {stats.overdueCount > 0 && (
          <span className={styles.statsAlert}>{stats.overdueCount} overdue</span>
        )}
      </div>

      {/* Overdue group */}
      {overdueTasks.length > 0 && (
        <div className={styles.taskGroup}>
          <div className={`${styles.groupLabel} ${styles.groupLabelDanger}`}>overdue</div>
          {overdueTasks.map(task => (
            <div key={task.id} className={styles.taskItem}>
              <div className={styles.taskLeft}>
                <div className={`${styles.taskName} ${styles.taskNameDanger}`}>
                  {task.title}
                  {task.stuck && <span className={styles.stuckBadge}>stuck</span>}
                </div>
                <div className={`${styles.taskMeta} ${styles.taskMetaDanger}`}>
                  {formatMeta(task)}
                </div>
              </div>
              <div className={styles.taskActions}>
                <button className={`${styles.taskBtn} ${styles.doneBtn}`} onClick={() => handleAction(task.id, 'done')}>DONE</button>
                <button className={`${styles.taskBtn} ${styles.snoozeBtn}`} onClick={() => handleAction(task.id, 'snooze')}>SNOOZE</button>
                {task.stuck && (
                  <button className={styles.taskBtn} onClick={() => handleAction(task.id, 'skip')}>SKIP</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Due today group */}
      {dueTodayTasks.length > 0 && (
        <div className={styles.taskGroup}>
          <div className={styles.groupLabel}>due today</div>
          {dueTodayTasks.map(task => (
            <div key={task.id} className={styles.taskItem}>
              <div className={styles.taskLeft}>
                <div className={styles.taskName}>{task.title}</div>
                <div className={styles.taskMeta}>{formatMeta(task)}</div>
              </div>
              <div className={styles.taskActions}>
                <button className={`${styles.taskBtn} ${styles.doneBtn}`} onClick={() => handleAction(task.id, 'done')}>DONE</button>
                <button className={`${styles.taskBtn} ${styles.snoozeBtn}`} onClick={() => handleAction(task.id, 'snooze')}>SNOOZE</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming group */}
      {upcomingTasks.length > 0 && (
        <div className={styles.taskGroup}>
          <div className={styles.groupLabel}>upcoming</div>
          {upcomingTasks.filter(t => t.status === 'active').map(task => (
            <div key={task.id} className={styles.taskItem}>
              <div className={styles.taskLeft}>
                <div className={styles.taskName}>{task.title}</div>
                <div className={styles.taskMeta}>{formatMeta(task)}</div>
              </div>
              <div className={styles.taskActions}>
                <button className={styles.taskBtn} onClick={() => handleAction(task.id, 'pause')}>pause</button>
              </div>
            </div>
          ))}
          {/* Inactive tasks */}
          {inactiveTasks.map(task => (
            <div key={task.id} className={styles.taskItem} onClick={() => setShowUpgradeModal(true)} style={{ cursor: 'pointer' }}>
              <div className={styles.taskLeft}>
                <div className={styles.taskNameInactive}>{task.title}</div>
                <div className={styles.taskMetaInactive}>inactive · upgrade to activate</div>
              </div>
              <div className={styles.taskActions}>
                <button className={`${styles.taskBtn} ${styles.activateBtn}`}>activate</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className={styles.empty}>
          <p>no tasks yet.</p>
        </div>
      )}

      {/* Add task */}
      <div className={styles.addTask} onClick={() => setShowAddModal(true)}>
        <span className={styles.addIcon}>+</span>
        <span>add recurring task</span>
      </div>

      {/* Share */}
      <div className={styles.shareLink} onClick={handleShare}>
        know someone who keeps forgetting stuff?
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalLabel}>new task</div>
            <div style={{ marginBottom: '20px' }}>
              <label className={styles.modalFieldLabel}>task name</label>
              <input
                className="input input-sm"
                type="text"
                placeholder="e.g. send invoices"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label className={styles.modalFieldLabel}>how often?</label>
              <div className={styles.cadenceGrid}>
                {(['daily', 'weekly', 'monthly'] as const).map((c) => (
                  <button
                    key={c}
                    className={`${styles.cadenceOpt} ${newCadence === c ? styles.cadenceSelected : ''}`}
                    onClick={() => setNewCadence(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label className={styles.modalFieldLabel}>remind me at</label>
              <input
                className="input input-sm"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
            <div className={styles.modalBtns}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleAddTask}>
                add task
              </button>
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setShowUpgradeModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalLabel}>upgrade</div>
            <h2 className={styles.modalTitle}>one task isn't enough.</h2>
            <p className={styles.modalDesc}>
              your free plan includes 1 active task. upgrade to add unlimited recurring tasks and keep them all running.
            </p>
            <div className={styles.modalPrice}>£49.99<span className={styles.modalPricePeriod}>/yr</span></div>
            <div className={styles.modalPriceSub}>or £7/month · cancel anytime</div>
            <div className={styles.modalBtns}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleUpgrade('annual')}>
                upgrade now
              </button>
              <button className="btn-secondary" onClick={() => setShowUpgradeModal(false)}>
                not yet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
