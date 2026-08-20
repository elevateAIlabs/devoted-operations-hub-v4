import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { attachments, records } from "@/db/schema";
import { apiError, requireWorkspaceIdentity } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function getBucket() {
  const { env } = getCloudflareContext();
  const runtimeEnv = env as unknown as { BUCKET?: R2Bucket };

  if (!runtimeEnv.BUCKET) {
    throw new Error(
      "Cloudflare R2 binding `BUCKET` is unavailable. Verify the `BUCKET` R2 binding in wrangler.json."
    );
  }

  return runtimeEnv.BUCKET;
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "attachment";
}

export async function GET(request: Request) {
  try {
    const owner = await requireWorkspaceIdentity();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return Response.json({ error: "Attachment id is required" }, { status: 400 });
    const db = getDb();
    const rows = await db
      .select()
      .from(attachments)
      .where(and(eq(attachments.ownerEmail, owner.email), eq(attachments.id, id)))
      .limit(1);
    const attachment = rows[0];
    if (!attachment) return Response.json({ error: "Attachment not found" }, { status: 404 });
    if (!attachment.available || !attachment.storageKey) {
      return Response.json(
        { error: "The original file has not been restored yet", attachment },
        { status: 404 },
      );
    }
    const object = await getBucket().get(attachment.storageKey);
    if (!object) return Response.json({ error: "Attachment bytes are unavailable" }, { status: 404 });
    return new Response(object.body, {
      headers: {
        "Content-Type": attachment.contentType,
        "Content-Disposition": `inline; filename="${safeName(attachment.fileName)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const owner = await requireWorkspaceIdentity();
    const form = await request.formData();
    const file = form.get("file");
    const recordId = String(form.get("recordId") ?? "");
    const actionId = String(form.get("actionId") ?? "") || null;
    const caption = String(form.get("caption") ?? "");
    if (!(file instanceof File) || !recordId) {
      return Response.json({ error: "A file and recordId are required" }, { status: 400 });
    }
    if (file.size > 25 * 1024 * 1024) {
      return Response.json({ error: "Attachments must be 25 MB or smaller" }, { status: 413 });
    }
    const db = getDb();
    const parent = await db
      .select({ id: records.id })
      .from(records)
      .where(and(eq(records.ownerEmail, owner.email), eq(records.id, recordId)))
      .limit(1);
    if (!parent.length) return Response.json({ error: "Record not found" }, { status: 404 });
    const id = crypto.randomUUID();
    const ownerKey = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(owner.email),
    );
    const ownerPrefix = [...new Uint8Array(ownerKey)]
      .slice(0, 10)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    const storageKey = `${ownerPrefix}/${recordId}/${id}-${safeName(file.name)}`;
    await getBucket().put(storageKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });
    const timestamp = new Date().toISOString();
    const attachment = {
      id,
      ownerEmail: owner.email,
      recordId,
      actionId,
      fileName: file.name,
      caption,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      isCover: false,
      available: true,
      storageKey,
      archivedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.insert(attachments).values(attachment);
    return Response.json({ attachment }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const owner = await requireWorkspaceIdentity();
    const input = (await request.json()) as {
      id?: string;
      caption?: string;
      isCover?: boolean;
      archivedAt?: string | null;
    };
    if (!input.id) return Response.json({ error: "Attachment id is required" }, { status: 400 });
    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const key of ["caption", "isCover", "archivedAt"] as const) {
      if (key in input) patch[key] = input[key];
    }
    const db = getDb();
    await db
      .update(attachments)
      .set(patch)
      .where(and(eq(attachments.ownerEmail, owner.email), eq(attachments.id, input.id)));
    return Response.json({ updated: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const owner = await requireWorkspaceIdentity();
    const input = (await request.json()) as { id?: string };
    if (!input.id) return Response.json({ error: "Attachment id is required" }, { status: 400 });
    const db = getDb();
    const rows = await db
      .select()
      .from(attachments)
      .where(and(eq(attachments.ownerEmail, owner.email), eq(attachments.id, input.id)))
      .limit(1);
    const attachment = rows[0];
    if (!attachment) return Response.json({ error: "Attachment not found" }, { status: 404 });
    if (attachment.storageKey) await getBucket().delete(attachment.storageKey);
    await db
      .delete(attachments)
      .where(and(eq(attachments.ownerEmail, owner.email), eq(attachments.id, input.id)));
    return Response.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
