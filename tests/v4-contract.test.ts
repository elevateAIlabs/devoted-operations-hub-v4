import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { calendarCells, calendarWeekBounds } from "../lib/calendar.ts";
import {
  canonicalizeRecords,
  formatWorkItemSummary,
  integritySummary,
  projectCalendarExportSchedule,
  projectSchedule,
} from "../lib/canonical.ts";
import { makePdf } from "../lib/exporters.ts";
import { resolveResources, selectResources } from "../lib/resources.ts";
import type {
  ActionItem,
  Attachment,
  DevotedRecord,
  WorkItem,
} from "../lib/types.ts";

const backup = JSON.parse(
  await readFile(new URL("../data/devoted-hq-backup.json", import.meta.url), "utf8"),
) as {
  records: DevotedRecord[];
  actions: ActionItem[];
  attachments: Attachment[];
};
const items = canonicalizeRecords(backup.records, backup.actions);
const truckIdeaId = "b2da2773-71dd-4d2f-85fe-0d1b112ffe6e";
const truckPromptId = "d4d6d5bf-02fe-4923-92dc-e060b6766225";
const truckTaskId = "c1ccf691-8c57-4635-9f3d-68cef9ef5066";

test("the August 5 recovery export is internally intact", () => {
  const integrity = integritySummary(
    backup.records,
    backup.actions,
    backup.attachments,
  );
  assert.equal(integrity.sourceRecordCount, 70);
  assert.equal(integrity.primaryActionCount, 9);
  assert.equal(backup.attachments.length, 6);
  assert.equal(integrity.duplicatePrimaryActionKeys, 0);
  assert.equal(integrity.orphanActions, 0);
  assert.equal(integrity.orphanAttachments, 0);
});

test("legacy content, prompt, task, and action facets resolve to one master item", () => {
  const item = items.find((candidate) => candidate.id === truckIdeaId);
  assert.ok(item);
  assert.equal(items.some((candidate) => candidate.id === truckPromptId), false);
  assert.equal(items.some((candidate) => candidate.id === truckTaskId), false);
  assert.equal(item.kind, "content_idea");
  assert.equal(item.lifecycleStatus, "Waiting");
  assert.equal(item.status, "Not Started");
  assert.equal(item.scheduledAt, "2026-08-03T15:45:00.000Z");
  assert.equal(item.dueDate, "2026-08-03");
  assert.equal(item.followUpDate, "2026-08-05");
  assert.match(item.generatedPrompt ?? "", /^You are acting as Devoted Landscaping/);
});

test("operational schedule uses one active due/follow-up position", () => {
  const item = items.find((candidate) => candidate.id === truckIdeaId)!;

  const beforeDue = projectSchedule([item], "2026-08-02");
  assert.equal(beforeDue.length, 1);
  assert.equal(beforeDue[0].date, "2026-08-03");
  assert.deepEqual(new Set(beforeDue[0].roles), new Set(["work", "due"]));

  const afterDue = projectSchedule([item], "2026-08-04");
  assert.equal(afterDue.length, 2);

  const work = afterDue.find((entry) => entry.date === "2026-08-03");
  const resurfaced = afterDue.find((entry) => entry.date === "2026-08-05");

  assert.deepEqual(work?.roles, ["work"]);
  assert.deepEqual(resurfaced?.roles, ["follow-up"]);
});

test("calendar export projection remains isolated from 4.2 operational resurfacing", () => {
  const item = items.find((candidate) => candidate.id === truckIdeaId)!;
  const schedule = projectCalendarExportSchedule([item]);

  assert.equal(schedule.length, 2);

  const august3 = schedule.find((entry) => entry.date === "2026-08-03");
  const august5 = schedule.find((entry) => entry.date === "2026-08-05");

  assert.deepEqual(new Set(august3?.roles), new Set(["work", "due"]));
  assert.deepEqual(august5?.roles, ["follow-up"]);
});

test("August 2026 is a six-row Sunday-first matrix with August 3 under Monday", () => {
  const cells = calendarCells(2026, 7);
  assert.equal(cells.length, 42);
  assert.equal(cells[0].key, "2026-07-26");
  assert.equal(cells[6].key, "2026-08-01");
  assert.equal(cells[8].key, "2026-08-03");
  assert.equal(8 % 7, 1);
  assert.equal(cells.at(-1)?.key, "2026-09-05");
});

test("copy summary uses the complete canonical payload", () => {
  const item = items.find((candidate) => candidate.id === truckIdeaId)!;
  const summary = formatWorkItemSummary(item);
  assert.match(summary, /^Trading in three old trucks/);
  assert.match(summary, /Record type: Content idea/);
  assert.match(summary, /Status: Not Started/);
  assert.match(summary, /Content stage: Waiting/);
  assert.match(summary, /Work block: 2026-08-03T15:45:00.000Z/);
  assert.match(summary, /Deadline: 2026-08-03/);
  assert.match(summary, /Follow-up: 2026-08-05/);
  assert.match(summary, /GENERATED PROMPT/);
  assert.ok(summary.endsWith(item.generatedPrompt!));
});

test("one resource registry drives accounting and reference resolution", () => {
  const accounting = selectResources(items, [
    "master-accounting",
    "homeworks",
    "adp",
    "amex",
    "wex",
    "sheffield",
    "comptroller",
  ]);
  assert.deepEqual(
    accounting.map((resource) => resource.label),
    [
      "Master Accounting & Bookkeeping Workbook",
      "HomeWorks",
      "ADP RUN",
      "American Express",
      "WEX / Valero",
      "Sheffield Financial",
      "Texas Comptroller",
    ],
  );
  assert.equal(resolveResources(items).length >= accounting.length, true);
  for (const resource of accounting) {
    assert.equal(resource.configured, Boolean(resource.item?.relatedUrl));
  }
});

