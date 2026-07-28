# again (getagain.co.uk) — portfolio audit

**Audit date:** 2026-07-28 · **Scope:** read-only. No code changed, nothing fixed.
**Decision to inform:** sell / agent-operate / mothball.

## Evidence base

| Source | Access | How |
|---|---|---|
| Supabase DB (`hrzsrsvkhlwjsavguhys`) | **Full** | Management API SQL, live queries |
| Stripe (`acct_1SwOMREOQ4ZTBEbM`) | **Full** | Live API — products, prices, subs, invoices |
| Live site (`www.getagain.co.uk`) | **Full** | HTTP probes |
| Codebase | **Full** | 31 files, 3,256 LOC TS/TSX |
| Twilio (`AC02f71f…`) | **None** | Credentials in Supabase auth config return `401` — rotated or masked |
| Vercel | **None** | Local CLI token expired 2026-07-27 19:07 UTC |
| Analytics / Search Console | **Does not exist** | No analytics library in the codebase at all |

Every number below is measured unless tagged **[est]**. Twilio spend is *derived* — measured message counts × published UK rates — because the account is unreachable.

---

## Headline

The product is not underperforming. **It is silently broken and has been for 97 days.**

Both of its two users had their reminders permanently stopped by a bug, were never told, and one of them was using it for medication. The last reminder this service ever sent was **2026-04-20**.

---

## A. Commercial truth

### 1. Revenue — £0. Not "trivial". Zero.

Verified directly against Stripe, not inferred:

- Product `prod_U21EVrxOKfM0pC` "again pro" — annual £49.99. **0 subscriptions, all statuses.**
- Price `price_1T3xC0EOQ4ZTBEbM1awZHS8L` — monthly £7.00. **0 subscriptions, all statuses.**
- **0** invoice lines ever billed against either `again` price (100 most recent account invoices scanned).
- **0** users with a `stripe_customer_id` in the DB — meaning **no user ever reached checkout**, since that field is written the moment a Stripe customer is created.

MRR £0. ARR £0. Lifetime revenue £0. Paying customers 0. Churn undefined — there was never a paying customer to lose.

> The Stripe account is shared portfolio-wide and carries £10,388.44 across its 100 most recent charges. **None of it is `again`.** Do not let the account total flatter this product.

### 2. Usage

| Metric | Value |
|---|---|
| Registered users (`auth.users`, phone-confirmed) | **2** |
| Active users, 30d (sent or received anything) | **0** |
| Active users, 90d | **0** |
| Tasks ever created | **2** (`PAY ANTHONY`, `TAKE TABLETS`) |
| Tasks currently reminding | **0** — both `stuck = true` |
| Task completions | **29** (0 skipped — a 100% DONE rate) |
| Reminders sent, lifetime | **41** (29 `reminder` + 12 `overdue`) |
| Reminders sent, last 3 months | **0** |
| Text-to-add (`ADD` via SMS) usage | **0** — no task was ever created by SMS; both came from onboarding |
| Signups, last 133 days | **0** |

Reminders per month: **March 40 outbound, April 38 outbound, May 0, June 0, July 0.**

Per user:

| User | Outbound | Inbound | Lifespan | Silent since |
|---|---|---|---|---|
| `+447719053852` (`TAKE TABLETS`) | 67 | 28 | 40 days (Mar 17 – Apr 26) | **93 days** |
| `+447841520651` (`PAY ANTHONY`) | 11 | 3 | 5 days (Mar 3 – Mar 8) | **142 days** |

**The 21-article SEO blog: no measurable traffic, and it cannot be measured.** There is no analytics library, no Plausible, no GA, no Vercel Analytics anywhere in the codebase, and no Search Console access. What is verifiable:

