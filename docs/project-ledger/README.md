# Devoted HQ Project Ledger

This directory is the durable project-memory layer for Devoted HQ.

The conversation remains the working room for brainstorming, product discussion,
implementation guidance, and Foundry debate. Git is the durable source of truth
for decisions that must not disappear from conversational context.

## Canonical Sections

- `GOVERNANCE.md`
  Foundry roles, decision authority, Founder Hat, Operator Hat, and Script Kitty.

- `DECISIONS.md`
  Important architecture, product, UX, infrastructure, and release decisions.

- `BACKLOG.md`
  Every accepted future item, including low-priority and long-horizon ideas.

- `RELEASES.md`
  Shipped releases, commits, deployment versions, and major behavior changes.

- `ACCEPTANCE-4.1.md`
  Production acceptance-test record for Dashboard Intelligence 4.1.

## Operating Rule

Backlog and decision capture is append-first and prune-deliberately.

Ideas may later be prioritized, grouped, superseded, rejected, implemented,
or deprecated, but they should not silently disappear.

## Development Loop

1. Identify a problem or opportunity.
2. Describe the desired behavior conversationally.
3. Inspect the relevant architecture.
4. Make a controlled code change on an appropriate branch.
5. Test locally.
6. Review the diff.
7. Commit.
8. Merge to `main`.
9. Push to GitHub.
10. Build production artifacts.
11. Deploy to infrastructure under our control.
12. Verify in production.
13. Record material decisions, backlog findings, release metadata, and acceptance results here.
