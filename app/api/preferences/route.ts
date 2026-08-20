import { updatePreferences } from "@/lib/repository";
import { apiError, requireWorkspaceIdentity } from "@/lib/server-auth";
import type { Preferences } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const owner = await requireWorkspaceIdentity();
    const input = (await request.json()) as Partial<Preferences>;
    const next = await updatePreferences(owner.email, input);
    return Response.json({ preferences: next });
  } catch (error) {
    return apiError(error);
  }
}

