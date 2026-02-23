'use client';

import { useEffect } from 'react';
import styles from './page.module.css';

export default function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.visible);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll(`.${styles.reveal}, .${styles.revealStagger}`).forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ====== HERO ====== */}
      <section className={styles.heroSection}>
        <div className={styles.wordmark}>again</div>
        <div className={styles.heroRule} />

        <div className={styles.heroGrid}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              recurring tasks that refuse to <em>disappear.</em>
            </h1>
            <div className={styles.heroRuleShort} />
            <p className={styles.heroSub}>no boards. no projects. just recurring tasks.</p>
            <p className={styles.heroSub}>add it once. see it again until it's done.</p>
            <div className={styles.heroCta}>
              <a href="/onboarding" className={styles.btnPrimary}>start free — 1 task</a>
              <span className={styles.heroHint}>no app to open. it finds you.</span>
            </div>
          </div>

          <div>
            <div className={styles.phoneMock}>
              <div className={styles.phoneBar}>
                <span className={styles.phoneTime}>9:41</span>
                <span className={styles.phoneIcons}>▲ ⊙ ▮</span>
              </div>
              <div className={styles.phoneHeader}>
                <span className={styles.phoneBack}>‹</span>
                <span className={styles.phoneContact}>AGAIN</span>
              </div>
              <div className={styles.phoneBody}>
                <div className={`${styles.smsBubble} ${styles.smsMsg1}`}>
                  <div className={styles.smsTask}>SEND INVOICES</div>
                  <div className={styles.smsBody}>due today at 9:00 AM.</div>
                  <div className={styles.smsCmd}>reply <strong>DONE</strong> or <strong>SNOOZE</strong>.</div>
                </div>
                <div className={`${styles.smsOutbound} ${styles.smsMsg2}`}>
                  <div className={styles.smsOutboundBubble}><span>DONE</span></div>
                </div>
                <div className={`${styles.smsBubble} ${styles.smsMsg3}`}>
                  <div className={styles.smsTask}>SEND INVOICES</div>
                  <div className={styles.smsBody}>done.</div>
                  <div className={styles.smsBody}>next: March 1 at 9:00 AM.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className={styles.howSection}>
        <div className={styles.sectionRule} />
        <div className={styles.sectionLabel}>how it works</div>

        <div className={`${styles.howGrid} ${styles.revealStagger}`}>
          <div className={styles.howStep}>
            <div className={styles.stepNumber}>01</div>
            <div className={styles.stepTitle}>add a task.</div>
            <div className={styles.stepDesc}>tell us what and when. daily, weekly, monthly. pick a time. that's it.</div>
            <div className={styles.stepSms}>
              <div className={styles.stepSmsFrom}>you set up</div>
              <div className={styles.stepSmsBody}>
                <strong>CHASE LATE PAYMENTS</strong><br />
                every friday · 9:00 AM
              </div>
            </div>
          </div>

          <div className={styles.howStep}>
            <div className={styles.stepNumber}>02</div>
            <div className={styles.stepTitle}>get a text.</div>
            <div className={styles.stepDesc}>when it's due, you get an SMS. not a notification you'll swipe away. a text you'll actually read.</div>
            <div className={styles.stepSms}>
              <div className={styles.stepSmsFrom}>again texts you</div>
              <div className={styles.stepSmsBody}>
                <strong>CHASE LATE PAYMENTS</strong><br />
                due today at 9:00 AM.<br />
                <span className={styles.cmdText}>reply <strong>DONE</strong> or <strong>SNOOZE</strong>.</span>
              </div>
            </div>
          </div>

          <div className={styles.howStep}>
            <div className={styles.stepNumber}>03</div>
            <div className={styles.stepTitle}>reply done.</div>
            <div className={styles.stepDesc}>done? say so. not ready? snooze it. it'll come back. it always comes back.</div>
            <div className={styles.stepSms}>
              <div className={styles.stepSmsFrom}>confirmation</div>
              <div className={styles.stepSmsBody}>
                <strong>CHASE LATE PAYMENTS</strong><br />
                done.<br />
                next: March 14 at 9:00 AM.
              </div>
              <div className={styles.stepSmsReply}><span>✓ see you next friday</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== WHO IT'S FOR ====== */}
      <section className={styles.personasSection}>
        <div className={styles.sectionRule} />
        <div className={styles.sectionLabel}>who it's for</div>

        <div className={`${styles.personasGrid} ${styles.revealStagger}`}>
          <div className={styles.personaCard}>
            <div className={styles.personaHeader}>
              <div className={styles.personaRole}>plumber</div>
              <div className={styles.personaTask}>GAS SAFETY CERTS</div>
            </div>
            <div className={styles.personaSms}>
              <div className={styles.personaSmsLine}><strong>GAS SAFETY CERTS</strong></div>
              <div className={styles.personaSmsLine}>due today at 8:00 AM.</div>
              <div className={`${styles.personaSmsLine} ${styles.cmd}`}>reply <strong>DONE</strong> or <strong>SNOOZE</strong>.</div>
            </div>
            <div className={styles.personaDone}>
              <div className={styles.doneDot} />
              <div className={styles.doneText}>stays compliant. no spreadsheet needed.</div>
            </div>
          </div>

          <div className={styles.personaCard}>
            <div className={styles.personaHeader}>
              <div className={styles.personaRole}>freelancer</div>
              <div className={styles.personaTask}>SEND INVOICES</div>
            </div>
            <div className={styles.personaSms}>
              <div className={styles.personaSmsLine}><strong>SEND INVOICES</strong></div>
              <div className={styles.personaSmsLine}>overdue by 2 days.</div>
              <div className={`${styles.personaSmsLine} ${styles.cmd}`}>reply <strong>DONE</strong> or <strong>SNOOZE</strong>.</div>
            </div>
            <div className={styles.personaDone}>
              <div className={styles.doneDot} />
              <div className={styles.doneText}>cash flow protected. every single week.</div>
            </div>
          </div>

          <div className={styles.personaCard}>
            <div className={styles.personaHeader}>
              <div className={styles.personaRole}>founder</div>
              <div className={styles.personaTask}>WEEKLY REVIEW</div>
            </div>
            <div className={styles.personaSms}>
              <div className={styles.personaSmsLine}><strong>WEEKLY REVIEW</strong></div>
              <div className={styles.personaSmsLine}>due today at 5:00 PM.</div>
              <div className={`${styles.personaSmsLine} ${styles.cmd}`}>reply <strong>DONE</strong> or <strong>SNOOZE</strong>.</div>
            </div>
            <div className={styles.personaDone}>
              <div className={styles.doneDot} />
              <div className={styles.doneText}>the habit that makes everything else work.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== WHY SMS ====== */}
      <section className={`${styles.pitchSection} ${styles.reveal}`}>
        <div className={styles.sectionRule} />
        <div className={styles.sectionLabel}>why sms</div>
        <p className={styles.pitchText}>
          you've tried apps. you've tried reminders. you've tried writing it on your hand.{' '}
          <em>the problem was never remembering. the problem was caring enough to act.</em>
        </p>
        <p className={styles.pitchText} style={{ marginTop: '24px' }}>
          a text message sits between your mum and your electrician.{' '}
          <em>you can't ignore it. that's the point.</em>
        </p>
        <p className={styles.pitchSub}>
          again is not another productivity app. it's a number that keeps you honest.
        </p>
      </section>

      {/* ====== PRICING ====== */}
      <section className={styles.pricingSection}>
        <div className={styles.sectionRule} />
        <div className={styles.sectionLabel}>pricing</div>

        <div className={`${styles.pricingGrid} ${styles.revealStagger}`}>
          <div className={`${styles.priceCard} ${styles.featured}`}>
            <div className={styles.priceBadge}>best value</div>
            <div className={styles.priceLabel}>yearly</div>
            <div className={styles.priceAmount}>£49.99<span className={styles.pricePeriod}>/yr</span></div>
            <div className={styles.priceNote}>£4.17/month · cancel anytime</div>
            <ul className={styles.priceFeatures}>
              <li>unlimited recurring tasks</li>
              <li>sms reminders + confirmations</li>
              <li>snooze, skip, done via reply</li>
              <li>web dashboard</li>
            </ul>
          </div>

          <div className={styles.priceCard}>
            <div className={styles.priceLabel}>monthly</div>
            <div className={styles.priceAmount}>£7<span className={styles.pricePeriod}>/mo</span></div>
            <div className={styles.priceNote}>no commitment · cancel anytime</div>
            <ul className={styles.priceFeatures}>
              <li>unlimited recurring tasks</li>
              <li>sms reminders + confirmations</li>
              <li>snooze, skip, done via reply</li>
              <li>web dashboard</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '32px' }}>
          <div className={styles.priceFree}>free forever: 1 active task.</div>
          <div className={styles.priceFreeSub}>no credit card required. start now, upgrade when you need more.</div>
        </div>
      </section>

      {/* ====== FINAL CTA ====== */}
      <section className={`${styles.finalSection} ${styles.reveal}`}>
        <div className={styles.finalRule} />
        <h2 className={styles.finalTitle}>stop forgetting. start replying.</h2>
        <p className={styles.finalSub}>
          add your first task in 20 seconds. no app to download. no account to configure. just your phone number and the thing you keep putting off.
        </p>
        <div className={styles.finalCta}>
          <a href="/onboarding" className={styles.btnPrimary}>start free — 1 task</a>
          <span className={styles.heroHint}>uk beta · sms-powered · no fluff</span>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className={styles.footer}>
        <div className={styles.footerRule} />
        <div className={styles.footerContent}>
          <div className={styles.footerWordmark}>again</div>
          <div className={styles.footerNote}>recurring tasks that refuse to disappear.</div>
        </div>
      </footer>
    </>
  );
}
