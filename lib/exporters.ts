import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import {
  formatWorkItemSummary,
  projectSchedule,
  workItemCopyModel,
} from "./canonical";
import type { WorkItem } from "./types";

export function safeFileName(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 92) || "devoted-hq-export"
  );
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function makeCsv(items: WorkItem[]) {
  const columns = [
    "id",
    "type",
    "title",
    "status",
    "priority",
    "owner",
    "workstream",
    "scheduled_at",
    "due_date",
    "follow_up_date",
    "waiting_on",
    "related_url",
    "tags",
    "body",
    "generated_prompt",
  ];
  const rows = items.map((item) => [
    item.id,
    item.typeLabel,
    item.title,
    item.status,
    item.priority,
    item.assignee,
    item.workstream,
    item.scheduledAt,
    item.dueDate,
    item.followUpDate,
    item.waitingOn,
    item.relatedUrl,
    item.tags.join(", "),
    item.body,
    item.generatedPrompt,
  ]);
  return [columns.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))].join(
    "\r\n",
  );
}

export function makeText(items: WorkItem[]) {
  return items.map(formatWorkItemSummary).join("\n\n---\n\n");
}

function emlSafe(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function makeEml(items: WorkItem[], recipient = "") {
  const title = items.length === 1 ? items[0].title : `${items.length} Devoted HQ items`;
  const body = makeText(items).replaceAll("\n", "\r\n");
  return [
    `To: ${emlSafe(recipient)}`,
    `Subject: ${emlSafe(`Devoted HQ - ${title}`)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
    "",
  ].join("\r\n");
}

function icsEscape(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll(/\r?\n/g, "\\n");
}

function foldIcsLine(value: string) {
  const result: string[] = [];
  let remaining = value;
  while (remaining.length > 73) {
    result.push(remaining.slice(0, 73));
    remaining = ` ${remaining.slice(73)}`;
  }
  result.push(remaining);
  return result.join("\r\n");
}

function localIcsDateTime(value: string) {
  const local = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (local) {
    return `${local[1]}${local[2]}${local[3]}T${local[4]}${local[5]}${local[6] ?? "00"}`;
  }
  const parsed = new Date(value);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(parsed);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "00";
  return `${part("year")}${part("month")}${part("day")}T${part("hour")}${part("minute")}${part("second")}`;
}

export function makeIcs(items: WorkItem[]) {
  const projections = projectSchedule(items);
  const generatedAt = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const events: string[] = [];
  for (const projection of projections) {
    const hasWork = projection.roles.includes("work") && projection.item.scheduledAt;
    const roleLabel = projection.roles
      .map((role) => (role === "follow-up" ? "Follow-up" : role === "due" ? "Due" : "Work"))
      .join(" + ");
    const start = hasWork
      ? `DTSTART;TZID=America/Chicago:${localIcsDateTime(projection.item.scheduledAt!)}`
      : `DTSTART;VALUE=DATE:${projection.date.replaceAll("-", "")}`;
    const end = hasWork
      ? `DURATION:PT${Math.max(15, projection.item.effortMinutes ?? 30)}M`
      : `DTEND;VALUE=DATE:${nextDate(projection.date).replaceAll("-", "")}`;
    events.push(
      [
        "BEGIN:VEVENT",
        `UID:${projection.item.id}-${projection.date}@devoted-hq`,
        `DTSTAMP:${generatedAt}`,
        start,
        end,
        `SUMMARY:${icsEscape(`${roleLabel}: ${projection.item.title}`)}`,
        `DESCRIPTION:${icsEscape(formatWorkItemSummary(projection.item))}`,
        projection.item.relatedUrl ? `URL:${icsEscape(projection.item.relatedUrl)}` : null,
        "BEGIN:VALARM",
        "TRIGGER:-PT30M",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(projection.item.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ]
        .filter(Boolean)
        .map((line) => foldIcsLine(line as string))
        .join("\r\n"),
    );
  }
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Devoted Landscaping//Devoted HQ V4//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function nextDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function pdfSafe(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\u00a0/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u2022/g, "-")
    .replace(/\u00b7/g, "-")
    .replace(/[\u2190-\u21ff]/g, "->")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function splitLongToken(token: string, font: PDFFont, size: number, maxWidth: number) {
  const parts: string[] = [];
  let current = "";
  for (const character of token) {
    const next = current + character;
    if (current && font.widthOfTextAtSize(next, size) > maxWidth) {
      parts.push(current);
      current = character;
    } else {
      current = next;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function wrapLine(value: string, font: PDFFont, size: number, maxWidth: number) {
  const rawWords = pdfSafe(value).split(/\s+/).filter(Boolean);
  const words = rawWords.flatMap((word) =>
    font.widthOfTextAtSize(word, size) > maxWidth
      ? splitLongToken(word, font, size, maxWidth)
      : [word],
  );
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function makePdf(items: WorkItem[]) {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const width = 612;
  const height = 792;
  const left = 48;
  const right = 48;
  const headerBottom = 728;
  const footerTop = 42;
  const textWidth = width - left - right;
  let page!: PDFPage;
  let y = headerBottom;

  const newPage = () => {
    page = document.addPage([width, height]);
    page.drawRectangle({ x: 0, y: height - 52, width, height: 52, color: rgb(0.055, 0.055, 0.055) });
    page.drawRectangle({ x: 0, y: height - 52, width: 8, height: 52, color: rgb(1, 0.35, 0) });
    page.drawText("DEVOTED HQ", { x: left, y: height - 32, size: 14, font: bold, color: rgb(1, 1, 1) });
    page.drawText("WORK ITEM EXPORT", {
      x: width - right - 118,
      y: height - 30,
      size: 8,
      font: bold,
      color: rgb(1, 0.35, 0),
    });
    y = headerBottom;
  };

  const ensure = (heightNeeded: number) => {
    if (y - heightNeeded < footerTop) newPage();
  };

  const paragraph = (
    value: string,
    options: {
      size?: number;
      font?: PDFFont;
      color?: ReturnType<typeof rgb>;
      before?: number;
      after?: number;
      keepWithNextHeight?: number;
    } = {},
  ) => {
    const size = options.size ?? 9.5;
    const selectedFont = options.font ?? regular;
    const lineHeight = size * 1.38;
    const lines = value === "" ? [""] : wrapLine(value, selectedFont, size, textWidth);
    ensure(
      (options.before ?? 0) +
        lineHeight +
        (options.keepWithNextHeight ?? 0),
    );
    y -= options.before ?? 0;
    for (const line of lines) {
      if (y - lineHeight < footerTop) newPage();
      page.drawText(line, {
        x: left,
        y,
        size,
        font: selectedFont,
        color: options.color ?? rgb(0.13, 0.13, 0.13),
      });
      y -= lineHeight;
    }
    const after = options.after ?? 0;
    y = Math.max(footerTop, y - after);
  };

  const sectionHeading = (label: string, firstBodyLine = "") => {
    const bodySize = 9.5;
    const firstLineHeight = firstBodyLine
      ? bodySize * 1.38
      : 0;
    paragraph(label, {
      size: 8,
      font: bold,
      color: rgb(0.95, 0.3, 0),
      before: 10,
      after: 5,
      keepWithNextHeight: firstLineHeight,
    });
  };

  const blockLines = (value: string) => value.split(/\r?\n/);

  newPage();
  items.forEach((item, itemIndex) => {
    const model = workItemCopyModel(item);
    if (itemIndex > 0) {
      ensure(72);
      y -= 12;
      page.drawLine({
        start: { x: left, y },
        end: { x: width - right, y },
        thickness: 1,
        color: rgb(0.86, 0.86, 0.84),
      });
      y -= 20;
    }
    const titleLines = wrapLine(model.title, bold, 16, textWidth);
    const titleBlockHeight = titleLines.length * 16 * 1.38 + 34;
    ensure(Math.min(titleBlockHeight, headerBottom - footerTop));
    paragraph(model.title, { size: 16, font: bold, after: 8 });
    for (const row of model.metadata) {
      paragraph(row, {
        size: 8,
        font: bold,
        color: rgb(0.95, 0.3, 0),
        after: 2,
      });
    }
    y = Math.max(footerTop, y - 5);

    if (model.schedule.length) {
      const scheduleHeight = model.schedule.length * 9 * 1.38 + 7;
      ensure(scheduleHeight);
      for (const row of model.schedule) {
        paragraph(row, { size: 9, font: bold, after: 2 });
      }
      y = Math.max(footerTop, y - 5);
    }

    if (model.nextAction) {
      sectionHeading("NEXT ACTION", model.nextAction);
      paragraph(model.nextAction, { after: 4 });
    }

    if (model.overview) {
      const overviewBlocks = blockLines(model.overview);
      sectionHeading("OVERVIEW", overviewBlocks[0] ?? "");
      for (const block of overviewBlocks) {
        paragraph(block, { after: block ? 3 : 5 });
      }
    }
    if (model.generatedPrompt) {
      const promptBlocks = blockLines(model.generatedPrompt);
      sectionHeading("GENERATED PROMPT", promptBlocks[0] ?? "");
      for (const block of promptBlocks) {
        paragraph(block, { after: block ? 2 : 5 });
      }
    }
  });

  const pages = document.getPages();
  pages.forEach((currentPage, index) => {
    currentPage.drawLine({
      start: { x: left, y: 34 },
      end: { x: width - right, y: 34 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    currentPage.drawText("Devoted Landscaping - Internal", {
      x: left,
      y: 20,
      size: 7,
      font: regular,
      color: rgb(0.4, 0.4, 0.4),
    });
    const label = `Page ${index + 1} of ${pages.length}`;
    currentPage.drawText(label, {
      x: width - right - regular.widthOfTextAtSize(label, 7),
      y: 20,
      size: 7,
      font: regular,
      color: rgb(0.4, 0.4, 0.4),
    });
  });

  return document.save();
}