- At least 2 of 21 posts are indexed (`text-message-reminder-service-uk`, `plumber-compliance-checklist`) — they surface under a `site:` query.
- They rank for **nothing** topical: a natural-language query for UK tradesmen reminder content returns nine competitor blogs and not getagain.co.uk.
- Two self-inflicted wounds: **`/robots.txt` is a 404**, and **every URL in `sitemap.xml` points at the apex domain, which 307-redirects to `www`** — the entire sitemap is a list of redirects.
- Signups attributable to the blog: **0.** The blog shipped in commit `d56c2cc`, the sitemap in `5fdea37` (2026-04-01). It has had ~4 months and produced no users.

### 3. Costs — itemised monthly

| Item | Monthly | Basis |
|---|---|---|
| Supabase compute (`ci_micro`, this project) | **$10.00** | Measured — billing addons API, $0.01344/hr |
| Supabase org Pro fee, allocated | **~$3.13** | Measured $25/mo ÷ 8 projects in org |
| Twilio UK number rental | **$2.50–5.00** [est] | $2.50/number published; number count unverifiable |
| Twilio message traffic | **$0.00** | Measured — zero messages since 2026-04-26 |
| Vercel Pro, allocated | **~$2.50** [est] | `* * * * *` cron requires Pro ($20/mo); assumed shared 8 ways |
| Domain `getagain.co.uk` | **~$1.10** [est] | ~£10/yr .co.uk; registrar unverified |
| **Total** | **≈$19–22/mo** | |

**Annual: ≈$230–260 (≈£185–205).** Against £0 revenue.

Lifetime Twilio message spend, derived from measured volume at published UK rates ($0.056 outbound, $0.0075 inbound): **$4.60 total, across the product's entire life.**

#### Per-message economics — every user is unprofitable, and the paid tier is too

Revenue per user is £0 because 100% of users are on `free`, so unprofitability is trivially true. The structural finding is worse:

One completed daily task costs **$0.1195 per occurrence** (reminder out $0.056 + inbound DONE $0.0075 + confirmation out $0.056) → **~$3.59/month**.

- **Free tier** permits exactly one task, at daily cadence. So the free tier is designed to lose **~$3.59/mo (~£2.80/mo)** per engaged user, forever. Measured against the real user: `+447719053852` ran at $2.82/mo.
- **Annual plan** (£49.99/yr = £4.17/mo ≈ $5.29) goes **underwater at 2 daily tasks** ($7.18 cost).
- **Monthly plan** (£7/mo ≈ $8.89) goes underwater at **3 daily tasks**.

The paid tier's entire promise is *unlimited tasks*. It is sold at a flat price against a purely variable cost, with no cap. **A power user is a bigger loss than a free user.** UK carrier surcharges, which I could not read, would push these break-evens lower still.

### 4. Growth signal without attention — nil, and measured

Zero signups in 133 days. Zero traffic-to-signup conversion from a 21-article content investment over ~4 months. The honest answer is not "slow" — it is **none**.

---

## B. Operational load

### Recurring tasks

| Task | Cadence | Who/what does it | Monitored by |
|---|---|---|---|
| Reminder dispatch | Vercel cron, `* * * * *` (43,800 runs/mo) | `/api/cron/remind` | **Nothing** |
| Inbound SMS handling | Per message | `/api/sms/inbound` | **Nothing** |
| Billing admin | — | none needed (0 subscriptions) | — |
| Support | — | **no support channel exists** — no contact page, no email in the app | — |
| Content | — | 21 posts hardcoded in `posts.ts`, no CMS, no cadence | — |

**What monitors the cron: nothing.** No alerting, no dead-man's switch, no error reporting service. Failures go to `console.error` and Vercel's log retention.

**What happens when Twilio errors:** `sendSMS()` catches the exception, logs to console, returns `null`. The cron then updates `last_reminded_at_utc` **regardless of whether the send succeeded** (`src/app/api/cron/remind/route.ts:120-124`). So a Twilio failure is recorded as a delivered reminder, is never retried, and blocks the next attempt for 23 hours. There is no status callback and **`provider_message_id` is NULL on all 109 sms_events rows** — the column exists and is never written. There is no delivery audit trail whatsoever. The app cannot tell a delivered reminder from a dropped one.

