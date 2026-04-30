# Outcomes — One Pager

**Framing:** every outcome describes what happened to the **customer**. Two axes:

1. **Terminal vs Non-terminal** — does the agent stop talking? Drives LLM behavior.
2. **Tier 1 vs Tier 2** (non-terminal only) — how warm is the signal. Drives override rule and UI priority.

One customer = one current lead-level outcome per campaign run, plus a per-task outcome on each conversation.

**Why customer-first:** a dealer asks "what happened to my 342 customers?" — not "how many SMS did we send?" Outcomes must answer that directly.

**Naming rule:** every outcome is 1–3 words. No slashes, no hyphens, no connector words. If a concept needs more than 3 words to name, it's two concepts — split or drop it.

---

## Hallucination guard

```
The outcome enum is CLOSED. The classifier MUST pick a value from this
document — it may not invent, rename, or free-text an outcome.
```

- The AI never emits a label not in this file. Validation happens at the tool boundary with a strict enum; any out-of-enum value is rejected.
- When no outcome clearly matches, fall back to the safe default for the state:
  - **Non-terminal, some engagement:** `General Engagement`
  - **Call had no meaningful exchange:** `Call Aborted` (task-level)
  - **SMS sent, no reply:** `No Response` (task-level)
- Terminal outcomes require explicit, unambiguous signal (tool-call confirmation for `Appointment`, `Deposit Placed`, `Purchase Closed`; direct customer statement for negatives like `Not Interested`, `Do Not Call`). Low-confidence guesses stay non-terminal.
- Adding a new outcome is a doc change first. The enum is sourced from this file — no code-side additions without editing here.

---

## Override rule

```
Terminal outcomes are absorbing. Once terminal, no later signal downgrades.
Tier 2 overwrites Tier 1. Tier 1 never overwrites Tier 2 or Terminal.
Same-tier writes replace each other (latest wins) EXCEPT for terminal,
where the first terminal wins unless a more specific terminal in the same
family arrives (e.g. Appointment → Deposit Placed → Purchase Closed).
```

Practical consequence: a lead that booked an appointment (terminal) and later sent an SMS asking about hours (tier 1) **stays** at `Appointment`. The tier 1 signal is recorded on that task, not on the lead.

### Lead-level vs task-level

- **Task-level outcome** — the outcome of that single conversation. Any tier. Freely updates per task.
- **Lead-level outcome** — the highest state the lead has ever reached, following the override rule. This is what the campaign table shows.

Operational task states (`Voicemail`, `Call Disconnected`, `Call Aborted`, `No Response`) are **task-level only** — they never become a lead outcome.

---

## Sales

Goal: understand what the customer wants and push them toward the next commercial step.

### L1 — Terminal States (sticky — agent stops)

Lead is fully resolved. Campaign ownership ends.

#### Positive Resolution

| Outcome | Trigger | Badge |
|---|---|---|
| **Appointment** | Customer confirmed an in-person visit — test drive, sit-down, or showroom walk-in (tool call confirmed) | Green Calendar |
| **Deposit Placed** | Customer placed a hold or deposit on a unit | Green Calendar |
| **Purchase Closed** | Customer signed or completed purchase | Green Calendar |
| **Human Transferred** | AI escalated to a live agent | Violet |

#### Commercial Interest (temporarily terminal)

> **Status:** these outcomes belong in L2 Engagement and will move there when tier 2 is reintroduced as non-terminal. For now they are treated as terminal.

| Outcome | Trigger | Badge |
|---|---|---|
| **Pricing Inquiry** | Customer asked for price, quote, or promotions | Amber |
| **Financing Inquiry** | Customer asked about payments, loans, or lease options | Amber |
| **Trade Inquiry** | Customer wants a value for their current vehicle | Emerald |
| **Ancillary Inquiry** | Customer asked about warranty, insurance, or registration help | Sky |
| **Human Requested** | Customer asked to speak with a person or be called back | Violet |

#### Permanent Disqualification

