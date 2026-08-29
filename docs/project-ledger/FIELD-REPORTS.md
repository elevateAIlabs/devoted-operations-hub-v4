# Devoted HQ Production Field Reports

Production Field Reports preserve structured observations from real-world use of
Devoted HQ by the reference customer.

Field Reports are evidence, not automatically requirements.

A field observation may:

- validate existing behavior
- identify workflow friction
- reveal a defect
- generate a backlog candidate
- challenge an existing assumption
- support or reject a proposed capability
- provide evidence for a future Foundry Review

Field Reports should distinguish observed behavior from proposed solutions.

---

# OHO Field Report 001

**Date:** 2026-08-25
**Release:** Devoted HQ 4.1
**Environment:** Production
**Observer:** OHO / Reference Customer

## Overall Assessment

**SUCCESSFUL PRODUCTION OBSERVATION**

OHO used Devoted HQ more extensively during this production workday than on any
previous day since incorporating the platform into normal operations.

The system was used against a substantial real-world workload involving:

- multiple workstreams
- multiple urgency levels
- multiple deadlines
- follow-up dates
- completion of work items
- editing and updating existing work
- attachments
- attachment viewing
- search
- filtering

No new release-blocking defect or material 4.1 regression was identified during
the observation period.

Previously identified backlog findings remain applicable.

## Positive Evidence

The 4.1 release remained stable during substantial real-world operational use.

OHO was able to:

- close numerous work items
- update existing items
- edit records
- add attachments
- view attachments
- use filtering
- use search
- operate across a comparatively large and varied active workload

The production experience materially increased confidence in:

- the 4.1 release
- the current development methodology
- acceptance testing
- post-release observation
- Foundry governance
- the Platform Constitution

This observation does not establish that 4.1 is defect-free.

It establishes that no material regression emerged during a comparatively heavy
day of real production use.

## New Workflow Findings

### Urgency Filtering

OHO identified a need to quickly isolate work items by urgency, particularly:

- High
- Critical
- potentially High + Critical together

This is a workflow enhancement rather than an observed 4.1 regression.

See `BACKLOG.md`.

### Export Experience

OHO identified friction in the current export experience, particularly calendar
export on iOS.

The current ability to generate an ICS file is technically functional, but file
generation does not necessarily complete the user's actual job of adding the
work item to a calendar.

This finding initiated a broader Foundry review of PDF, TXT, ICS, and
outcome-oriented export behavior.

See `BACKLOG.md` and `DECISIONS.md`.

### PDF Export Presentation

Review of both short and multi-page real production exports identified
presentation/layout refinement opportunities, including insufficient clearance
between the document header and beginning of work-item content.

The underlying exported content was not identified as the primary problem.

See `BACKLOG.md`.

## Calendar Workflow Evidence

On OHO's iPhone using Chrome, the current ICS workflow requires additional steps
after export.

Observed workflow:

Devoted HQ
-> download ICS
-> Chrome Downloads / Files
-> open or share ICS
-> third-party iOS Shortcut
-> calendar-import experience

Opening the downloaded ICS directly through Files displays the event but does
not provide OHO with a sufficiently direct Add-to-Calendar workflow.

OHO currently uses an "ICS To Calendar" Shortcut obtained from RoutineHub to
bridge this interaction.

This is production evidence supporting investigation of a simpler zero-auth
Add-to-Calendar experience.

## Calendar Semantic Direction

FHO and OHO approved the following direction for subsequent implementation
research:

- Deadline is the canonical calendar-event date.
- Calendar events should initially be generated as all-day events.
- Devoted HQ should not infer a time.
- Devoted HQ should not infer a duration.
- Follow-up should not silently substitute for Deadline.
- Work Block should not determine calendar-event timing.
- The destination calendar may allow the user to subsequently assign a specific
  time or duration.

## Work Block Observation

OHO reported that Work Block has not materially improved the real operational
workflow.

Work Block is therefore a deprecation candidate.

This Field Report does not itself authorize removal.

Dependencies and consequences should be evaluated before implementation.

## Field Report Disposition

**4.1 stability:** Positive evidence

**Release-blocking regression:** None observed

**New defect:** None identified from this observation

**Workflow enhancements generated:** Yes

**Backlog updates required:** Yes

**Architecture research required:** Calendar export / Add-to-Calendar

**Immediate production change required:** No

---

# OHO Field Report 002

**Date:** 2026-08-28
**Release:** Devoted HQ 4.1
**Environment:** Production
**Observer:** OHO / Reference Customer

## Overall Assessment

**PRODUCT SEMANTICS AND WORKFLOW OBSERVATION**

Continued OHO production use identified several areas where existing behavior,
terminology, or product structure requires clarification or further Foundry
review.

These observations do not establish that the underlying implementation is
defective.

They identify areas where operational meaning, user expectations, and current
platform behavior should be reconciled before implementation changes are made.

## Projects and Operations

OHO identified uncertainty regarding the relationship between Project status and
what appears in the Operations tab.