### Support volume, last 90 days

**Zero** — and not because it's low-maintenance. There have been no inbound messages of any kind since 2026-04-26, because there is no working service to contact anyone about.

### Founder-hours

- **Now: 0/month, measured.** No commit since 2026-04-01 (118 days). No message sent since 2026-04-26.
- **Minimum to stay healthy: 1–2 h/month [est]** — delivery spot-check, Twilio balance, dependency patching. This figure is hypothetical; it describes a service that works.
- **What degrades in 90 untouched days: the experiment has already been run and the answer is total failure.** 2026-04-26 → 2026-07-28 is 93 untouched days. Outcome: every user silently abandoned.

### Has anything failed silently already? Yes. This is the central finding.

**Both tasks are `stuck = true`. The cron query filters `.eq('stuck', false)`. Once stuck, a task is never reminded again — permanently.**

Delivery log versus expected volume, both users on daily cadence:

| Window | Reminders expected | Reminders sent |
|---|---|---|
| 2026-03-08 → 2026-07-28 (user A) | ~142 | **0** |
| 2026-04-23 → 2026-07-28 (user B) | ~96 | **0** |

The mechanism, from the code and confirmed in the data:

1. Task goes 2 days overdue → `stuck = true`, one SMS sent: *"TAKE TABLETS marked as stuck after 2 days overdue."*
2. That message **never says reminders have stopped**, and never says how to restart them.
3. `handleResume` (`START`/`YES`/`RESUME`) only un-pauses `status='paused'` tasks. **It does not clear `stuck`.**
4. The only escape is replying `DONE` or `SKIP` — which works, but is never communicated.

And the users hit exactly that wall. On **2026-04-26**, four days after their medication reminder died, user `+447719053852` texted **"Yes"** — trying to come back. The system replied:

> **"welcome back. 0 tasks resumed."**

They have heard nothing since. That is 93 days ago.

A reminders product that silently misses reminders is worse than one that's closed. This one silently missed ~238 reminders, told a user "0 tasks resumed" when they asked for help, and one of the two abandoned tasks was `TAKE TABLETS`.

---

## C. Technical state & transferability

### 1. Shared-infrastructure dependencies

| Dependency | Identifier | Shared? | Untangling |
|---|---|---|---|
| Supabase project | `hrzsrsvkhlwjsavguhys` | Org `brshcusmckvnuvcajddu` holds **8 projects** | Project transfer needs target org on a paid plan; or dump/restore. Low. |
| Twilio | account `AC02f71f…` | **Yes** — one account serves the product SMS path *and* Supabase OTP, likely other portfolio products | **Real blocker.** See D1. |
| Stripe | `acct_1SwOMREOQ4ZTBEbM` "Useful For Humans" | **Yes** — £10,388 of unrelated portfolio charges | Stripe accounts are **not transferable**. Buyer must re-create. Two duplicate "again pro" products already exist. |
| Vercel | team `team_g1RLoiOt6dBpVrqtGAhcEotN` | Yes | Project transfer. Low. |
| **Resend** | — | **Not used** | No Resend dependency, import, or email path anywhere in this codebase. `again` sends no email at all. |
| Domain | `getagain.co.uk` | Presumably sole | Registrar unverified. |

**The migration file cannot rebuild the live database.** `supabase/migrations/001_initial_schema.sql` is missing the `users.pending_add_title`, `pending_add_step`, `pending_add_cadence` columns that exist in production and that the inbound handler depends on. Its CHECK constraints also reject four values the application actively writes (below). A buyer who runs this migration gets a schema the app breaks on.

### 2. SMS compliance surface — the section that decides the agent question

**Opt-out handling: not verified working, and probably not compliant.**

`STOP` is matched by **exact string only** (`command === 'STOP' || command === 'PAUSE'`). The standard carrier opt-out keyword set is not covered:

