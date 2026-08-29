import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test, { after } from "node:test";
import { build } from "esbuild";
import { PDFDocument } from "pdf-lib";

const execFileAsync = promisify(execFile);
const testDirectory = await mkdtemp(path.join(tmpdir(), "devoted-hq-tests-"));
const bundlePath = path.join(testDirectory, "core-bundle.mjs");

await build({
  stdin: {
    contents: [
      'export * from "./lib/canonical.ts";',
      'export * from "./lib/exporters.ts";',
      'export * from "./lib/resources.ts";',
    ].join("\n"),
    resolveDir: process.cwd(),
    sourcefile: "tests/core-entry.ts",
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  outfile: bundlePath,
  logLevel: "silent",
});

const core = await import(`${new URL(`file://${bundlePath}`).href}?v=${Date.now()}`);
const backup = JSON.parse(
  await readFile(new URL("../data/devoted-hq-backup.json", import.meta.url), "utf8"),
);

after(async () => {
  const { rm } = await import("node:fs/promises");
  await rm(testDirectory, { recursive: true, force: true });
});

function record(overrides = {}) {
  return {
    id: "record-1",
    ownerEmail: "gibby3579@gmail.com",
    kind: "task",
    title: "Fixture task",
    body: "Fixture overview",
    status: "Not Started",
    workstream: "Business Administration",
    priority: "Normal",
    impact: "Normal",
    effortMinutes: 30,
    assignee: "Greg",
    dueDate: null,
    scheduledAt: null,
    followUpDate: null,
    waitingOn: null,
    relatedProjectId: null,
    relatedUrl: null,
    tags: "fixture",
    metadataJson: "{}",
    pinned: false,
    archivedAt: null,
    completedAt: null,
    carryForwardCount: 0,
    sourceRecordId: null,
    createdAt: "2026-08-05T12:00:00.000Z",
    updatedAt: "2026-08-05T12:00:00.000Z",
    ...overrides,
  };
}

function action(overrides = {}) {
  return {
    id: "action-1",
    ownerEmail: "gibby3579@gmail.com",
    sourceRecordId: "record-1",
    autoKey: "primary:record-1",
    title: "Fixture task",
    body: "Fixture overview",
    status: "Not Started",
    priority: "Normal",
    impact: "Normal",
    effortMinutes: 30,
    assignee: "Greg",
    dueDate: null,
    scheduledAt: null,
    followUpDate: null,
    waitingOn: null,
    pinned: false,
    archivedAt: null,
    completedAt: null,
    createdAt: "2026-08-05T12:00:00.000Z",
    updatedAt: "2026-08-05T12:00:00.000Z",
    ...overrides,
  };
}

function workItem(overrides = {}) {
  const sourceRecord = record(overrides.sourceRecord ?? {});
  const primaryAction = action(overrides.primaryAction ?? {});
  return {
    id: sourceRecord.id,
    masterRecordId: sourceRecord.id,
    kind: sourceRecord.kind,
    typeLabel: "Task",
    title: sourceRecord.title,
    body: sourceRecord.body,
    generatedPrompt: null,
    lifecycleStatus: sourceRecord.status,
    status: primaryAction.status,
    workstream: sourceRecord.workstream,
    priority: sourceRecord.priority,
    impact: sourceRecord.impact,
    effortMinutes: sourceRecord.effortMinutes,
    assignee: sourceRecord.assignee,
    dueDate: sourceRecord.dueDate,
    scheduledAt: sourceRecord.scheduledAt,
    followUpDate: sourceRecord.followUpDate,
    waitingOn: sourceRecord.waitingOn,
    relatedProjectId: sourceRecord.relatedProjectId,
    relatedUrl: sourceRecord.relatedUrl,
    tags: ["fixture"],
    metadata: {},
    pinned: false,
    archivedAt: null,
    completedAt: null,
    carryForwardCount: 0,
    createdAt: sourceRecord.createdAt,
    updatedAt: sourceRecord.updatedAt,
    primaryActionId: primaryAction.id,
    sourceRecord,
    primaryAction,
    ...overrides,
  };
}

test("August 5 backup reconciles to one canonical identity per master item", () => {
  const items = core.canonicalizeRecords(backup.records, backup.actions);
  const integrity = core.integritySummary(
    backup.records,
    backup.actions,
    backup.attachments,
  );
  assert.equal(backup.records.length, 70);
  assert.equal(backup.actions.length, 9);
  assert.equal(items.length, 68);
  assert.deepEqual(integrity, {
    sourceRecordCount: 70,
    primaryActionCount: 9,
    canonicalItemCount: 68,
    duplicatePrimaryActionKeys: 0,
    orphanActions: 0,
    orphanAttachments: 0,
    unavailableAttachmentFiles: 0,
  });
  const content = items.find((item) => item.kind === "content_idea");
  assert.ok(content);
  assert.ok(content.generatedPrompt?.includes("Devoted Landscaping"));
  assert.ok(content.primaryActionId);
  const linkedPrompt = backup.records.find(
    (candidate) =>
      candidate.kind === "generated_prompt" &&
      candidate.sourceRecordId === content.id,
  );
  assert.ok(linkedPrompt);
  assert.equal(items.some((item) => item.id === linkedPrompt.id), false);
});

test("same-day invalid follow-up does not create a duplicate operational role", () => {
  const item = workItem({
    id: "same-day-follow-up",
    scheduledAt: "2026-08-03T10:00:00",
    dueDate: "2026-08-03",
    followUpDate: "2026-08-03",
  });

  const projections = core.projectSchedule([item], "2026-08-02");

  assert.equal(projections.length, 1);
  assert.equal(projections[0].date, "2026-08-03");
  assert.deepEqual(projections[0].roles, ["work", "due"]);
});

test("later follow-up becomes the one active deadline position after due date passes", () => {
  const item = workItem({
    id: "later-follow-up",
    scheduledAt: "2026-08-03T10:00:00",
    dueDate: "2026-08-03",
    followUpDate: "2026-08-05",
  });

  const beforeDue = core.projectSchedule([item], "2026-08-02");

  assert.deepEqual(
    beforeDue.map(({ date, roles }) => ({ date, roles })),
    [
      { date: "2026-08-03", roles: ["work", "due"] },
    ],
  );

  const afterDue = core.projectSchedule([item], "2026-08-04");

  assert.deepEqual(
    afterDue.map(({ date, roles }) => ({ date, roles })),
    [
      { date: "2026-08-03", roles: ["work"] },
      { date: "2026-08-05", roles: ["follow-up"] },
    ],
  );
});

test("overdue item without follow-up remains represented on original due date", () => {
  const item = workItem({
    id: "overdue-no-follow-up",
    scheduledAt: null,
    dueDate: "2026-08-03",
    followUpDate: null,
  });

  assert.deepEqual(
    core.projectSchedule([item], "2026-08-08").map(
      ({ date, roles }) => ({ date, roles }),
    ),
    [
      { date: "2026-08-03", roles: ["due"] },
    ],
  );
});

test("legacy follow-up on or before due date is ignored for resurfacing", () => {
  const item = workItem({
    id: "legacy-follow-up",
    scheduledAt: null,
    dueDate: "2026-08-03",
    followUpDate: "2026-08-02",
  });

  assert.deepEqual(
    core.projectSchedule([item], "2026-08-08").map(
      ({ date, roles }) => ({ date, roles }),
    ),
    [
      { date: "2026-08-03", roles: ["due"] },
    ],
  );
});

test("completed item does not actively project due or follow-up positions", () => {
  const item = workItem({
    id: "completed-follow-up",
    scheduledAt: null,
    dueDate: "2026-08-03",
    followUpDate: "2026-08-05",
    status: "Completed",
    completedAt: "2026-08-03T18:00:00.000Z",
    primaryAction: {
      ...action(),
      status: "Completed",
      completedAt: "2026-08-03T18:00:00.000Z",
    },
  });

  assert.deepEqual(core.projectSchedule([item], "2026-08-08"), []);
});

test("dashboard intelligence separates current, overdue, upcoming, and completed work", () => {
  const summary = core.dashboardSummary(
    [
      workItem({ id: "due-today", dueDate: "2026-08-23" }),
      workItem({ id: "overdue", dueDate: "2026-08-22" }),
      workItem({ id: "tomorrow", dueDate: "2026-08-24" }),
      workItem({ id: "seven-days-out", dueDate: "2026-08-30" }),
      workItem({ id: "ten-days-out", dueDate: "2026-09-02" }),
      workItem({ id: "eleven-days-out", dueDate: "2026-09-03" }),
      workItem({
        id: "completed-due-today",
        dueDate: "2026-08-23",
        status: "Completed",
        completedAt: "2026-08-23T15:00:00.000Z",
      }),
      workItem({
        id: "archived-overdue",
        dueDate: "2026-08-01",
        archivedAt: "2026-08-20T12:00:00.000Z",
      }),
    ],
    "2026-08-23",
  );

  assert.deepEqual(
    summary.incomplete.map((item) => item.id),
    [
      "due-today",
      "overdue",
      "tomorrow",
      "seven-days-out",
      "ten-days-out",
      "eleven-days-out",
    ],
  );
  assert.deepEqual(summary.dueToday.map((item) => item.id), ["due-today"]);
  assert.deepEqual(summary.overdue.map((item) => item.id), ["overdue"]);
  assert.deepEqual(
    summary.dueNext10Days.map((item) => item.id),
    ["tomorrow", "seven-days-out", "ten-days-out"],
  );
  assert.deepEqual(
    summary.recentlyCompleted.map((item) => item.id),
    ["completed-due-today"],
  );
});

test("dashboard completion window uses Chicago calendar dates and includes seven calendar days", () => {
  const summary = core.dashboardSummary(
    [
      workItem({
        id: "inside-window",
        status: "Completed",
        completedAt: "2026-08-17T05:00:00.000Z",
      }),
      workItem({
        id: "outside-window",
        status: "Completed",
        completedAt: "2026-08-17T04:59:59.000Z",
      }),
      workItem({
        id: "today-completed",
        status: "Completed",
        completedAt: "2026-08-23T18:00:00.000Z",
      }),
    ],
    "2026-08-23",
  );

  assert.deepEqual(
    summary.recentlyCompleted.map((item) => item.id),
    ["inside-window", "today-completed"],
  );
});

test("dashboard metrics count one canonical item once even if duplicate input is supplied", () => {
  const duplicate = workItem({
    id: "canonical-one",
    dueDate: "2026-08-23",
  });

  const summary = core.dashboardSummary(
    [duplicate, { ...duplicate }],
    "2026-08-23",
  );

  assert.equal(summary.incomplete.length, 1);
  assert.equal(summary.incomplete[0].id, "canonical-one");
  assert.equal(summary.dueToday.length, 1);
  assert.equal(summary.dueToday[0].id, "canonical-one");
});

test("copy summary and prompt use the same complete canonical item", () => {
  const item = workItem({
    kind: "content_idea",
    typeLabel: "Content idea",
    lifecycleStatus: "Ready",
    status: "In Progress",
    scheduledAt: "2026-08-03T09:30",
    dueDate: "2026-08-03",
    followUpDate: "2026-08-05",
    waitingOn: "Assets",
    generatedPrompt: "PROMPT-ONLY-SENTINEL",
  });
  const summary = core.formatWorkItemSummary(item);
  assert.match(summary, /Record type: Content idea/);
  assert.match(summary, /Status: In Progress/);
  assert.match(summary, /Content stage: Ready/);
  assert.match(summary, /Work block: 2026-08-03T09:30/);
  assert.match(summary, /Deadline: 2026-08-03/);
  assert.match(summary, /Follow-up: 2026-08-05/);
  assert.match(summary, /Next action:/);
  assert.match(summary, /Overview/);
  assert.match(summary, /PROMPT-ONLY-SENTINEL/);
  assert.equal(item.generatedPrompt, "PROMPT-ONLY-SENTINEL");
});

test("resource menus resolve from one registry and never invent URLs", () => {
  const items = core.canonicalizeRecords(backup.records, backup.actions);
  const resources = core.resolveResources(items);
  assert.equal(resources.find((resource) => resource.key === "homeworks")?.configured, true);
  assert.equal(resources.find((resource) => resource.key === "adp")?.configured, true);
  assert.equal(resources.find((resource) => resource.key === "amex")?.configured, false);
  assert.equal(resources.find((resource) => resource.key === "wex")?.item, null);
});

test("long PDFs paginate, preserve the sentinel, and normalize punctuation", async () => {
  const longTitle = `UNIQUE LONG TITLE START ${"landscape-transformation ".repeat(10)}`.trim();
  const finalSentinel = "FINAL SENTINEL SENTENCE MUST SURVIVE PDF PAGINATION.";
  const longPrompt = `${"A complete prompt paragraph with wrapping, bullets, and implementation detail. ".repeat(105)}\nCurly “quotes” · bullet • em dash — remain readable.\n${finalSentinel}`;
  const items = [
    workItem({
      id: "long-record",
      title: longTitle,
      generatedPrompt: longPrompt,
      primaryActionId: "long-action",
      sourceRecord: record({ id: "long-record", title: longTitle }),
      primaryAction: action({ id: "long-action", sourceRecordId: "long-record" }),
    }),
    workItem({ id: "packet-2", title: "Packet item two" }),
    workItem({ id: "packet-3", title: "Packet item three" }),
  ];
  const bytes = await core.makePdf(items);
  const pdfPath = path.join(testDirectory, "stress.pdf");
  await writeFile(pdfPath, bytes);
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() > 2);
  const { stdout } = await execFileAsync("pdftotext", [pdfPath, "-"]);
  assert.match(stdout, new RegExp(finalSentinel.replaceAll(".", "\\.")));
  assert.equal((stdout.match(/UNIQUE LONG TITLE START/g) ?? []).length, 1);
  assert.doesNotMatch(stdout, /\?/);
  const pageLabels = [...stdout.matchAll(/Page (\d+) of (\d+)/g)];
  assert.equal(pageLabels.length, pdf.getPageCount());
  assert.ok(pageLabels.every((match) => Number(match[2]) === pdf.getPageCount()));
});
