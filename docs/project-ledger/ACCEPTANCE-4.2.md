# Devoted HQ 4.2 Release Candidate Acceptance

## Status

**LOCALHOST RELEASE-CANDIDATE ACCEPTANCE IN PROGRESS**

Cloudflare deployment is not yet authorized.

This acceptance pass evaluates the integrated Devoted HQ 4.2 release against the
realistic localhost QA dataset refreshed from the audited August 29 DEV export.

---

## Canonical Release Candidate

Current canonical Git commit:

`b580ddc contain schedule density and long titles`

The integrated 4.2 release candidate includes:

### 4.2A1 — Schedule Semantic Engine

Commit:

`9bb4af0 implement schedule follow-up resurfacing semantics`

Introduced:

- one active Due / Follow-Up operational Schedule position
- original Due Date remains deadline truth
- valid post-deadline Follow-Up can resurface incomplete work
- invalid legacy Follow-Up dates do not move work backward
- completed items do not actively resurface
- external calendar-export semantics remain isolated

### 4.2A2 — Schedule UI + Timeframe Navigation

Commit:

`211af63 improve schedule states and timeframe navigation`

Introduced:

- Upcoming / Overdue / Follow-Up Schedule presentation
- overdue-since-original-deadline explanation
- Day navigation by one day
- Week navigation by one week
- Month navigation by one month
- 3 Months navigation by three months
- Today synchronization

### 4.2A3 — Operations Terminology

Commit:

`9452430 clarify operations terminology`

Introduced terminology updates:

- Operations Queue -> Needs Action
- Open loops -> Open work
- What is missing? -> Project Readiness

No classification or database behavior changed.

### 4.2A4 — Calendar Week Semantics

Commit:

`38f0481 use calendar weeks in schedule view`

Week means:

**Sunday through Saturday calendar week containing the selected date**

Cross-month calendar weeks are supported.

### 4.2A5 — Local QA Data Integrity

Canonical implementation commit:

`01b0466 add local QA snapshot refresh workflow`

Introduced:

- frozen regression fixture remains separate from mutable localhost QA data
- explicit local-only snapshot refresh utility
- dry-run validation
- audited SHA-256 apply gate
- automatic local rollback snapshot
- attachment metadata-only refresh mode
- local attachment binaries remain intentionally unavailable unless separately mirrored
- no remote D1/R2 mutation path

The active localhost QA environment was successfully refreshed from the audited
August 29 DEV export.

Current localhost QA source counts:

- 105 records
- 44 actions
- 16 attachment metadata records

### 4.2A6 — Schedule Density + Text Containment

Commit:

`b580ddc contain schedule density and long titles`

Visual acceptance confirmed:

- long titles remain contained within Day / Week columns
- Month cells render no more than two complete event previews
- additional events appear through `+N more`
- clicking/selecting a Month date continues to expose the complete date workload below
- realistic local QA dataset remained intact

---

# OHO Localhost Release-Candidate Pass

## Purpose

This is not a code-review exercise.

OHO should use localhost as an operator and determine whether Devoted HQ 4.2
behaves coherently against realistic Devoted Landscaping data.

The governing question is:

**Can OHO trust what the system is showing and use it naturally without having
to mentally compensate for confusing behavior?**

---

## Environment

Target:

`http://localhost:5173`

Expected local QA dataset:

- records: 105
- actions: 44
- attachments: 16 metadata records
- attachment binaries: intentionally unavailable locally

Production DEV data must not be mutated during this acceptance pass.

---

# OHO Acceptance Checklist

## 1. Overall Smoke Test

Navigate naturally through:

- Dashboard
- Tasks
- Schedule
- Operations
- Accounting
- Content
- Reference
- Tools
- Review

Look for:

- blank screens
- runtime errors
- broken layouts
- unexpected navigation
- obviously stale data
- contradictory information

---

## 2. Schedule — Month

Inspect crowded dates, especially dates around:

- August 27
- August 28
- August 31
- September 1
- September 2
- September 3

Confirm:

- no event card is partially clipped in a broken-looking state
- maximum two complete previews appear per Month cell
- additional workload appears as `+N more`
- titles remain contained
- selecting a date exposes the full date workload below
- selected date highlighting behaves correctly
- adjacent-month dates remain understandable

---

## 3. Schedule — Week

Confirm:

- Week represents Sunday through Saturday
- heading matches the visible seven-day range
- previous arrow moves exactly one week backward
- next arrow moves exactly one week forward
- cross-month weeks behave correctly
- event population changes with the visible week
- long task titles remain inside their column
- Follow-Up / Overdue / Work Block states are understandable