| Keyword | Handled? | Actual behaviour |
|---|---|---|
| `STOP` | Yes | Pauses tasks, replies |
| `STOPALL`, `UNSUBSCRIBE`, `END`, `QUIT` | **No** | Falls through to `formatInvalidCommand()` → replies **"reply DONE, SNOOZE, or text ADD to create a task."** |
| `CANCEL` | **Mis-mapped** | Routed to `handleDelete` — **deletes a task** instead of opting the user out |

So on the application's own logic, texting `UNSUBSCRIBE` to this service returns an instruction to create a task.

Three further gaps:
- **STOP only works for known users.** `if (!user) return emptyResponse();` — an unrecognised number gets silence and no suppression record.
- **No suppression list exists.** `STOP` sets `tasks.status='paused'`. There is no `opted_out_at`, no user-level flag, and `YES` re-enables everything.
- **Unverified mitigation:** Twilio Messaging Services can intercept standard keywords via Advanced Opt-Out *before* the webhook fires. If that is enabled on the product messaging service, carriers' minimum is met at the Twilio layer despite the app's gaps. **I could not verify this — the Twilio account is unreachable.** If it is off, this is a live compliance breach.

**Consent records: none exist.** The `users` table holds `phone, timezone, plan, stripe_customer_id, first_done_at_utc, nudge_sent, created_at, pending_add_*`. There is no consent timestamp, no capture method, no IP, no stored opt-in wording, no opt-out record. The only artefact of consent is *that a row exists*. Onboarding is phone → OTP → row; there is no consent checkbox and no consent copy — a grep for `privacy|terms|gdpr|consent|opt-out|unsubscribe` across `src/` returns **no files**.

**Privacy policy: absent.** `https://www.getagain.co.uk/privacy` → **404**. `/terms` → **404**. Verified live.

**Sender registration: unknown.** Unverifiable without Twilio access.

**Personal data held:** 2 phone numbers; 109 message bodies including task titles; 29 completion timestamps. Note the data is more sensitive than "task titles" suggests — `TAKE TABLETS` on a daily 07:00 cadence with a 29-event completion history is a **medication-adherence record**, held with no privacy notice and no consent trail.

**Can this product responsibly run unattended, with no human accountable?**

**No.** Unambiguously no, and the evidence is not hypothetical:

1. It **already failed silently for 97 days with a human nominally accountable.** Removing the human does not improve that.
2. There is **no delivery telemetry to monitor** — `provider_message_id` is never written, so no agent can verify a reminder actually arrived. An agent asked "is dispatch healthy?" has nothing to read.
3. Opt-out keyword coverage is incomplete and `CANCEL` actively does the wrong thing. An unattended system that mishandles opt-outs is generating regulatory exposure per message, with nobody to notice.
4. There are **no consent records**, so if a complaint arrives there is no way to demonstrate lawful basis — and no human to answer it.
5. There is no privacy notice, so the UK GDPR Art. 13 transparency obligation is unmet before the first agent is even wired up.

A compliance failure with nobody watching is the worst outcome available here, and this codebase is pre-configured for it. **Do not run this unattended.**

### 3. Personal data, privacy policy, credential storage

Data and policy state: above. **Credential storage is alarming and worth acting on independently of this decision:**

- **The Twilio account SID and auth token are retrievable in plaintext** from the Supabase auth config via the Management API, using only a Supabase CLI session. I recovered them during this audit. (They now 401 — rotated or masked — but the storage pattern stands.)
- **A live Stripe secret key sits in plaintext** in `~/Documents/hauscope/.env.vercel.local`. It is not scoped to one product: it opened `acct_1SwOMREOQ4ZTBEbM` and let me read the whole portfolio's customers, charges and invoices — the account carrying £10,388. **One unencrypted file on a laptop is full read access to portfolio-wide payment data.**
- No secrets manager. No `.env` in this repo (good), but `.gitignore` discipline is the only control.

### 4. Additional defects found (evidenced, not fixed)

