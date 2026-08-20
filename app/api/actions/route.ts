import { updateAction } from "@/lib/repository";
import { apiError, requireWorkspaceIdentity } from "@/lib/server-auth";
import type { ActionItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const owner = await requireWorkspaceIdentity();
    const input = (await request.json()) as Partial<ActionItem> & { id?: string };
    if (!input.id) {
      return Response.json({ error: "Action id is required" }, { status: 400 });
    }
    const action = await updateAction(owner.email, input.id, input);
    if (!action) return Response.json({ error: "Action not found" }, { status: 404 });
    return Response.json({ action });
  } catch (error) {
    return apiError(error);
  }
}