The current product behavior needs to be inspected and clarified.

Questions include:

- What Project states or conditions cause information to surface in Operations?
- Does Operations represent Projects themselves, actionable work associated with
  Projects, operational exceptions, or some combination?
- How does Project status influence inclusion or exclusion?
- Is current behavior consistent with the intended canonical relationship between
  Projects and operational work?

This should initially be treated as a product-semantics and
information-architecture question.

Current implementation should be inspected before behavior is changed.

## Deadline and Follow-Up Date Semantics

OHO identified a semantic concern when a Follow-Up date occurs before the
Deadline.

Operationally:

- Deadline represents when work is due.
- Follow-Up represents when the item should be brought back for subsequent
  attention.

Under those semantics, a Follow-Up occurring before the Deadline may be
contradictory.

A candidate canonical invariant is therefore:

`Follow-Up >= Deadline`

when both values exist.

This Field Report does not itself establish that invariant.

Foundry review should determine:

- whether same-day Deadline and Follow-Up should be valid
- whether Follow-Up must strictly occur after Deadline
- how existing records that violate the eventual rule should be handled
- whether validation belongs in UI, API/canonical logic, or both
- whether the current meaning of Follow-Up is sufficiently precise to support
  the invariant

No production data should be silently mutated as a consequence of introducing
future validation.

## Operations Navigation

OHO expects previous/next navigation controls in the dashboard-style tile above
the two primary Operations sections.

This observation should be reconciled with the existing backlog requirement for
time-frame-aware previous/next Schedule navigation rather than automatically
creating an unrelated navigation system.

The intended behavior and current Operations time context should be inspected
before implementation.

## Operations Queue and What's Missing

OHO requested clarification of the meaning and classification rules for:

- Operations Queue
- What's Missing

The current implementation should be inspected to determine exactly how records
are classified into these sections.

Foundry review should distinguish:

1. current implemented classification logic
2. intended product semantics
3. whether the current labels communicate those semantics clearly
4. whether any mismatch is primarily logic, UX/explainability, or both

The fact that the reference operator cannot readily explain why an item belongs
to one section is itself meaningful usability evidence even if the underlying
classification logic proves technically correct.

## Accounting

OHO identified Accounting as requiring a broader strategic rethink.

This should not initially be treated as a conventional request to redesign the
Accounting tab.

The larger question is:

**What role should Accounting and financial operations play within the Devoted
HQ platform under the Platform Constitution?**

A dedicated Foundry strategic review should evaluate whether Devoted HQ should:

- own accounting workflows
- coordinate accounting workflows
- summarize accounting information
- link to specialized accounting systems and canonical artifacts
- orchestrate selected financial operations
- combine some of these responsibilities within explicit boundaries

The review should specifically consider:

- Devoted HQ's coordination-layer product thesis
- canonical versus external financial data
- specialized-system boundaries
- Monthly Close workflows
- master financial workbook access
- integrations and external systems
- operator usefulness
- future platform generality
- security and financial-data boundaries
- the approximately $0 incremental-cost constraint
- whether replacing specialized accounting functionality would create genuine
  value

No Accounting rebuild is authorized by this Field Report.

## Field Report Disposition

**Release-blocking regression:** None identified

**Product-semantics clarification required:** Yes

**Backlog / research updates required:** Yes

**Foundry strategic review required:** Accounting

**Canonical validation candidate:** Deadline / Follow-Up relationship

**Implementation authorized:** No

**Immediate production change required:** No

## Field Report 002 - Read-Only Inspection Findings

Following OHO Field Report 002, SK performed two read-only source inspections of
the current Devoted HQ 4.1 implementation.

No files were changed during either inspection.

The inspections clarified several previously unresolved product-semantics
questions.

### Project Stage and Work Status Are Separate by Design

The current implementation intentionally maintains two state dimensions for
Projects.

**Project Stage / lifecycle status**

Stored on the master Project record and used to represent the Project's position
in the business lifecycle.

Examples include:

- New Lead
- Scope in Progress
- Estimate in Progress
- Proposal Sent
- Approved
- Ready for Field
- Active
- Closeout Needed
- Complete

**Work Status / execution status**

Stored through the Project's primary actionable execution state and used to
represent whether the current actionable work is:

- Not Started
- in another supported execution state
- Completed

Canonicalization intentionally exposes:

- `lifecycleStatus` from the master Project record
- `status` from the actionable execution state when available

This separation is therefore intentional architecture rather than accidental
duplication.

### Project Completion Semantics

The convenience completion behavior for Projects updates execution state rather
than automatically advancing the Project lifecycle stage to `Complete`.

Therefore:

**Completing the current actionable work is not equivalent to declaring the
entire Project lifecycle complete.**

This distinction may be useful, but the UI should communicate it more clearly.

### Project Readiness Pipeline

The Operations Project Readiness Pipeline currently includes every non-archived
Project.

