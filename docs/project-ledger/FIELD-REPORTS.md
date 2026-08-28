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
