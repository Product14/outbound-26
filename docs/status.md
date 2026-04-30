# Status — One Pager

**Framing:** status describes *where the customer is right now* in the campaign journey. Outcome is terminal and sticky; **status is live and changes as the conversation progresses**. One customer = one status at any point in time.

**Why it's separate from outcome:** a dealer looking at the live activity table needs to know "what's happening right now with this customer" (ringing, waiting on reply, escalated to a human). Once the journey ends, the outcome takes over as the permanent label — but status is what drives the real-time UI, filters, and alerts.

**Rules that apply across the board:**

- Exactly one status per customer per campaign run, at any given moment.
- Status flows forward through the funnel; it does **not** skip stages (e.g. you can't go `Enrolled → Connected` without passing through `Queued → Live`).
- Every status maps to a color + icon in the UI and a stable enum in the API.
- When a campaign ends, the last status is frozen and the corresponding outcome is written alongside it.
- Terminal statuses (`Completed`, `Failed`) pair with a domain outcome from [outcomes.md](./outcomes.md) — the pair is what gets reported.

---

## Statuses shown in the live activity table

These are the values that appear in the **Status** column of `/results/[id]`. They cover both the journey (live state) and the frozen end-state.


| Status        | When we set it                                                                                        | What it means right now                         | UI badge           |
| ------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------ |
| **Enrolled**  | Customer added to the campaign; no touch sent yet                                                     | Waiting in line for the first outreach          | Gray               |
| **Queued**    | A touch (SMS or call) is scheduled but not yet dispatched; the row shows a `Next call in …` countdown | Scheduler has picked them up                    | Purple (secondary) |
| **Delivered** | SMS sent and confirmed delivered by the carrier                                                       | Message is on the customer's phone              | Gray               |
| **Replied**   | Customer responded to an SMS touch                                                                    | Conversation is active; AI is handling          | Blue               |
| **Live**      | A call is ringing or in progress                                                                      | Phone is live right now — animated pulse        | Indigo (animated)  |
| **Connected** | Call answered by the customer (not voicemail)                                                         | Two-way conversation happening — animated pulse | Green (animated)   |
| **Voicemail** | Call went to voicemail; AI may or may not leave one                                                   | Waiting to see if a callback lands              | Yellow             |
| **Escalated** | AI handed the conversation to a human (intent, objection, explicit request)                           | Needs a sales/service rep now — animated pulse  | Violet (animated)  |
| **Paused**    | Campaign paused (manually or by schedule/DNC-window)                                                  | No touches will fire until resumed              | Gray               |
| **Completed** | All touches exhausted and the conversation has reached a terminal outcome                             | Journey done; see `outcome` for the disposition | Purple (secondary) |
| **Failed**    | Technical failure (bad number, carrier reject, DNC block) before any real engagement                  | Could not deliver; flag to CRM/DMS              | Red + X icon       |


---

## How status pairs with outcome

Status says **where** the customer is; outcome says **why** the journey ended. Most terminal outcomes pair with a specific status:


| Status               | Expected outcomes (from [outcomes.md](./outcomes.md))                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Completed**        | Any business outcome — `Schedule Test Drive`, `Service Appointment Booked`, `General Sales Inquiry`, `Connect with Service Team`, etc. Also `Voicemail` when a voicemail was the last event. |
| **Queued**           | Typically `Follow-Up Required` or a prior-touch outcome while the next retry waits in the queue.                                                                                             |
| **Live / Connected** | No terminal outcome yet — the call is still in progress. Outcome is set the moment the call ends.                                                                                            |
| **Failed**           | `Call Aborted` or `Call Disconnected` — the call never reached a business conclusion.                                                                                                        |


A row in the table can show `completed + Voicemail` (we reached voicemail and the journey ended there) or `completed + Schedule Test Drive` (we booked a test drive and the journey ended there). The status tells you the row is done; the outcome tells you what happened.

---

## Status vs. Outcome — quick cheat sheet


|                | **Status**                            | **Outcome**                                              |
| -------------- | ------------------------------------- | -------------------------------------------------------- |
| When it exists | From enrollment onward                | Only after journey ends (or alongside a terminal status) |
| Mutability     | Changes throughout the run            | Set once; sticky                                         |
| Who reads it   | Live activity table, real-time alerts | Reporting, CSV exports, dealer dashboards                |
| Granularity    | Where in the funnel                   | Why the journey ended                                    |
| Example        | `Queued` with "Next call in 20m"      | `Schedule Test Drive`                                    |


---

## What we report up

- **Active Rate** = `(Delivered + Replied + Live + Connected + Escalated) / Enrolled` — how much of the cohort is currently engaging
- **Escalation Rate** = `Escalated / Enrolled` — human-handoff load on the sales/service floor
- **Queue Pressure** = `Queued / Enrolled` — backlog awaiting the next dispatch window
- **Failure Rate** = `Failed / Enrolled` — telephony/deliverability health
- **Funnel Drop-off** = per-stage count of customers who never advanced past each transient status

---

## Shared UI rules

- In the live activity table: status pill uses the color + icon from the enum, never free text.
- `Live`, `Connected`, and `Escalated` are the only statuses that pulse/animate — everything else is static.
- `Queued` rows render a secondary line under the badge: `Next call in <duration>` (e.g. "Next call in Now", "Next call in 20m").
- `Failed` is the only status that shows a red `X` glyph in the badge — it's the one status that signals a technical dead-end rather than a journey state.
- Filters in the table operate on status (live state) by default; outcome filters are a secondary toggle.
- In CSV/metadata exports: emit both `status` and `outcome` as separate columns — downstream systems should not infer one from the other.
- When a customer re-enrolls in a future campaign, their prior terminal status is preserved on that run; the new run starts fresh at `Enrolled`.