Projects are placed into pipeline columns according to `lifecycleStatus`.

The pipeline therefore answers:

**Where is this Project in its lifecycle?**

The underlying lifecycle-oriented model appears coherent and does not presently
require architectural replacement.

### Operations Queue

The current Operations Queue contains actionable, incomplete items whose
Workstream belongs to a hard-coded set of operational Workstreams:

- Estimates and Proposals
- Active Projects
- Leads and Follow-Up
- Fleet and Equipment
- ADP and Payroll
- HomeWorks and Customer Administration

The UI then displays only the first eight matching items.

The current implementation does not apply a distinct queue-ranking algorithm
before that `slice(0, 8)` operation.

Therefore the word `Queue` currently implies more prioritization or sequencing
than the implementation actually provides.

This is a product-semantics and UX finding.

### What Is Missing?

The current `What is missing?` section does not contain a missing-information
classifier.

It renders every non-archived Project and displays:

- Project Stage
- the first line of the Project body as `Next`, or `Needs information` if the
  body is empty
- `Waiting on ...`, otherwise the Deadline, otherwise `Deadline not recorded`

Therefore the current section is closer to a Project-readiness or next-step
summary than a true diagnostic of missing requirements.

The label and the underlying behavior are presently mismatched.

### Follow-Up Semantics

The read-only inspection materially changed the interpretation of Follow-Up.

Current application behavior treats `followUpDate` as an attention/check-back
date.

Examples in current logic include increasing attention ranking when Follow-Up is
due and surfacing items waiting on another person when their Follow-Up date has
arrived.

Under this behavior, the following is legitimate:

- Deadline: September 10
- Follow-Up: September 4
- Waiting on: another person

This means:

**Check back on September 4 because the underlying commitment is due September
10.**

Therefore a Follow-Up date occurring before a Deadline is not inherently
invalid.

The previously proposed candidate invariant:

`Follow-Up >= Deadline`

should not be implemented.

### Schedule Navigation

The read-only inspection also confirmed the previously logged Schedule
navigation issue.

Previous/next arrows currently change month state regardless of active Day,
Week, Month, or 3 Months mode.

Day and Week views depend on `selectedDate`, while the arrow behavior does not
advance that selected date.

This explains the stale or apparently ineffective navigation behavior observed
by OHO.

The Schedule navigation backlog item is therefore supported by direct
implementation evidence.

### Inspection Disposition

**Project dual-state architecture:** Retain

**Project lifecycle pipeline:** Retain

**Project Stage / Work Status UX clarity:** Improvement warranted

**Operations Queue semantics:** Improvement warranted

**What is missing? semantics:** Label/behavior mismatch confirmed

**Follow-Up >= Deadline candidate invariant:** Rejected / superseded by evidence

**Schedule timeframe navigation deficiency:** Confirmed

**Application change authorized by inspection alone:** No

## OHO Field Report 002 Addendum — Schedule Follow-Up Clarification

### FHO/OHO clarification

FHO and OHO agreed that Follow-Up is specifically intended to resurface incomplete work after its Due Date has passed.

It is not intended as a general pre-deadline check-in date.

The operational problem with the current Schedule is that an item containing both a Due Date and Follow-Up Date is projected twice, producing avoidable calendar clutter.

### Desired operator experience

For the Due / Follow-Up relationship, any incomplete master item should have one effective Schedule position at a time.

Before or on the Due Date, the item appears on the Due Date.

After the Due Date:

- without Follow-Up, it remains represented as overdue against its original Due Date;
- with Follow-Up, it resurfaces at the Follow-Up Date while remaining overdue from the original Due Date.

OHO specifically approved Schedule language equivalent to:

Upcoming:

Irrigation Repair
Due Sep 10

Overdue:

🔴 Irrigation Repair
OVERDUE · Due Sep 10

Resurfaced overdue:

🔴 Irrigation Repair
FOLLOW-UP · Overdue since Sep 10

The third state is particularly valuable because it immediately explains both why the item appears at the resurfacing date and when its actual deadline was missed.

### Inspection evidence

Read-only inspection confirmed:

- `projectSchedule()` currently adds Due and Follow-Up independently;
- same-date roles are collapsed, but different dates become separate Schedule projections;
- the existing contract test explicitly preserves the old two-projection behavior;
- Schedule rendering already understands `due`, `follow-up`, and `work` roles;
- overdue truth is already derived from the original Due Date;
- relevant business-date logic already uses `America/Chicago`;
- Schedule navigation arrows currently move months regardless of active Day / Week / Month / 3 Months mode;
- ICS generation currently consumes `projectSchedule()`, creating an architectural boundary that must be protected when operational Schedule semantics change.

### Foundry disposition

The inspection phase for basic Schedule projection semantics is complete.

The next implementation release should preserve the distinction between:

- Deadline truth,
- Follow-Up resurfacing,
- overdue state,
- Work Block,
- and external calendar-event projection.

No schema migration is required for the Schedule projection change itself.
