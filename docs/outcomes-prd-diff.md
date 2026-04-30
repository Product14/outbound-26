# Outcomes — PRD Diff

Comparison of [outcomes.md](outcomes.md) against **PRD: Vini SMS Outbound — Aged Lead Follow-Up** (2026-04-09). Only deltas listed — clean mappings are in the reference table at the bottom.

Sources in the PRD that define outcomes:
- **Outcome Distribution** table (Analytics)
- **Final Outcome** field on Per-Lead Metrics
- **End Conditions** table (Conversation Lifecycle)
- Rule: *"If outcome is met (appointment booked, qualified, opted out), stop all messaging"*

---

## New outcomes to add

### 1. `Qualified` — Sales, terminal

Trigger: customer replied, engaged with Tier 2 commercial signal (pricing / financing / trade / ancillary / human request), campaign exhausted all days without a booking, and lead is being handed to a human salesperson. The PRD treats `qualified` as a campaign-terminating outcome distinct from `Appointment`.

Badge: Amber.

**Why this is new:** the existing taxonomy has specific Tier 2 outcomes (`Pricing Inquiry`, `Financing Inquiry`, `Trade Inquiry`, `Ancillary Inquiry`, `Human Requested`) but they are **non-terminal** — the bot keeps nurturing. The PRD needs a terminal state for "engaged enough that automation stops, handoff to human." Without `Qualified`, an engaged-but-unbooked lead rolls up to one of those non-terminal Tier 2s forever or degrades to `No Response` at day exhaustion — neither reflects reality.

**Override rule placement:** terminal, between `Appointment` and negatives. A later `Appointment` upgrades `Qualified`; `Not Interested` does not downgrade it (first terminal wins per existing rule).

### 2. `Delivery Failed` — task-level, both domains

Trigger: outbound SMS send failed — invalid number, carrier block, landline detected, or provider rejection. Per PRD Outcome Distribution and Errors tab ("Delivery failures (invalid numbers, landlines, carrier blocks)").

**Why this is new:** existing task-level outcomes (`Voicemail`, `Call Disconnected`, `Call Aborted`, `Recording Declined`, `No Response`) are all voice- or reply-oriented. None covers a send-side failure on SMS. `Wrong Number` is terminal and means the human confirmed it's not them — different signal.

**Distinction from `Wrong Number`:** `Delivery Failed` = carrier/number-validity failure, no human touched it. `Wrong Number` = a human said "you've got the wrong person." One is operational, the other is confirmed.

---

## Semantic reconciliations (no new outcome, but behavior to align)

### PRD `qualified` is a campaign stop-condition

The PRD rule *"If outcome is met (appointment booked, qualified, opted out), stop all messaging"* implies `Qualified` halts the sequence. Existing Tier 2 outcomes do not halt anything. Resolution: add `Qualified` as terminal (above), and keep Tier 2 specific inquiries as non-terminal interest signals that feed into `Qualified` at campaign end.

### SMS has no `Voicemail` / `Call Disconnected` / `Recording Declined`

These task-level outcomes are call-only. SMS task-level set is: `Delivery Failed` (new), `No Response`, `Opt Out`. Document this by channel in `outcomes.md` if needed — currently the task-level list is undifferentiated.

### PRD collapses `Do Not Call` into `Opt Out` via the STOP keyword

The PRD treats `STOP` / `UNSUBSCRIBE` / `CANCEL` / `QUIT` / `END` as a single opt-out path that "permanently suppresses from all future SMS." The existing taxonomy separates `Do Not Call` (never call again) from `Opt Out` (channel or campaign). Keep the distinction — SMS STOP maps to `Opt Out`; a voice "don't call me" remains `Do Not Call`. No change needed, but classifier must not conflate.

### PRD intent signal `Appointment readiness` is not an outcome

PRD lists it as an escalation trigger ("I want to come in Saturday"). In the outcomes taxonomy it is captured the moment a booking is made (`Appointment`, terminal) or as `General Engagement` / Tier 2 until then. Do not add an outcome for it — the PRD itself does not promote it to one.

### PRD intent signal `Urgency` is not an outcome

Same treatment — it's an escalation trigger ("I need a car by Friday"), not a lead outcome. Skip.

---

## Reference table — clean mappings (no action)

| PRD term | Existing outcome | Notes |
|---|---|---|
| `Appointment Booked` | `Appointment` (terminal) | Already consolidated across sales/service |
| `Replied, Not Interested` | `Not Interested` (terminal) | "Replied," is descriptive, not a new label |
| `No Reply (all days exhausted)` | `No Response` (task-level) | Rolled up to lead-level only if no higher terminal exists |
| `Opted Out` (via STOP) | `Opt Out` (terminal) | |
| PRD session trigger `customer_reply` | n/a | State-machine trigger, not an outcome |
| PRD session trigger `voicemail_fallback` | `Voicemail` (task) on the call, new SMS conversation begins | |
| PRD session trigger `escalation_call` | n/a | Lifecycle transition |
| PRD session states (`scheduled`, `active`, `waiting_reply`, `escalated_to_call`, `completed`) | n/a | State machine, not outcomes |
| PRD session outcome `inconclusive` | `Call Aborted` (voice) / `No Response` (SMS) | Existing outcomes cover this |
| PRD intent `Customer requests a call` | `Human Requested` (Tier 2) | |
| PRD intent `Price negotiation` | `Pricing Inquiry` (Tier 2) | |
| PRD intent `Trade-in discussion` | `Trade Inquiry` (Tier 2) | |
| PRD intent `Financing questions` | `Financing Inquiry` (Tier 2) | |
| PRD intent `Appointment readiness` | — | Escalation trigger only |
| PRD intent `Urgency` | — | Escalation trigger only |

---

## Suggested edits to `outcomes.md`

1. Add `Qualified` to the **Sales · Terminal** table (Amber badge).
2. Add `Delivery Failed` to both **Task-level only** tables (Sales + Service).
3. Update `Conversion Rate` / `High Intent Rate` formulas to account for `Qualified`:
   - **Qualified Rate** = `Qualified / Enrolled`
   - **High Intent Rate** (existing) remains Tier 2 aggregate — `Qualified` is the terminal roll-up of that pool.
4. Optional: annotate the task-level table to indicate which outcomes apply to which channel (SMS vs Call).
