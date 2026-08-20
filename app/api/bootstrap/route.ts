import { canonicalizeRecords, integritySummary } from "@/lib/canonical";
import { loadWorkspace } from "@/lib/repository";
import { apiError, requireWorkspaceIdentity } from "@/lib/server-auth";
import type { BootstrapPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const owner = await requireWorkspaceIdentity();
    const workspace = await loadWorkspace(owner.email);
    const workItems = canonicalizeRecords(workspace.records, workspace.actions);
    const payload: BootstrapPayload = {
      ...workspace,
      owner,
      workItems,
      integrity: integritySummary(
        workspace.records,
        workspace.actions,
        workspace.attachments,
      ),
    };
    return Response.json(payload, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}