| # | Defect | Evidence |
|---|---|---|
| 1 | **`stuck` trap** — permanent silent stop, no recovery path communicated | Both tasks stuck; ~238 reminders missed |
| 2 | **Timezone is wrong for 7 months of the year.** `reminder_time_local` is applied with `setUTCHours()`; `users.timezone` is written once and **never read anywhere**. During BST every reminder fires 1h late *and the SMS text states the wrong time.* | User asked 07:00 local; sent `2026-04-20 07:00:24Z` = 08:00 BST, body read "due today at 7:00 AM" |
| 3 | **Overdue reminders drift backwards ~1h/day** — the 23-hour gate makes each retry earlier than the last, marching into the night | `07:00:24` → `06:01:24` → `05:02:24` → `04:03:24` |
| 4 | **One-off tasks cannot be created.** `cadence_type='once'` violates the live CHECK constraint (`daily|weekly|monthly`). The insert error is never checked, so the user gets *"added. one-off — we'll text you once then it's done."* and **no task exists.** A shipped, blogged feature (`/blog/one-off-reminder-text`). Same for `status='completed'`. | `tasks_cadence_type_check`, `tasks_status_check` |
| 5 | **Monday briefings and silent check-ins are never logged.** `kind='briefing'`/`'checkin'` violate `sms_events_kind_check`; the error is swallowed and the SMS is still sent. Outbound messages may exist that this audit cannot see. | `sms_events_kind_check` has no such values; 0 rows of either kind |
| 6 | **Inbound webhook is unauthenticated.** No Twilio signature validation anywhere. Anyone can POST `From=<victim>&Body=DELETE` to destroy another user's tasks, or `STOP` them, or add tasks. | `grep validateRequest` → none |
| 7 | **Dashboard auth bypass — verified live.** Auth is an unsigned `again_phone` cookie. Probing with a forged cookie for a non-existent number returns `404 {"error":"user not found"}`, not `401` — proving the cookie is trusted with no session check. A real number in that cookie returns that user's tasks, plan and phone. | Live probe against `/api/dashboard` |
| 8 | **`/api/tasks/action` has no authentication at all — verified live.** No cookie check, no session, no ownership check. It accepts a bare `taskId` and mutates any task in the database (`done`/`skip`/`snooze`/`pause`) using the service-role client. An unauthenticated POST returns `404 "task not found"` for an unknown UUID — so a *known* UUID is acted on. Practical exploitability is limited by UUID entropy, not by any control in the code. | Live unauthenticated POST to `/api/tasks/action` |
| 9 | **RLS is decorative.** Every data-touching route uses the service-role client, bypassing all the policies in the schema. | `createServiceClient()` in all 9 API routes |
| 10 | **vCard hands out a possibly-wrong number.** Live `/save` returns `+447915902012` — the hardcoded fallback — while `.env.example` names the product number as `+447488892112`, implying `NEXT_PUBLIC_TWILIO_NUMBER` is unset in production. | Live fetch of `/save` |
| 11 | No `robots.txt` (404); sitemap lists apex URLs that all 307 to `www` | Live probes |

### 5. Transfer effort

**S for the assets, M once the sender and compliance layer are included.** The code (3,256 LOC), data (2 users) and Vercel/Supabase projects move in an afternoon. The Twilio number, a fresh Stripe account, and the missing consent/privacy/opt-out layer are the real work — and the compliance layer is net-new, not transferred.

---

## D. The three futures

### 1. SELL — not saleable as a business

**What a buyer actually gets:** 2 dormant users (one an unmet duty of care rather than an asset); 21 SEO articles ranking for nothing, with no analytics history to show a buyer; a 3,256-LOC Next.js app; the text-to-add mechanic — **which has never been used once and is partly broken** (`once` cadence fails silently); a UK Twilio number with transfer friction; £0 revenue; no privacy policy; and a service that has been dead for 97 days.

