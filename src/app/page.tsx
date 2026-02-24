'use client';

import { useEffect } from 'react';
import styles from './page.module.css';

export default function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add(styles.vis);
      });
    }, { threshold: 0.15 });
    document.querySelectorAll(`.${styles.rv}, .${styles.rvs}`).forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ====== 1. HERO ====== */}
      <section className={styles.hero}>
        <div className={styles.wm}>again</div>
        <div className={`${styles.hr} ${styles.heroHr}`}></div>
        <div className={styles.heroGrid}>
          <div className={styles.heroLeft}>
            <h1 className={styles.heroTitle}>recurring tasks that refuse to <em>disappear.</em></h1>
            <div className={styles.heroHrShort}></div>
            <p className={styles.heroSub}>no boards. no projects. just recurring tasks.</p>
            <p className={styles.heroSub}>add it once. see it again until it&apos;s done.</p>
            <div className={styles.heroCta}>
              <a href="/onboarding" className={styles.btn}>start free — 1 task</a>
              <span className={styles.hint}>no app to open. it finds you.</span>
            </div>
          </div>
          <div>
            <div className={styles.phone}>
              <div className={styles.phoneBar}><span>9:41</span><span>▲ ⊙ ▮</span></div>
              <div className={styles.phoneHdr}><span className={styles.back}>‹</span><span className={styles.phoneName}>AGAIN</span></div>
              <div className={styles.phoneBody}>
                <div className={`${styles.bub} ${styles.m1}`}>
                  <div className={styles.bubTask}>SEND INVOICES</div>
                  <div className={styles.bubBody}>due today at 9:00 AM.</div>
                  <div className={styles.bubCmd}>reply <strong>DONE</strong> or <strong>SNOOZE</strong>.</div>
                </div>
                <div className={`${styles.out} ${styles.m2}`}><div className={styles.outBub}><span>DONE</span></div></div>
                <div className={`${styles.bub} ${styles.m3}`}>
                  <div className={styles.bubTask}>SEND INVOICES</div>
                  <div className={styles.bubBody}>done.</div>
                  <div className={styles.bubBody}>next: March 1 at 9:00 AM.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== 2. THE SPLIT ====== */}
      <section className={styles.split}>
        <div className={styles.secRule}></div>
        <div className={`${styles.splitGrid} ${styles.rvs}`}>
          <div className={`${styles.splitCard} ${styles.dim}`}>
            <div className={styles.splitLbl}>calendar reminder</div>
            <div className={`${styles.cal} ${styles.struck}`}>
              <div className={styles.calIco}>📅</div>
              <div>
                <div className={styles.calT}>Send invoices</div>
                <div className={styles.calS}>Friday 9:00 AM</div>
              </div>
              <div className={styles.calSw}>dismissed →</div>
            </div>
          </div>
          <div className={styles.splitCard}>
            <div className={styles.splitLbl}>again</div>
            <div className={styles.spSms}>
              <div className={styles.spSmsTask}>SEND INVOICES</div>
              <div className={styles.spSmsBody}>overdue by 2 days.</div>
              <div className={styles.spSmsCmd}>reply <strong>DONE</strong> or <strong>SNOOZE</strong>.</div>
            </div>
          </div>
        </div>
        <div className={`${styles.punch} ${styles.rv}`}>
          you can dismiss a calendar.<br />
          <em>you can&apos;t dismiss again.</em>
        </div>
      </section>

      {/* ====== 3. HOW IT WORKS ====== */}
      <section className={styles.how}>
        <div className={styles.secRule}></div>
        <div className={styles.secLbl}>how it works</div>
        <div className={`${styles.howRow} ${styles.rvs}`}>
          <div className={styles.howStep}>
            <div className={styles.howNum}>01</div>
            <div className={styles.howTitle}>add a task.</div>
            <div className={styles.howDesc}>what and when. daily, weekly, monthly. pick a time. done.</div>
            <div className={styles.howSms}>
              <div className={styles.howSmsFrom}>you set up</div>
              <div className={styles.howSmsBody}><strong>CHASE LATE PAYMENTS</strong><br />every friday · 9:00 AM</div>
            </div>
          </div>
          <div className={styles.howStep}>
            <div className={styles.howNum}>02</div>
            <div className={styles.howTitle}>get a text.</div>
            <div className={styles.howDesc}>when it&apos;s due, you get an SMS. not a notification. a text.</div>
            <div className={styles.howSms}>
              <div className={styles.howSmsFrom}>again texts you</div>
              <div className={styles.howSmsBody}><strong>CHASE LATE PAYMENTS</strong><br />due today at 9:00 AM.<br /><span className={styles.cmdDim}>reply <strong>DONE</strong> or <strong>SNOOZE</strong>.</span></div>
            </div>
          </div>
          <div className={styles.howStep}>
            <div className={styles.howNum}>03</div>
            <div className={styles.howTitle}>reply done.</div>
            <div className={styles.howDesc}>it comes back next week. or tomorrow. it always comes back.</div>
            <div className={styles.howSms}>
              <div className={styles.howSmsFrom}>confirmation</div>
              <div className={styles.howSmsBody}><strong>CHASE LATE PAYMENTS</strong><br />done. next: March 14 at 9:00 AM.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== 4. THE TURN ====== */}
      <section className={`${styles.turn} ${styles.rv}`}>
        <div className={styles.secRule}></div>
        <div className={styles.secLbl}>who it&apos;s for</div>
        <p className={styles.turnText}>
          again is for people who do the work but forget the rhythm.{' '}
          <em>the invoice that should go out every friday.
          the safety check that&apos;s due every month.
          the review you keep meaning to do.</em>
        </p>
        <p className={styles.turnText} style={{ marginTop: '28px' }}>
          you don&apos;t need a system.<br />
          you need a text.
        </p>
      </section>

      {/* ====== 5. THE OBJECTION ====== */}
      <section className={`${styles.objection} ${styles.rv}`}>
        <div className={styles.objQ}>&ldquo;why not just use your calendar?&rdquo;</div>
        <div className={styles.objA}>because you already tried that.</div>
      </section>

      {/* ====== 6. THE VALUE ====== */}
      <section className={styles.value}>
        <div className={styles.secRule}></div>
        <div className={styles.secLbl}>what forgetting actually costs</div>
        <div className={styles.rv}>
          <div className={styles.valueLine}>
            <div className={styles.valueTask}>invoices sent a week late, every month.</div>
            <div className={styles.valueCost}>cash flow delayed.</div>
          </div>
          <div className={styles.valueLine}>
            <div className={styles.valueTask}>safety certs forgotten until the client calls.</div>
            <div className={styles.valueCost}>reputation at risk.</div>
          </div>
          <div className={styles.valueLine}>
            <div className={styles.valueTask}>the weekly review that never quite happens.</div>
            <div className={styles.valueCost}>problems compound.</div>
          </div>
        </div>
        <div className={`${styles.valueFooter} ${styles.rv}`}>
          again costs less than <em>the thing you&apos;ll forget this month.</em>
        </div>
      </section>

      {/* ====== 7. FINAL ====== */}
      <section className={`${styles.final} ${styles.rv}`}>
        <div className={styles.finalRule}></div>
        <div className={styles.finalQ}>what did you forget last month?</div>
        <h2 className={styles.finalTitle}>it won&apos;t happen again.</h2>
        <p className={styles.finalSub}>add your first task in 20 seconds. no app to download. just your phone number and the thing you keep putting off.</p>

        <div className={styles.finalPricing}>
          <div className={`${styles.fpCard} ${styles.fpFeat}`}>
            <div className={styles.fpBadge}>best value</div>
            <div className={styles.fpLabel}>yearly</div>
            <div className={styles.fpAmount}>£49.99<span className={styles.fpPeriod}>/yr</span></div>
            <div className={styles.fpNote}>£4.17/month · cancel anytime</div>
          </div>
          <div className={styles.fpCard}>
            <div className={styles.fpLabel}>monthly</div>
            <div className={styles.fpAmount}>£7<span className={styles.fpPeriod}>/mo</span></div>
            <div className={styles.fpNote}>cancel anytime</div>
          </div>
        </div>

        <div className={styles.finalFree}>free forever: 1 task. no credit card. start now.</div>

        <div className={styles.finalCta}>
          <a href="/onboarding" className={styles.btn}>start free — 1 task</a>
          <span className={styles.hint}>uk beta · sms-powered · no fluff</span>
        </div>

        <div className={styles.proof}>
          built by one person. used by few. ignored by none.<br />
          newcastle, england.
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className={styles.foot}>
        <div className={styles.hr}></div>
        <div className={styles.footRow}>
          <div className={styles.footWm}>again</div>
          <div className={styles.footNote}>you will see this again. that&apos;s the point.</div>
        </div>
      </footer>
    </>
  );
}