| Outcome | Trigger | Badge |
|---|---|---|
| **Not Interested** | Customer explicitly said not in-market | Red |
| **Already Purchased** | Customer already bought from a competitor | Red |
| **Do Not Call** | Customer asked never to be called | Red |
| **Opt Out** | Customer opted out of the campaign or all channels | Red |

#### Data Invalidity

| Outcome | Trigger | Badge |
|---|---|---|
| **Wrong Number** | Number does not belong to this lead | Red |

### L2 — Engagement States (non-terminal · tier 2)

Customer reached, meaningful interaction occurred, lead still actionable.

> **Status:** currently empty — Sales tier 2 outcomes are temporarily routed to L1 (see "Commercial Interest" above). Will be reintroduced here.

### L3 — Rest States (non-terminal · tier 1)

Customer reached, shallow interaction, no commitment, no clear next step.

| Outcome | Trigger | Badge |
|---|---|---|
| **Vehicle Inquiry** | Customer asked about specs, availability, or inventory | Blue Car |
| **Operating Hours** | Customer asked when or where | Slate |
| **Language Barrier** | Customer engaged but couldn't communicate in a supported language | Slate |
| **Decision Maker Unavailable** | Reached someone other than the lead | Slate |
| **Reconnect Needed** | Customer asked to be called back at a better time (driving, busy, bad time) | Amber |
| **General Engagement** | Engaged but no specific intent surfaced | Indigo |

### Not Connected — Flat Bucket (task-level only)

No contact made. Never overrides any L1, L2, or L3 outcome.

| Outcome | Trigger |
|---|---|
| **Voicemail** | Call went to voicemail |
| **Call Disconnected** | Call dropped mid-conversation |
| **Call Aborted** | Call never completed a meaningful exchange |
| **Recording Declined** | Customer declined the recording disclosure; agent disengaged and offered a human callback |
| **No Response** | SMS sent, no reply in the wait window |

### What we report up

- **Conversion Rate** = `(Appointment + Deposit Placed + Purchase Closed) / Enrolled`
- **High Intent Rate** = `(Pricing Inquiry + Financing Inquiry + Trade Inquiry + Ancillary Inquiry + Human Requested) / Enrolled` (currently in L1 — see Commercial Interest note above)
- **Engagement Rate** = `(L3 + L2 + positive terminal) / Enrolled`
- **Suppression Rate** = `(Opt Out + Do Not Call + Wrong Number) / Enrolled`
- **Waste Rate** = task-level `(Voicemail + Call Aborted + No Response) / tasks attempted`

---

## Service

Goal: get the customer back into the service bay.

### L1 — Terminal States (sticky — agent stops)

Lead is fully resolved. Campaign ownership ends.

#### Positive Resolution

| Outcome | Trigger | Badge |
|---|---|---|
| **Service Appointment Booked** | Customer confirmed a new service appointment | Green Calendar |
| **Appointment Rescheduled** | Existing appointment moved to a new slot | Green Calendar |
| **Appointment Cancelled** | Existing appointment cancelled — CRM takes over | Slate |
| **Customer Already Self Booked** | Customer had scheduled independently before outreach | Green Calendar |
| **Walk In Committed** | Customer committed to a walk-in visit | Green Calendar |

#### Permanent Disqualification

| Outcome | Trigger | Badge |
|---|---|---|
| **Customer Permanently Declined** | Definitive, explicit refusal — will not return | Red |
| **Do Not Contact Requested** | Customer explicitly opted out | Red |
| **Customer Permanently Using Competitor** | Definitive switch, no openness to return | Red |
| **Customer No Longer Owns Vehicle** | Vehicle no longer with customer | Red |
| **Vehicle Sold Or Traded** | Vehicle sold or traded in | Red |
| **Vehicle Written Off** | Vehicle totaled or scrapped | Red |
| **Customer Relocated** | Moved outside serviceable area permanently | Red |
| **Customer Deceased** | Confirmed — lead to be archived | Red |

#### Data Invalidity

| Outcome | Trigger | Badge |
|---|---|---|
| **Wrong Number** | Number does not belong to intended customer | Red |
| **Number Disconnected** | Number no longer in service | Red |
| **Duplicate Lead** | Same customer active in another campaign | Red |