**Transfer blockers:**
- **Twilio number transfer is a real blocker, as suspected.** Account-to-account moves within Twilio are a manual support-ticket process, and porting out to another carrier is a weeks-long carrier-mediated process. The number is also entangled with the Supabase OTP path on the same account, so the seller cannot simply hand over credentials.
- **Stripe cannot be transferred at all** — the account is portfolio-shared with £10k of unrelated charges. Buyer starts from scratch.
- **The migration file can't rebuild the DB** (§C1), so "here's the repo" doesn't reproduce a working system.
- **Disclosure obligation:** any honest listing must state that the service silently stopped reminding both users, that opt-out keyword handling is incomplete, and that there is no privacy policy.

**Realistic price.** Micro-SaaS trades on a multiple of profit, or at minimum on verified MRR. At £0 MRR there is no multiple to apply — standard 2–4× ARR gives £0. What remains is an asset sale: **[est]** 21 niche UK articles with no traffic £150–500; a clean `.co.uk` domain £50–200; the code as an SMS-reminder starter template £200–800 to a developer.

**Honest verdict: £0–1,000 nominal, most likely £0 realised.** Marketplace fees, escrow, and the time to write the disclosures exceed the proceeds. If you want money out of this, **sell the domain by itself** and bin the rest.

### 2. AGENT-OPERATE — showcase only, and not yet

Task inventory mapped honestly:

| Task | Verdict | Why |
|---|---|---|
| Reminder dispatch | **Never — must stay deterministic cron** | Correct instinct. Timing correctness is not a judgement call. |
| Delivery monitoring | **Unattended — but it doesn't need an agent** | This is the one genuinely missing capability. It is a cron that compares expected vs actual sends and alerts. ~20 lines. An agent here is a costume on a `COUNT(*)`. |
| Support triage | **Assisted at best** | Support volume is 0. Nothing to own. |
| Content generation | **Unattended** | Safe, and the only task with real headroom. Also the task with proven zero payoff — 21 articles produced 0 signups. |
| Compliance / opt-out handling | **Never** | Regulatory accountability cannot be delegated to a system with no accountable person. See §C2. |
| Billing admin | **N/A** | 0 subscriptions. |

**Hours saved vs setup + monitoring:** the honest current load is **0 h/month**. Agents cannot save time on a service that isn't running. Setup and ongoing supervision of an agent fleet would *create* net new hours. The arithmetic doesn't work at any assumed hourly rate.

And it fails the accountability test in §C2 outright. **The one task agents could own — monitoring — is the task that would have caught the bug that killed the product.** But that is a cron and an alert, not an agent.

**Name it plainly: this is a showcase, not leverage.** As a Useful For Humans story it has some value — "an SMS product operated by agents" is a legible, interesting claim. But value it as marketing, at the cost of the engineering time to build it, and note the story is currently *bad*: a product whose two users were silently abandoned is not a credible demonstration of autonomous operation. The showcase only becomes honest **after** dispatch, delivery telemetry, opt-out coverage, and a privacy notice are fixed — i.e. after 1–2 days of work that nothing in §A justifies spending.

### 3. MOTHBALL

Three variants:

| Variant | What it means | Cost |
|---|---|---|
| **(a) Close signups, keep serving existing users** | **Currently fiction** — it is not serving anyone. Requires fixing the `stuck` trap and the timezone bug first (~half a day) before "keep serving" is a truthful description. | ~£190/yr + fix work |
| **(b) Site as portfolio piece, SMS off** | Keep landing page + 21 articles static, remove signup, release the Twilio number, pause the Supabase project. | **~£10–15/yr** (domain; Vercel free tier) |
| **(c) Full dignified shutdown** | Everything off, data erased, domain dropped or parked. | **~1–2 h + $0.11 in SMS** |

**What winding down owes the two users.** The brief asks specifically, and this is the part that actually matters:

