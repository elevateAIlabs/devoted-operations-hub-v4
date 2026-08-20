import { updateAction } from "@/lib/repository";
import { apiError, requireWorkspaceIdentity } from "@/lib/server-auth";
import type { ActionItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const owner = await requireWorkspaceIdentity();
    const input = (await request.json()) as {
      ids?: string[];
      changes?: Partial<ActionItem>;
    };
    const ids = [...new Set(input.ids ?? [])].slice(0, 100);
    if (!ids.length || !input.changes) {
      return Response.json({ error: "Action ids and changes are required" }, { status: 400 });
    }
    const results = [];
    for (const id of ids) results.push(await updateAction(owner.email, id, input.changes));
    return Response.json({ actions: results.filter(Boolean) });
  } catch (error) {
    return apiError(error);
  }
}