---

## 4. Schedule — Day

Confirm:

- previous moves exactly one day
- next moves exactly one day
- Today returns to the current date
- long titles remain contained
- displayed work corresponds to the selected day

---

## 5. Schedule — 3 Months

Confirm:

- previous / next moves three months at a time
- dates containing work remain visibly identifiable
- selecting a mini-calendar date transitions coherently into Month view

---

## 6. Due / Follow-Up Semantics

Look for real examples where possible.

Confirm the product meaning feels correct:

### Upcoming

Before deadline:

`Due [date]`

### Overdue

After missed deadline with no valid resurfacing:

`OVERDUE`

with original Due Date retained.

### Follow-Up resurfacing

An incomplete overdue item with a valid later Follow-Up should appear later while
still communicating that the original deadline was missed.

It should not appear as though Follow-Up erased the overdue state.

### Completed work

Completed work should not continue actively resurfacing as Due / Follow-Up work.

### Duplicate prevention

The same master work item should not appear as simultaneous independent Due and
Follow-Up copies merely because both dates exist.

---

## 7. Dashboard / Tasks / Schedule Consistency

Pick several recognizable real work items.

Compare them across:

- Dashboard
- Tasks
- Schedule
- item drawer

Look for contradictions in:

- status
- completion
- Due Date
- Follow-Up
- overdue meaning
- title
- ownership / assignment

Different views may emphasize different information.

They should not tell incompatible stories about the same work.

---

## 8. Tasks

Confirm normal use still feels intact:

- Incomplete filter
- Due Today
- Overdue
- Next 10 Days
- This Week
- search
- opening task detail

Look for:

- incorrect counts
- obviously missing work
- completed items appearing as incomplete
- archived behavior leaking into active workload
- strange date semantics

---

## 9. Operations

Confirm terminology feels understandable:

- Needs Action
- Project Readiness
- Project readiness pipeline

For Projects, remember:

- lifecycle stage answers where the Project is in its business lifecycle
- execution status answers the state of current actionable work

Look for situations where the interface makes those concepts appear contradictory.

---

## 10. Attachments

Localhost currently contains attachment metadata but intentionally does not
mirror production R2 binaries.

Expected local behavior:

- attachment references may appear
- files should not falsely appear locally available
- no production R2 storage reference should magically become usable locally

This is expected QA behavior, not a release defect.

Unexpected attachment crashes or misleading availability states should still be
reported.

---

## 11. Editing / Interaction Regression Sniff Test

Without making risky or valuable changes, exercise ordinary interactions such as:

- opening item detail
- navigating between sections
- search
- filters
- switching Schedule modes
- selecting dates
- opening crowded-day agenda items

Only perform edits or completion changes against disposable QA candidates.

Do not deliberately alter important operational records merely for acceptance
testing.

---

# Observation Classification

Every finding should be placed into one of three buckets.

## RELEASE BLOCKER

Examples:

- data corruption
- incorrect canonical semantics
- crashes
- major missing workload
- navigation materially showing the wrong date/range
- duplicate work that changes operational meaning
- broken UI that prevents practical use
- production-data safety concern

A release blocker stops Cloudflare deployment.

---

## 4.2 POLISH CANDIDATE

Examples:

- awkward spacing
- truncation that remains understandable
- confusing wording
- unnecessary click
- visual hierarchy issue
- minor interaction friction

Capture it.

Do not automatically stop release.

---

## FUTURE BACKLOG

Examples:

- desirable new capability
- broader redesign
- feature idea
- workflow improvement unrelated to a regression
- Accounting strategy work
- Work Block redesign/deprecation
- recurrence redesign

These belong in future Foundry planning unless they reveal a release defect.

---

# OHO Acceptance Principle

OHO should not deliberately torture every control.

Use Devoted HQ naturally.

The strongest evidence is whether 4.2 survives realistic operator use against a
realistic workload without requiring explanation from the implementation team.

If something causes the reaction:

- "Why is this here?"
- "Where did that go?"
- "Why does this view disagree with the other one?"
- "Why did that date move?"
- "Why is this overdue here but not there?"
- "Why do I need to know how the code works to understand this?"

capture it.

That reaction is useful product evidence even if the implementation is
technically functioning.

---

## Deployment Gate

Cloudflare deployment remains prohibited until:

1. OHO completes the integrated localhost release-candidate pass.
2. release blockers are zero or explicitly resolved.
3. Foundry reviews any material findings.
4. canonical Git main remains clean and synchronized.
5. final automated validation passes.
6. production D1/R2 preservation is reconfirmed.
