import { canonicalizeRecords } from "@/lib/canonical";
import { makeCsv, makeEml, makeIcs, makePdf, makeText, safeFileName } from "@/lib/exporters";
import { loadWorkspace } from "@/lib/repository";
import { apiError, requireWorkspaceIdentity } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

type ExportFormat = "json" | "csv" | "ics" | "txt" | "eml" | "pdf";

async function exportResponse(format: ExportFormat, ids: string[] | null, includeArchived: boolean) {
  const owner = await requireWorkspaceIdentity();
  const workspace = await loadWorkspace(owner.email);
  let items = canonicalizeRecords(workspace.records, workspace.actions);
  const isFullBackup = format === "json" && !ids?.length;
  if (!isFullBackup) {
    if (!includeArchived) items = items.filter((item) => !item.archivedAt);
    if (ids?.length) {
      const selected = new Set(ids);
      items = items.filter((item) => selected.has(item.id));
    }
  }
  if (!items.length) return Response.json({ error: "No items selected" }, { status: 400 });

  const base =
    isFullBackup
      ? "devoted-hq-full-backup"
      : items.length === 1
        ? safeFileName(items[0].title)
        : `devoted-hq-${items.length}-items`;
  let body: BodyInit;
  let type: string;
  let extension = format;
  if (format === "json") {
    const relatedRecordIds = new Set(
      isFullBackup ? workspace.records.map((record) => record.id) : items.map((item) => item.id),
    );
    if (!isFullBackup) {
      let foundRelatedRecord = true;
      while (foundRelatedRecord) {
        foundRelatedRecord = false;
        for (const record of workspace.records) {
          if (
            record.sourceRecordId &&
            relatedRecordIds.has(record.sourceRecordId) &&
            !relatedRecordIds.has(record.id)
          ) {
            relatedRecordIds.add(record.id);
            foundRelatedRecord = true;
          }
        }
      }
    }
    body = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        records: workspace.records.filter((record) => relatedRecordIds.has(record.id)),
        actions: workspace.actions.filter((action) =>
          relatedRecordIds.has(action.sourceRecordId),
        ),
        attachments: workspace.attachments.filter((attachment) =>
          relatedRecordIds.has(attachment.recordId),
        ),
        preferences: workspace.preferences,
        migration: workspace.migration,
      },
      null,
      2,
    );
    type = "application/json; charset=utf-8";
  } else if (format === "csv") {
    body = makeCsv(items);
    type = "text/csv; charset=utf-8";
  } else if (format === "ics") {
    body = makeIcs(items);
    type = "text/calendar; charset=utf-8";
  } else if (format === "eml") {
    body = makeEml(items);
    type = "message/rfc822; charset=utf-8";
  } else if (format === "pdf") {
    const bytes = await makePdf(items);
    body = bytes.buffer instanceof ArrayBuffer
      ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
      : new Uint8Array(bytes).buffer;
    type = "application/pdf";
  } else {
    body = makeText(items);
    type = "text/plain; charset=utf-8";
    extension = "txt";
  }
  return new Response(body, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="${base}.${extension}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const format = (url.searchParams.get("format") ?? "json") as ExportFormat;
    const ids = url.searchParams.getAll("id");
    return exportResponse(format, ids.length ? ids : null, false);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as {
      format?: ExportFormat;
      ids?: string[];
      includeArchived?: boolean;
    };
    return exportResponse(
      input.format ?? "json",
      input.ids?.length ? input.ids : null,
      Boolean(input.includeArchived),
    );
  } catch (error) {
    return apiError(error);
  }
}
