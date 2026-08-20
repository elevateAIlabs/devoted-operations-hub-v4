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

test("one item with three same-day schedule roles creates one projection and one count", () => {
  const item = workItem({
    scheduledAt: "2026-08-03T09:30",
    dueDate: "2026-08-03",
    followUpDate: "2026-08-03",
  });
  const projections = core.projectSchedule([item]);
  assert.equal(projections.length, 1);
  assert.equal(projections[0].date, "2026-08-03");
  assert.deepEqual(projections[0].roles, ["work", "due", "follow-up"]);
  assert.equal(projections[0].timeLabel, "9:30 AM");
  assert.equal(new Date("2026-08-03T12:00:00Z").getUTCDay(), 1);
});

test("a later follow-up stays on its own date", () => {
  const item = workItem({
    scheduledAt: "2026-08-03T09:30",
    dueDate: "2026-08-03",
    followUpDate: "2026-08-05",
  });
  const projections = core.projectSchedule([item]);
  assert.deepEqual(
    projections.map(({ date, roles }) => ({ date, roles })),
    [
      { date: "2026-08-03", roles: ["work", "due"] },
      { date: "2026-08-05", roles: ["follow-up"] },
    ],
  );
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
  const { stdout } = await execFileAsync("/usr/bin/pdftotext", [pdfPath, "-"]);
  assert.match(stdout, new RegExp(finalSentinel.replaceAll(".", "\\.")));
  assert.equal((stdout.match(/UNIQUE LONG TITLE START/g) ?? []).length, 1);
  assert.doesNotMatch(stdout, /\?/);
  const pageLabels = [...stdout.matchAll(/Page (\d+) of (\d+)/g)];
  assert.equal(pageLabels.length, pdf.getPageCount());
  assert.ok(pageLabels.every((match) => Number(match[2]) === pdf.getPageCount()));
});