### L2 — Engagement States (non-terminal · tier 2)

Customer reached, meaningful interaction occurred, lead still actionable.

| Outcome | Trigger | Badge |
|---|---|---|
| **Callback Requested** | Customer asked to be reached at a specific time | Amber |
| **No Slots Available** | Customer willing to book but no slot was available | Amber |
| **Transferred To Service Team** | Live handoff to a human service advisor | Violet |
| **Drop Off Details Shared** | Customer engaged with drop-off logistics | Teal |
| **Pickup Details Shared** | Customer engaged with pickup logistics | Teal |
| **Loaner Details Shared** | Customer engaged with loaner vehicle info | Teal |
| **Recall Information Shared** | Substantive exchange about a recall or safety notice | Sky |
| **Warranty Information Shared** | Customer engaged on warranty coverage details | Sky |
| **Service Package Information Shared** | Customer engaged on service packages or plans | Sky |
| **Price Estimate Shared** | Pricing discussion held — purchase consideration | Cyan |
| **Parts Availability Discussed** | Customer engaged on specific part availability | Cyan |
| **Customer Considering** | Interest expressed, customer needs time | Yellow |
| **Customer Open To Return** | Uses competitor but expressed openness | Yellow |

### L3 — Rest States (non-terminal · tier 1)

Customer reached, shallow interaction, no commitment, no clear next step.

| Outcome | Trigger | Badge |
|---|---|---|
| **General Information Shared** | Generic info exchanged, no service intent surfaced | Indigo |
| **Operating Hours Shared** | Only logistical info shared, no intent captured | Slate |
| **Location Shared** | Only directional info shared, no intent captured | Slate |
| **Soft Decline** | Customer said "not right now" — soft no, no permanence | Slate |
| **Customer Busy No Callback** | Customer busy, no specific callback time given | Slate |
| **Could Not Conclude** | Conversation started but fizzled without outcome | Slate |
| **Language Barrier** | Customer answered but communication could not be established | Slate |

### Not Connected — Flat Bucket (task-level only)

No contact made. Never overrides any L1, L2, or L3 outcome.

| Outcome | Trigger |
|---|---|
| **No Answer** | Call rang through without pickup |
| **Voicemail Left** | Routed to voicemail, message left |
| **Call Disconnected** | Call picked up but dropped before interaction |
| **Call Aborted** | Call ended before connecting |
| **Third Party Answered** | Someone other than intended customer picked up |
| **SMS Delivered No Response** | SMS delivered, no reply from customer |
| **SMS Undelivered** | SMS failed to deliver |

### What we report up

- **Booking Rate** = `(Service Appointment Booked + Customer Already Self Booked + Walk In Committed) / Enrolled`
- **Human Load** = `Transferred To Service Team / Enrolled`
- **Suppression Rate** = `(Customer Permanently Declined + Do Not Contact Requested + Wrong Number + Number Disconnected) / Enrolled`
- **Retry Pool** = task-level `(No Answer + Voicemail Left + Call Disconnected + Call Aborted + Third Party Answered + SMS Delivered No Response + SMS Undelivered)`

---

## Cross-domain rule

Outcomes never cross domains. A sales lead who asks about service is a **bot routing failure**, not a valid sales outcome — the bot should say it can't help with service and offer a transfer. We do not surface service outcomes under a sales campaign, or vice versa.

---

## Shared UI rules

- Outcome pill uses the color and icon from the enum, never free text.
- `Appointment` renders **green with a Calendar icon** — consistent committed signal across sales and service.
- Negative terminal outcomes (`Opt Out`, `Do Not Call`, `Wrong Number`, `Not Interested`, `Already Purchased`, `Already Serviced`) render **red** — operator can filter them out of active views.
- Task-level-only outcomes (`Voicemail`, `Call Disconnected`, `Call Aborted`, `Recording Declined`, `No Response`) appear on the task row only, never in the lead's Outcome column.
- CSV export emits the outcome label exactly as written in the enum.
- On re-enrollment in a future campaign, the previous outcome is preserved on its run and not overwritten. A new run starts fresh.
