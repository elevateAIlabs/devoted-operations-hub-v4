import {
  createRecord,
  permanentlyDeleteRecord,
  updateRecord,
} from "@/lib/repository";
import { apiError, requireWorkspaceIdentity } from "@/lib/server-auth";
import type { DevotedRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const owner = await requireWorkspaceIdentity();
    const input = (await request.json()) as Partial<DevotedRecord> & {
      title?: string;
      generatedPrompt?: string | null;
    };
    if (!input.title?.trim()) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }
    const record = await createRecord(owner.email, {
      ...input,
      title: input.title,
    });
    return Response.json({ record }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const owner = await requireWorkspaceIdentity();
    const input = (await request.json()) as Partial<DevotedRecord> & {
      id?: string;
      generatedPrompt?: string | null;
      primaryActionId?: string | null;
      executionStatus?: string | null;
      executionCompletedAt?: string | null;
    };
    if (!input.id) {
      return Response.json({ error: "Record id is required" }, { status: 400 });
    }
    const record = await updateRecord(owner.email, input.id, input);
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });
    return Response.json({ record });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const owner = await requireWorkspaceIdentity();
    const input = (await request.json()) as {
      id?: string;
      mode?: "archive" | "restore" | "permanent";
      confirmation?: string;
    };
    if (!input.id) {
      return Response.json({ error: "Record id is required" }, { status: 400 });
    }
    if (input.mode === "permanent") {
      if (input.confirmation !== "DELETE") {
        return Response.json(
          { error: "Type DELETE to permanently remove this item" },
          { status: 400 },
        );
      }
      await permanentlyDeleteRecord(owner.email, input.id);
      return Response.json({ deleted: true });
    }
    const archivedAt = input.mode === "restore" ? null : new Date().toISOString();
    const record = await updateRecord(owner.email, input.id, { archivedAt });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });
    return Response.json({ record });
  } catch (error) {
    return apiError(error);
  }
}