test("mobile calendar CSS keeps seven equal columns without a scrolling mode row", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.weekday-grid, \.month-grid \{[^}]*grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/s,
  );
  assert.match(
    css,
    /\.calendar-modes \{[^}]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)[^}]*overflow: visible/s,
  );
  assert.match(css, /@media \(max-width: 360px\)/);
});

test("Accounting contains task-oriented quick links and no migration-history copy", async () => {
  const source = await readFile(new URL("../components/views.tsx", import.meta.url), "utf8");
  assert.match(source, /Monthly close quick links/);
  assert.match(source, /Collect statements, reconcile accounts, close the books/);
  assert.doesNotMatch(source, /Canonical revenue source/i);
  assert.doesNotMatch(source, /Jobber is discontinued/i);
});

test("long PDF preserves the final sentinel and computes page numbering after pagination", async () => {
  const source = items.find((candidate) => candidate.id === truckIdeaId)!;
  const sentinel = "FINAL SENTINEL SENTENCE MUST SURVIVE THE PDF EXPORT.";
  const longPrompt = [
    "Curly “quotes”, bullets • middle dots · and em dashes — must remain readable.",
    ...Array.from({ length: 150 }, (_, index) =>
      `${index + 1}. This is a deliberately long prompt paragraph with a_long_unbroken_token_${"x".repeat(90)} and enough words to exercise wrapping.`,
    ),
    sentinel,
  ].join("\n");
  assert.ok(longPrompt.length > 8_000);
  const fixture: WorkItem = {
    ...source,
    id: "pdf-stress-fixture",
    masterRecordId: "pdf-stress-fixture",
    title: "A".repeat(200),
    generatedPrompt: longPrompt,
  };
  const bytes = await makePdf([fixture]);
  const pageCount = (await PDFDocument.load(bytes)).getPageCount();
  assert.ok(pageCount > 1);
  const extraction = spawnSync("pdftotext", ["-", "-"], {
    input: Buffer.from(bytes),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(extraction.status, 0, extraction.stderr);
  assert.match(extraction.stdout, new RegExp(sentinel.replaceAll(".", "\\.")));
  assert.match(extraction.stdout, new RegExp(`Page 1 of ${pageCount}`));
  assert.match(extraction.stdout, new RegExp(`Page ${pageCount} of ${pageCount}`));
  assert.doesNotMatch(extraction.stdout, /\?quotes\?|\? middle dots|\? must remain/);
});

test("a three-item content packet exports as a readable PDF", async () => {
  const content = items.filter((item) => item.kind === "content_idea");
  assert.equal(content.length, 2);
  const packet = [content[0], content[1], { ...content[0], id: "third-content-fixture", title: "Third content packet fixture" }];
  const bytes = await makePdf(packet);
  const parsed = await PDFDocument.load(bytes);
  assert.ok(parsed.getPageCount() >= 1);
  assert.ok(bytes.length > 2_000);
});

test("Schedule source contains semantic overdue and follow-up presentation states", async () => {
  const source = await readFile(
    new URL("../components/views.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /FOLLOW-UP/);
  assert.match(source, /Overdue since/);
  assert.match(source, /OVERDUE/);
  assert.match(source, /Due \$\{formatScheduleDate/);
  assert.match(source, /schedulePresentation/);
});

test("Schedule navigation advances according to active visible range", async () => {
  const source = await readFile(
    new URL("../components/views.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /mode === "Day"/);
  assert.match(source, /plusDays\(selectedDate, direction\)/);
  assert.match(source, /mode === "Week"/);
  assert.match(source, /direction \* 7/);
  assert.match(source, /mode === "3 Months" \? direction \* 3 : direction/);
  assert.match(source, /resetToday/);
});

test("Schedule presentation preserves Work Block meaning when work and deadline share a date", async () => {
  const source = await readFile(
    new URL("../components/views.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /hasWork && hasDue/);
  assert.match(source, /WORK · Due/);
  assert.match(source, /WORK · OVERDUE since/);
  assert.match(source, /event\.timeLabel \?\? "WORK"/);
});

test("Operations uses approved 4.2 semantic labels", async () => {
  const source = await readFile(
    new URL("../components/views.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /title="Needs Action"/);
  assert.match(source, /title="Project Readiness"/);
  assert.doesNotMatch(source, /title="Operations queue"/);
  assert.doesNotMatch(source, /title="What is missing\?"/);
});

test("calendar week uses Sunday through Saturday boundaries", () => {
  const august28 = calendarWeekBounds("2026-08-28");
  assert.deepEqual(august28, {
    start: "2026-08-23",
    end: "2026-08-29",
  });

  const september1 = calendarWeekBounds("2026-09-01");
  assert.deepEqual(september1, {
    start: "2026-08-30",
    end: "2026-09-05",
  });
});

test("Schedule Week view renders the calendar week containing selectedDate", async () => {
  const source = await readFile(
    new URL("../components/views.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /calendarWeekBounds\(selectedDate\)/);
  assert.match(source, /plusDays\(selectedWeek\.start, index\)/);
  assert.doesNotMatch(
    source,
    /plusDays\(selectedDate, index\)/,
  );
});