1. **An honest message, now — and it is 97 days overdue, not prospective.** A notice period is the wrong frame: the service already stopped without warning. What is owed is an apology that says plainly *reminders stopped on 2026-04-22 because of a bug, you were not told, and they are not coming back.* One of those two people was reminding themselves to take tablets. That message costs $0.056 each and should go regardless of which future you pick.
2. **Their data,** offered as an export — 2 task records and a 29-entry completion history.
3. **A concrete migration suggestion,** not a shrug: iOS Reminders or Google Tasks for `PAY ANTHONY`; a dedicated adherence app for `TAKE TABLETS`.
4. **Erasure** of phone numbers and message bodies once notified — UK GDPR, and there is no privacy policy that would justify retention.

Total cost of doing right by them: **under two hours and eleven pence.**

---

## E. Verdict

**Mothball — variant (b), preceded by the duty-of-care shutdown in (c).** The evidence isn't close: £0 lifetime revenue verified directly in Stripe, 0 subscriptions ever created, 2 registered users, 0 active users, 0 signups in 133 days, and a 21-article SEO investment that produced no measurable traffic and no users in four months. Against that, ~£190/yr of run-rate and a free tier engineered to lose ~£2.80/month per engaged user while the paid tier goes underwater at two daily tasks — so growth, if it ever came, would make the losses worse, not better. Selling is not available: there is no revenue to multiply, Stripe can't transfer, the Twilio number moves only by support ticket, and any honest listing must disclose that the service silently failed. Agent-operating is worse than pointless: it would add supervision hours to a product with no load, and it fails the accountability test — no consent records, no delivery telemetry, incomplete opt-out handling, and no privacy policy is not a system that may responsibly run with nobody answerable. **What would change this:** evidence of willingness to pay. Fix the `stuck` trap, the timezone, and the compliance layer (1–2 days), reopen, and if three people pay £49.99 the calculus genuinely shifts — but reprice the free tier first, because today each new engaged user is a £34/year liability.

**The most surprising number is 29 — task completions, with zero skips.** A 100% DONE rate across 40 days. The core loop *worked*; the one real user loved it and answered every single text. This product wasn't killed by indifference or churn. It was killed by `.eq('stuck', false)` — a two-line filter with no recovery path — and then it told that user "welcome back. 0 tasks resumed" when they tried to come back.

### Flagged as alarming (fix nothing — but these need decisions)

1. **A daily medication reminder silently stopped on 2026-04-22 and the user has never been told.** Independent of the sell/agent/mothball decision, this person should be contacted. 97 days.
2. **A live Stripe secret key sits in plaintext at `~/Documents/hauscope/.env.vercel.local`** and grants read access to the entire Useful For Humans account — 65 customers, £10,388 of charges. Portfolio-wide exposure from one unencrypted laptop file.
3. **Twilio credentials are readable in plaintext** from Supabase's auth config via any Supabase CLI session.
4. **Dashboard auth bypass, verified live** — an unsigned `again_phone` cookie is the only credential; any known phone number returns that user's data.
5. **`/api/tasks/action` is completely unauthenticated, verified live** — no cookie, no session, no ownership check; a bare task UUID mutates that task. Only UUID entropy stands between an attacker and another user's reminders.
6. **The inbound SMS webhook is unauthenticated** — anyone can delete another user's tasks by POSTing a spoofed `From`.
7. **No privacy policy, no terms, no consent records** for a service holding UK phone numbers and a medication-adherence history. `/privacy` and `/terms` are live 404s.
8. **Texting `CANCEL` deletes a task instead of opting the user out**, and `UNSUBSCRIBE`/`QUIT`/`END` return "text ADD to create a task." Whether this is a live breach depends on Twilio Advanced Opt-Out, which could not be verified.

---

*Audit performed read-only. No application code, data, or configuration was modified. Three live probes were made against production, none of which touched real user data: an unauthenticated `GET /api/dashboard`; the same with a forged cookie for a deliberately non-existent phone number; and a `POST /api/tasks/action` against the all-zeroes UUID. Secrets discovered during the audit are described but deliberately not reproduced in this document.*
