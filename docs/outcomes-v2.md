# Outcomes — One Pager (v2)

**Framing:** every outcome describes what happened to the **customer**. Two axes:

1. **Terminal vs Non-terminal** — does the agent stop talking? Drives LLM behavior.
2. **Tier 1 vs Tier 2** (non-terminal only) — how warm is the signal. Drives override rule and UI priority.

One customer = one current lead-level outcome per campaign run, plus a per-task outcome on each conversation.

**Why customer-first:** a dealer asks "what happened to my 342 customers?" — not "how many SMS did we send?" Outcomes must answer that directly.

**Domains:** there are two — **Sales** (any commercial-intent campaign: cold prospect, re-activation, lease maturity, walk-in follow-up) and **Service** (existing customers returning to the bay). "Warm Lead" is **not** a domain — it's a derived dashboard state defined in [Analytics](#analytics).

**Document layout:**
- [Rules](#rules) — naming, override, cross-domain, channel
- [Outcomes Catalog](#outcomes-catalog) — Sales + Service enums
- [Analytics](#analytics) — buckets, math, metrics, worked example, QA
- [UI](#ui) — shared rendering rules and color reference
- [Appendix](#appendix) — changes from v1

---

# Rules

## Naming

Every outcome is **1–3 words**. No slashes, no hyphens, no connector words (*and*, *or*, *to*, *of*, *the*, *no*, *not*). If a concept needs more than 3 words, it's two concepts — split or drop it.

## Hallucination guard

```
The outcome enum is CLOSED. The classifier MUST pick a value from this
document — it may not invent, rename, or free-text an outcome.
```

- The AI never emits a label not in this file. Validation happens at the tool boundary with a strict enum; any out-of-enum value is rejected.
- Adding a new outcome is a doc change first. The enum is sourced from this file — no code-side additions without editing here.
- Terminal outcomes require explicit, unambiguous signal (tool-call confirmation for `Appointment`, `Test Drive Booked`, `Deposit Placed`, `Purchase Closed`, `Service Appointment Booked`; direct customer statement for negatives like `Not Interested`, `Do Not Call`). Low-confidence guesses stay non-terminal.

When no outcome clearly matches, fall back to the safe default for the **current domain**:

| Situation | Sales fallback | Service fallback |
|---|---|---|
| Non-terminal, some engagement | `General Engagement` | `General Inquiry` |
| Call had no meaningful exchange | `Call Aborted` | `Call Aborted` |
| SMS sent, no reply | `No Response` | `No Response` |
| Agent stuck, safety/uncertainty exit | `Agent Fallback` | `Agent Fallback` |
| Customer raised an out-of-domain need | `Routing Mismatch` | `Routing Mismatch` |

## Override rule

```
Terminal outcomes are absorbing. Once terminal, no later signal downgrades.
Tier 2 overwrites Tier 1. Tier 1 never overwrites Tier 2 or Terminal.
Same-tier writes replace each other (latest wins) EXCEPT for terminal,
where the first terminal wins unless a later terminal in the SAME FAMILY
arrives — then the later one upgrades.
```

### Family graph (terminal upgrades only)

Only the chains below allow a later terminal to overwrite an earlier one. All other terminals are absorbing on first write.

**Sales commercial family**
```
Qualified  →  Test Drive Booked  →  Appointment  →  Deposit Placed  →  Purchase Closed
```
Each step is a strict upgrade.

**Service positive family**
```
Walk In Committed  →  Service Appointment Booked
Already Booked  (parallel — never upgrades or gets upgraded)
Appointment Rescheduled  (modifies Service Appointment Booked in place)
Appointment Cancelled  (downgrades Service Appointment Booked — explicit exception
                       to "first terminal wins" because it's a customer-initiated
                       reversal, not a downgrade by signal noise)
```

**Negative families:** none. The first negative terminal wins. A later positive does **not** override a prior negative — that's a fresh lead conversation, not an upgrade.

### Lead-level vs task-level

- **Task-level outcome** — the outcome of that single conversation. Any tier. Freely updates per task.
- **Lead-level outcome** — the highest state the lead has ever reached, following the override rule. This is what the campaign table shows.

Operational task states (everything in the **Not Connected** bucket) are **task-level only** — they never become a lead outcome.

## Cross-campaign carry-forward

| Outcome | Carries to future campaigns? |
|---|---|
| `Wrong Number`, `Number Disconnected` | **Yes** — global suppression on that phone |
| `Do Not Call`, `Opt Out`, `Do Not Contact Requested` | **Yes** — global suppression on that lead |
| `Deceased` | **Yes** — global suppression |
| All other terminals | No — fresh start on re-enrollment |

## Cross-domain rule

Outcomes never cross domains. A sales lead who asks about service is a **bot routing failure** — the bot should say it can't help with that and offer a transfer. The conversation is recorded with the task-level `Routing Mismatch` outcome so misrouted intent is visible in analytics. The lead-level outcome is unchanged unless the customer also gave an in-domain signal.

## Channel applicability

Task-level outcomes are channel-specific. The classifier must only emit outcomes valid for the channel it's running in.

| Outcome | Call | SMS |
|---|---|---|
| `Voicemail`, `No Answer`, `Call Disconnected`, `Call Aborted`, `Recording Declined`, `Third Party Answered` | ✓ | — |
| `No Response`, `Delivery Failed` | — | ✓ |
| `Routing Mismatch`, `Agent Fallback` | ✓ | ✓ |

All L1, L2, L3 outcomes are channel-agnostic — the same lead-level outcome can be reached over either channel.

---

# Outcomes Catalog

## Sales

Goal: understand what the customer wants and push them toward the next commercial step. Applies to cold prospects, re-activation leads, lease-maturity outreach, and walk-in follow-up.

### L1 — Terminal States (sticky — agent stops)

#### Positive Resolution

| Outcome | Trigger | Badge |
|---|---|---|
| **Test Drive Booked** | Customer confirmed a test-drive slot (tool-call confirmed) | Green Calendar |
| **Appointment** | Customer confirmed an in-person sales visit (tool-call confirmed) | Green Calendar |
| **Deposit Placed** | Customer placed a hold or deposit on a unit | Green Calendar |
| **Purchase Closed** | Customer signed or completed purchase | Green Calendar |
| **Human Transferred** | AI escalated to a live agent | Violet |

#### Permanent Disqualification

| Outcome | Trigger | Badge |
|---|---|---|
| **Not Interested** | Customer explicitly said not in-market | Red |
| **Already Purchased** | Customer already bought (from us or a competitor) | Red |
| **Do Not Call** | Customer asked never to be called | Red |
| **Opt Out** | Customer opted out of the campaign or all channels (incl. SMS STOP) | Red |

#### Data Invalidity

| Outcome | Trigger | Badge |
|---|---|---|
| **Wrong Number** | Number does not belong to this lead (human-confirmed) | Red |
| **Number Disconnected** | Number no longer in service | Red |

### L2 — Engagement States (non-terminal · tier 2)

Customer reached, meaningful commercial or timing signal, lead still actionable. **All count as Warm.**

| Outcome | Trigger | Badge |
|---|---|---|
| **Qualified** | Engaged via Tier 2 signal but did not book; ready for human handoff. Tier-2 roll-up at campaign-day exhaustion. | Amber |
| **Pricing Inquiry** | Customer asked for price, quote, or promotions | Amber |
| **Financing Inquiry** | Customer asked about payments, loans, or lease options | Amber |
| **Trade Inquiry** | Customer wants a value for their current vehicle | Emerald |
| **Ancillary Inquiry** | Customer asked about warranty, insurance, or registration help | Sky |
| **Inventory Inquiry** | Customer asked about a specific unit, color, or trim | Cyan |
| **Test Drive Interest** | Customer asked about a test drive but didn't book | Cyan |
| **Comparison Shopping** | Customer named a competitor model or quote actively | Yellow |
| **Buying Later** | Customer ready, but timing is months out — defer with date | Yellow |
| **Decision Stalled** | Waiting on spouse, financing, or trade liquidation | Yellow |
| **Lease Ending** | Current lease maturity is the buying trigger | Emerald |
| **Vehicle Damaged** | Current car needs replacement urgently | Emerald |
| **Callback Scheduled** | Customer agreed to a specific callback time | Amber |
| **Human Requested** | Customer asked to speak with a person | Violet |

> `Qualified` is the special L2 outcome that signals "campaign is done, hand to human." It **does not** count as Booked — the lead is still warm and only converts to Booked when the human actually books an appointment.

### L3 — Rest States (non-terminal · tier 1)

| Outcome | Trigger | Badge | Warm? |
|---|---|---|---|
| **Vehicle Inquiry** | Customer asked about specs, availability, or inventory | Blue Car | ✓ |
| **Reconnect Needed** | Customer asked to be called back at a better time | Amber | ✓ |
| **General Engagement** | Engaged but no specific intent surfaced | Indigo | ✓ |
| **Operating Hours** | Customer asked when or where | Slate | — |
| **Language Barrier** | Engaged but couldn't communicate in a supported language | Slate | — |
| **Decision Maker Unavailable** | Reached someone other than the lead | Slate | — |

### Not Connected — Task-Level Only

| Outcome | Channel | Trigger |
|---|---|---|
| **Voicemail** | Call | Call went to voicemail |
| **No Answer** | Call | Call rang through without pickup |
| **Call Disconnected** | Call | Call dropped mid-conversation |
| **Call Aborted** | Call | Call never completed a meaningful exchange |
| **Recording Declined** | Call | Customer declined the recording disclosure |
| **Third Party Answered** | Call | Someone other than the lead picked up |
| **No Response** | SMS | SMS sent, no reply in the wait window |
| **Delivery Failed** | SMS | Carrier block, invalid number, landline, or provider rejection |
| **Routing Mismatch** | Both | Customer raised out-of-domain need |
| **Agent Fallback** | Both | Agent exited on safety/uncertainty without customer signal |

## Service

Goal: get the customer back into the service bay.

### L1 — Terminal States (sticky — agent stops)

#### Positive Resolution

| Outcome | Trigger | Badge |
|---|---|---|
| **Service Appointment Booked** | Customer confirmed a new service appointment (tool-call confirmed) | Green Calendar |
| **Appointment Rescheduled** | Existing appointment moved to a new slot | Green Calendar |
| **Appointment Cancelled** | Existing appointment cancelled — CRM takes over | Slate |
| **Already Booked** | Customer had scheduled independently before outreach | Green Calendar |
| **Walk In Committed** | Customer committed to a walk-in visit | Green Calendar |
| **Human Transferred** | AI escalated to a live service advisor | Violet |

#### Permanent Disqualification

| Outcome | Trigger | Badge |
|---|---|---|
| **Permanently Declined** | Definitive, explicit refusal — will not return | Red |
| **Do Not Contact Requested** | Customer explicitly opted out (incl. SMS STOP) | Red |
| **Already Serviced** | Customer already had this service done elsewhere | Red |
| **Using Competitor** | Definitive switch, no openness to return | Red |
| **Vehicle Released** | Vehicle no longer with customer (sold, traded, totaled) | Red |
| **Relocated** | Moved outside serviceable area permanently | Red |
| **Deceased** | Confirmed — lead to be archived | Red |

#### Data Invalidity

| Outcome | Trigger | Badge |
|---|---|---|
| **Wrong Number** | Number does not belong to intended customer | Red |
| **Number Disconnected** | Number no longer in service | Red |
| **Duplicate Lead** | Same customer active in another campaign | Red |

### L2 — Engagement States (non-terminal · tier 2)

Customer reached, meaningful interaction, lead still actionable. **All count as Warm.**

| Outcome | Trigger | Badge |
|---|---|---|
| **Callback Requested** | Customer asked to be reached at a specific time | Amber |
| **No Slots Available** | Customer willing to book but no slot was available | Amber |
| **Dropoff Discussed** | Customer engaged with drop-off logistics | Teal |
| **Pickup Discussed** | Customer engaged with pickup logistics | Teal |
| **Loaner Discussed** | Customer engaged with loaner vehicle info | Teal |
| **Recall Discussed** | Substantive exchange about a recall or safety notice | Sky |
| **Warranty Discussed** | Customer engaged on warranty coverage details | Sky |
| **Package Discussed** | Customer engaged on service packages or plans | Sky |
| **Price Estimate** | Pricing discussion held — purchase consideration | Cyan |
| **Parts Discussed** | Customer engaged on specific part availability | Cyan |
| **Considering** | Interest expressed, customer needs time | Yellow |
| **Open Return** | Uses competitor but expressed openness to return | Yellow |

### L3 — Rest States (non-terminal · tier 1)

| Outcome | Trigger | Badge | Warm? |
|---|---|---|---|
| **Soft Decline** | Customer said "not right now" — soft no, no permanence | Slate | ✓ |
| **Busy Indefinite** | Customer busy, no specific callback time given | Slate | ✓ |
| **General Inquiry** | Generic info exchanged, no service intent surfaced | Indigo | ✓ |
| **Operating Hours** | Only logistical info shared | Slate | — |
| **Location Inquiry** | Only directional info shared | Slate | — |
| **Inconclusive** | Conversation started but fizzled without outcome | Slate | — |
| **Language Barrier** | Customer answered but communication could not be established | Slate | — |

### Not Connected — Task-Level Only

| Outcome | Channel | Trigger |
|---|---|---|
| **Voicemail** | Call | Routed to voicemail (with or without message) |
| **No Answer** | Call | Call rang through without pickup |
| **Call Disconnected** | Call | Call picked up but dropped before interaction |
| **Call Aborted** | Call | Call ended before connecting |
| **Recording Declined** | Call | Customer declined the recording disclosure |
| **Third Party Answered** | Call | Someone other than intended customer picked up |
| **No Response** | SMS | SMS delivered, no reply from customer |
| **Delivery Failed** | SMS | SMS failed to deliver |
| **Routing Mismatch** | Both | Customer raised out-of-domain need |
| **Agent Fallback** | Both | Agent exited on safety/uncertainty |

---

# Analytics

This is how outcomes roll up into the campaign dashboard. The model is bucket-based: every enrolled lead sits in **exactly one bucket** at any moment, derived from its current lead-level outcome.

## 1 · Lead State Buckets

| Bucket | Plain definition | Behavior |
|---|---|---|
| **Not Reached** | No customer-side signal yet. Calls hit voicemail, SMS unanswered, dial failed. | Lead has only task-level "Not Connected" entries. Eligible for retry. |
| **Engaged** | Customer responded — replied to SMS or had a real exchange on a call. | Any L1/L2/L3 outcome is set. Sum of Warm + Booked + Disqualified + Other Engaged. |
| **Warm** | Engaged, **not booked**, **not disqualified**, showed positive signal: interested, in-market, or wanted to reschedule. | Lead-level outcome is in the Warm set (see [§3](#3--outcome--bucket-mapping)). Eligible for nurture / retarget. |
| **Booked** | Customer is locked into an appointment / test drive / deposit / purchase. | Lead-level outcome is in the Booked set. Campaign success. |
| **Disqualified** | Engaged, but lead is permanently dead or invalid. | Permanent Disqualification + Data Invalidity terminals. Suppress from future contact. |
| **Other Engaged** | Engaged but with logistical-only signal (asked for hours, language barrier, wrong contact). | L3 outcomes outside the Warm set. Treat as noise — do not retarget, do not count as warm. |

## 2 · Bucket Math

```
ENROLLED       = NOT_REACHED + ENGAGED
ENGAGED        = WARM + BOOKED + DISQUALIFIED + OTHER_ENGAGED
WARM           = ENGAGED − BOOKED − DISQUALIFIED − OTHER_ENGAGED
```

**Invariants** (the dashboard query should assert these):
1. Every lead belongs to exactly one bucket. No double-counting, no gaps.
2. `WARM ≤ ENGAGED − BOOKED` — if the inequality is loose (a lot of slack), DISQUALIFIED is being undercounted.
3. `BOOKED + DISQUALIFIED` is monotonic per-campaign-run — terminals only flow in.
4. A lead in NOT_REACHED has zero L1/L2/L3 outcomes. A lead with any L1/L2/L3 is by definition ENGAGED.

## 3 · Outcome → Bucket Mapping

Membership of each lead-level outcome in each bucket. The classifier emits the outcome; the bucket is derived.

### Sales

| Outcome | Bucket |
|---|---|
| `Test Drive Booked`, `Appointment`, `Deposit Placed`, `Purchase Closed` | **Booked** |
| `Human Transferred` | **Booked** if transfer led to commit; **Warm** otherwise (see note below) |
| `Not Interested`, `Already Purchased`, `Do Not Call`, `Opt Out`, `Wrong Number`, `Number Disconnected` | **Disqualified** |
| `Qualified`, `Pricing Inquiry`, `Financing Inquiry`, `Trade Inquiry`, `Ancillary Inquiry`, `Inventory Inquiry`, `Test Drive Interest`, `Comparison Shopping`, `Buying Later`, `Decision Stalled`, `Lease Ending`, `Vehicle Damaged`, `Callback Scheduled`, `Human Requested` | **Warm** (all L2) |
| `Vehicle Inquiry`, `Reconnect Needed`, `General Engagement` | **Warm** (commercial L3) |
| `Operating Hours`, `Language Barrier`, `Decision Maker Unavailable` | **Other Engaged** |
| (no L1/L2/L3 outcome — only task-level) | **Not Reached** |

### Service

| Outcome | Bucket |
|---|---|
| `Service Appointment Booked`, `Appointment Rescheduled`, `Already Booked`, `Walk In Committed` | **Booked** |
| `Human Transferred` | **Booked** if transfer led to commit; **Warm** otherwise |
| `Appointment Cancelled` | **Disqualified** (CRM takeover; campaign is done) |
| `Permanently Declined`, `Do Not Contact Requested`, `Already Serviced`, `Using Competitor`, `Vehicle Released`, `Relocated`, `Deceased`, `Wrong Number`, `Number Disconnected`, `Duplicate Lead` | **Disqualified** |
| `Callback Requested`, `No Slots Available`, `Dropoff Discussed`, `Pickup Discussed`, `Loaner Discussed`, `Recall Discussed`, `Warranty Discussed`, `Package Discussed`, `Price Estimate`, `Parts Discussed`, `Considering`, `Open Return` | **Warm** (all L2) |
| `Soft Decline`, `Busy Indefinite`, `General Inquiry` | **Warm** (commercial L3) |
| `Operating Hours`, `Location Inquiry`, `Inconclusive`, `Language Barrier` | **Other Engaged** |
| (no L1/L2/L3 outcome — only task-level) | **Not Reached** |

> **`Human Transferred` placement.** It's a placeholder until the human acts. If the human books the appointment within the same conversation context, the lead-level outcome is upgraded to a Booked terminal (`Appointment` / `Service Appointment Booked` / `Test Drive Booked`). If the transfer was for a non-commit reason (general question, complaint), the lead stays in Warm with the transfer reason captured task-level. Pragmatically: count `Human Transferred` as Warm for the dashboard until upgraded — it gives a more conservative WARM number and avoids double-promising the bay.

## 4 · Dashboard Cards

The five cards on the campaign view, with their formulas:

| Card | Value | Subtitle | Formula |
|---|---|---|---|
| **Total Enrolled** | count | SMS + Call | `ENROLLED` |
| **Engaged** | count | Replies + Connected | `ENGAGED` |
| **Warm Leads #** | count | Engaged, not booked, positive signal | `ENGAGED − BOOKED − DISQUALIFIED − OTHER_ENGAGED` |
| **Appt. Booked** | count | Across all channels | `BOOKED` |
| **Overall** | % | Booked / Enrolled | `BOOKED / ENROLLED` |

> **The bug in the current dashboard:** Warm Leads # is computed as `ENGAGED − BOOKED`, which silently lumps every Disqualified and Other-Engaged lead into the warm count. Fix the query to subtract both — the underlying outcome data is already correct, only the rollup is wrong.

## 5 · Reporting Metrics

KPIs for both domains, in one place. Every rate is over `ENROLLED` unless stated.

### Funnel (both domains)

| Metric | Formula | What it measures |
|---|---|---|
| **No-Reach Rate** | `NOT_REACHED / ENROLLED` | How much of the list we never touched. High → contactability problem (data quality, send timing). |
| **Engagement Rate** | `ENGAGED / ENROLLED` | How much of the list responded. Top-of-funnel health. |
| **Warm Rate** | `WARM / ENROLLED` | How much of the list is actively in play but unbooked. The retarget pool. |
| **Conversion Rate** | `BOOKED / ENROLLED` | Final goal. Sales calls this Conversion Rate, Service calls it Booking Rate — same formula. |
| **Suppression Rate** | `DISQUALIFIED / ENROLLED` | How much we permanently lose. High → bad list, bad targeting, or aggressive messaging. |

### Sales-only

| Metric | Formula | What it measures |
|---|---|---|
| **Qualified Rate** | `Qualified / ENROLLED` | Tier-2 roll-up at day exhaustion. Hand-off volume to the sales team. |
| **High Intent Rate** | `(All Sales L2) / ENROLLED` | Composite share of all Tier-2 commercial signals. |
| **Test Drive Rate** | `Test Drive Booked / ENROLLED` | Pre-purchase commit rate. |

### Service-only

| Metric | Formula | What it measures |
|---|---|---|
| **Walk-In Rate** | `Walk In Committed / ENROLLED` | Soft-commit volume vs hard appointments. |
| **Reschedule Rate** | `Appointment Rescheduled / ENROLLED` | Friction signal — slot availability, confirmation cadence. |
| **Human Load** | `Human Transferred / ENROLLED` | Live-advisor demand created by the campaign. |

### Task-level (operational health)

These are over `tasks attempted`, not over leads.

| Metric | Formula | What it measures |
|---|---|---|
| **Connect Rate** | `(tasks with any L1/L2/L3) / tasks attempted` | Per-attempt contact success. |
| **Voicemail Rate** | `Voicemail / call tasks attempted` | Call-side dial-time health. |
| **Delivery Failure Rate** | `Delivery Failed / SMS tasks attempted` | SMS-side data quality (carrier, landline, invalid). |
| **Recording-Decline Rate** | `Recording Declined / call tasks attempted` | Disclosure friction. |
| **Routing-Mismatch Rate** | `Routing Mismatch / tasks attempted` | How often the campaign hits the wrong domain — bot routing problem. |
| **Agent-Fallback Rate** | `Agent Fallback / tasks attempted` | How often the AI bails out. Quality signal for the model / prompt. |

## 6 · Worked Example

Using the campaign in the screenshot:

```
Total Enrolled  : 589
Engaged         : 273  (replies + connected)
Appt. Booked    : 79
Overall %       : 79 / 589 = 13.4%
```

The current card shows `WARM = 273 − 79 = 194`. To validate, expand the engaged column by bucket. Suppose the outcome breakdown of the 273 engaged is:

```
Booked          : 79     (Appointment + Test Drive Booked + Deposit Placed + Purchase Closed)
Disqualified    : 35     (Not Interested + Do Not Call + Opt Out + Wrong Number + ...)
Other Engaged   : 12     (Operating Hours + Language Barrier + Decision Maker Unavailable)
Warm            : 273 − 79 − 35 − 12 = 147
```

Corrected dashboard:

| Card | Old (broken) | New (fixed) |
|---|---|---|
| Total Enrolled | 589 | 589 |
| Engaged | 273 | 273 |
| **Warm Leads #** | **194** | **147** |
| Appt. Booked | 79 | 79 |
| Overall | 13% | 13% |

The 47-lead difference (194 → 147) is exactly the Disqualified + Other Engaged that shouldn't have been counted. The actionable retarget pool is 147, not 194 — the old card was inflating it by ~32%.

## 7 · Data Quality Checks

Run these as dashboard sanity assertions. Failure = bug in the rollup query, not in the outcomes.

| Check | Expected | If it fails |
|---|---|---|
| `ENROLLED == NOT_REACHED + ENGAGED` | always true | A lead is in two buckets — fix the partitioning query. |
| `ENGAGED == WARM + BOOKED + DISQUALIFIED + OTHER_ENGAGED` | always true | Outcome→bucket mapping has a gap; some outcome isn't classified. |
| `WARM ≤ ENGAGED − BOOKED` | always true | Negative warm count — bucket math is inverted somewhere. |
| `WARM / ENGAGED < 90%` | typically true on healthy lists | If exceeded, DISQUALIFIED is probably not being subtracted (the v1 bug). |
| `BOOKED` is non-decreasing within a campaign run | always true | A booked terminal got overwritten — override rule violated. |
| Every outcome in the catalog appears in the bucket-mapping table | always true | New outcome added without updating the rollup — out-of-enum risk. |
| Sum of (per-domain reporting metrics) ≤ 100% where mutually exclusive | always true | Double-counting across buckets. |

---

# UI

## Shared UI rules

- Outcome pill uses the color and icon from the enum, never free text.
- `Appointment`, `Test Drive Booked`, and `Service Appointment Booked` render **green with a Calendar icon** — consistent committed signal.
- Negative terminal outcomes render **red** — operator can filter them out of active views.
- Task-level-only outcomes (the entire **Not Connected** bucket) appear on the task row only, never in the lead's Outcome column.
- CSV export emits the outcome label exactly as written in the enum.
- On re-enrollment in a future campaign, the previous outcome is preserved on its run and not overwritten — except for cross-campaign suppression outcomes (see [Cross-campaign carry-forward](#cross-campaign-carry-forward)), which block re-enrollment outright.
- Dashboard cards follow the formulas in [§4](#4--dashboard-cards). Specifically: `Warm Leads # = Engaged − Booked − Disqualified − OtherEngaged`, **not** `Engaged − Booked`.

## Badge & color reference

| Badge | Used for |
|---|---|
| **Green Calendar** | Committed positive terminals (`Appointment`, `Test Drive Booked`, `Deposit Placed`, `Purchase Closed`, `Service Appointment Booked`, `Walk In Committed`, `Already Booked`, `Appointment Rescheduled`) |
| **Red** | All Permanent Disqualification + Data Invalidity terminals |
| **Violet** | `Human Transferred`, `Human Requested` (human-loop signals) |
| **Amber** | High-intent or callback-near signals (`Qualified`, `Pricing Inquiry`, `Financing Inquiry`, `Callback Scheduled`, `Reconnect Needed`, `Callback Requested`, `No Slots Available`) |
| **Emerald** | Trade / lease / urgency commercial signals (`Trade Inquiry`, `Lease Ending`, `Vehicle Damaged`) |
| **Cyan** | Specific inquiry signals (`Inventory Inquiry`, `Test Drive Interest`, `Price Estimate`, `Parts Discussed`) |
| **Sky** | Information-share signals (`Ancillary Inquiry`, `Recall Discussed`, `Warranty Discussed`, `Package Discussed`) |
| **Teal** | Service logistics signals (`Dropoff Discussed`, `Pickup Discussed`, `Loaner Discussed`) |
| **Yellow** | Soft-yes / time-deferred signals (`Comparison Shopping`, `Buying Later`, `Decision Stalled`, `Considering`, `Open Return`) |
| **Blue Car** | `Vehicle Inquiry` |
| **Indigo** | Generic engagement (`General Engagement`, `General Inquiry`) |
| **Slate** | Logistical / inconclusive (`Operating Hours`, `Language Barrier`, `Decision Maker Unavailable`, `Soft Decline`, `Busy Indefinite`, `Inconclusive`, `Location Inquiry`, `Appointment Cancelled`) |

---

# Appendix

## Changes from v1

1. **Restructured into Rules → Catalog → Analytics → UI.** Reporting/metrics were scattered in v1; now consolidated into one Analytics section with bucket model, formulas, mapping tables, worked example, and data-quality checks.
2. **Warm Lead is now a derived dashboard state, not a campaign domain.** Outcome list is in [Outcome → Bucket Mapping](#3--outcome--bucket-mapping).
3. **Fixed the Warm Leads dashboard formula.** Was `Engaged − Booked` (silently counts disqualified leads as warm). Now `Engaged − Booked − Disqualified − OtherEngaged`. Worked example shows the 194 → 147 correction.
4. Added `Qualified` (Sales L2, Amber) — Tier-2 roll-up at campaign-day exhaustion. Counts as Warm, not Booked.
5. Added `Delivery Failed` (task-level, both domains) per the PRD diff.
6. Reintroduced **Sales L2** as non-terminal (Tier 2 commercial inquiries moved out of L1).
7. Expanded Sales L2 with timing- and re-activation-relevant outcomes: `Inventory Inquiry`, `Test Drive Interest`, `Comparison Shopping`, `Buying Later`, `Decision Stalled`, `Lease Ending`, `Vehicle Damaged`, `Callback Scheduled`. Added `Test Drive Booked` to Sales L1 positive.
8. Added `Routing Mismatch` (cross-domain misroute) and `Agent Fallback` (safety/uncertainty exit) as task-level outcomes in both domains.
9. Added `Recording Declined` to Service task-level (was Sales-only in v1).
10. Hallucination-guard fallbacks now defined per domain — Service was previously uncovered.
11. Override rule extended with an explicit family graph and a cross-campaign carry-forward table. `Appointment Cancelled` documented as an explicit downgrade exception.
12. `Human Transferred` is now consistently terminal-positive across both domains (was non-terminal under Service in v1 as `Transferred To Service Team`). Bucket placement clarified — counts as Warm until upgraded by a follow-up booking.
13. Renamed Service outcomes to satisfy the 1–3 word naming rule:
    `Customer Already Self Booked` → `Already Booked`,
    `Customer Permanently Declined` → `Permanently Declined`,
    `Customer Permanently Using Competitor` → `Using Competitor`,
    `Customer No Longer Owns Vehicle` + `Vehicle Sold Or Traded` + `Vehicle Written Off` → consolidated to `Vehicle Released`,
    `Customer Relocated` → `Relocated`,
    `Customer Deceased` → `Deceased`,
    `Service Package Information Shared` → `Package Discussed`,
    `Drop Off Details Shared` → `Dropoff Discussed`,
    `Pickup Details Shared` → `Pickup Discussed`,
    `Loaner Details Shared` → `Loaner Discussed`,
    `Recall Information Shared` → `Recall Discussed`,
    `Warranty Information Shared` → `Warranty Discussed`,
    `Price Estimate Shared` → `Price Estimate`,
    `Parts Availability Discussed` → `Parts Discussed`,
    `Customer Considering` → `Considering`,
    `Customer Open To Return` → `Open Return`,
    `Customer Busy No Callback` → `Busy Indefinite`,
    `Could Not Conclude` → `Inconclusive`,
    `General Information Shared` → `General Inquiry`,
    `Location Shared` → `Location Inquiry`,
    `Operating Hours Shared` → `Operating Hours`,
    `Voicemail Left` → `Voicemail`,
    `SMS Delivered No Response` → `No Response`,
    `SMS Undelivered` → `Delivery Failed`.
14. Added `Already Serviced` to Service Permanent Disqualification (referenced in v1 UI rules but never defined).
15. Added **Channel applicability** table so the classifier hard-filters task-level outcomes by channel.
16. Added **Badge & color reference** (consolidated UI swatch list).
