# Devoted HQ Releases

## 4.1 — Dashboard Intelligence

Status: SHIPPED / PROD ACCEPTED

Git commit:

`7d7f474 add dashboard intelligence and task filter navigation`

Production Cloudflare Worker:

`devotedhqapp2-v4`

Production URL:

`https://devotedhqapp2-v4.gibby3579.workers.dev`

Cloudflare deployment version:

`b4c8e01d-efd6-40f4-bb4e-3571ca98c291`

### Major Changes

- added canonical Dashboard intelligence
- added Incomplete as a first-class canonical workload metric
- added Due Today
- added Overdue
- changed rolling forward horizon from 7 days to 10 days
- Dashboard primary cards became:
  - Incomplete
  - Due Today
  - Overdue
  - Due Next 10 Days
- Dashboard cards navigate directly to matching Tasks filters
- Tasks defaults to Incomplete
- added Next 10 Days Tasks filter
- changed This Week to Monday-Sunday calendar semantics
- retained Completed Last 7 Days intelligence for future secondary use
- added regression coverage for canonical Dashboard behavior
- preserved production D1 and R2 data

### Automated Validation

Before production deployment:

- core tests passed
- contract tests passed
- production Next.js build passed
- OpenNext Cloudflare build passed
- Git diff check clean
- feature branch fast-forwarded cleanly into main
- `main` synchronized with GitHub

### Production Dataset Preservation

Production validation confirmed that current production records remained intact
after deployment.

Observed production corpus during validation included approximately:

- 92 source records
- 31 primary actions
- 90 canonical items

Local August 5 fixtures were not imported into production.

### 4.1 Backlog Findings

The release itself was accepted, while production testing surfaced future items
captured in `BACKLOG.md`, including:

- human-friendly date display
- stronger status/attention hierarchy
- Schedule timeframe-aware navigation
- Recurring-work audit
- Work Block simplification/deprecation investigation
- canonical helper consolidation
- archived-state live validation
- legacy attachment reconciliation
