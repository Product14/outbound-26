# Download — One Pager

**Location:** Campaign → Calls & Analytics → top-right `Download` button.

**Intent:** one click, one archive, everything needed to audit a customer interaction offline (compliance, QA, dispute resolution, leadership review, handing to a dealer).

---

## What the button does

Bundles every artifact tied to the current campaign's customers into a single downloadable archive. No cherry-picking — if we captured it, it ships.

Delivered as a ZIP with:
- `campaign.csv` — one row per customer (master index)
- `transcripts/` — one `.txt` per conversation
- `recordings/` — one `.mp3` per call
- `audio-messages/` — inbound/outbound SMS voice notes (if any)
- `metadata.json` — full structured payload (for programmatic use)
- `README.txt` — field dictionary + generated-at timestamp

---

## What's inside each piece

### `campaign.csv` — customer master
Columns, in order:

| Column | Example |
|---|---|
| `customer_id` | `cust_8f2a…` |
| `customer_name` | Emily Carter |
| `customer_phone` | +1 415 555 0133 |
| `customer_email` | emily@… |
| `enrolled_at` | 2026-04-14 09:02 PT |
| `campaign_id` | `camp_71a…` |
| `campaign_name` | Spring Service Reactivation |
| `campaign_type` | service / sales |
| `lead_source` | CRM / CSV / API |
| `status` | Enrolled / Queued / Live / Connected / Voicemail / Escalated / Completed / Failed (see [status.md](./status.md)) |
| `outcome` | Domain-specific label from [outcomes.md](./outcomes.md) — e.g. `Schedule Test Drive`, `Service Appointment Booked`, `Salesperson/Manager Request`, `Follow-Up Required`, `Voicemail`, `Call Aborted` |
| `outcome_domain` | `sales` / `service` — tells downstream systems which enum list to validate `outcome` against |
| `sms_sent` | 3 |
| `sms_replies` | 2 |
| `last_sms_at` | 2026-04-16 11:20 PT |
| `calls_placed` | 1 |
| `calls_connected` | 1 |
| `call_id` | `call_4c91…` |
| `call_started_at` | 2026-04-17 14:05 PT |
| `call_duration_sec` | 184 |
| `call_direction` | outbound / inbound |
| `recording_url` | signed URL (24h) |
| `recording_file` | `recordings/call_4c91…mp3` |
| `transcript_file` | `transcripts/call_4c91…txt` |
| `appointment_booked_at` | 2026-04-17 14:08 PT |
| `appointment_date` | 2026-04-22 10:00 PT |
| `appointment_service` | 30k mile inspection |
| `appointment_advisor` | J. Nguyen |
| `escalation_reason` | High intent / Objection / Requested human |
| `ai_quality_score` | 0–100 |
| `objection_tags` | price;timing |
| `agent_version` | `v4.7.2` |

### `transcripts/<call_id>.txt`
Plain text, speaker-labeled, timestamped:
```
[00:00] Agent: Hi Emily, this is Ava from Bay Auto…
[00:04] Customer: Yeah, hi.
…
```
Header block at top repeats: customer name, customer id, call id, campaign, started_at, duration, outcome.

### `recordings/<call_id>.mp3`
- 64 kbps mono, matches `call_id` from CSV.
- Dual-channel version available on request (flag in export modal — not default, file size).

### `audio-messages/<message_id>.mp3`
- Only present if the customer sent/received voice notes in the SMS thread.

### `metadata.json`
Full structured blob — superset of CSV. One object per customer, keyed by `customer_id`. Includes:
- Full SMS thread (per-message send/delivered/read timestamps, direction, body)
- Full call transcript as turns with start/end ms
- Per-call AI scorecard (rubric + breakdown)
- Agent decision trace (why it escalated, which rebuttal fired)
- Raw webhook events from telephony provider

### `README.txt`
- Column definitions for every CSV field
- Timezone (always PT in display, UTC in `*.json`)
- Recording retention policy
- PII handling note

---

## Export options (in the dropdown)

- **Download CSV only** — fastest, just the master index.
- **Download Full Archive (ZIP)** — default; everything above.
- **Download Filtered** — respects current table filters (status, outcome, date range). Filter values match the enums in [status.md](./status.md) and [outcomes.md](./outcomes.md) — no fuzzy matching.
- **Schedule Recurring Export** — daily/weekly to email or S3 (Enterprise).

---

## Access + safety

- Signed recording URLs expire in 24h; files inside the ZIP never do (they're the binaries).
- Download events are audit-logged: who, when, campaign, row count.
- PII redaction toggle (off by default): redacts phone/email in CSV and transcripts but keeps call recordings intact.
- Archive is generated server-side; user sees a progress indicator for campaigns > 1k customers.

---

## Acceptance criteria

- [ ] Every customer in the campaign appears exactly once in `campaign.csv`.
- [ ] Every `call_id` in the CSV has a matching `.txt` and `.mp3`.
- [ ] `metadata.json` parses as valid JSON and round-trips through the CSV columns.
- [ ] Filtered export row-count matches the table's visible row-count at click time.
- [ ] Export for a 5k-customer campaign completes in under 60s or streams progressively.
