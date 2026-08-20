import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  const { env } = getCloudflareContext();
  const runtimeEnv = env as unknown as { DB?: D1Database };

  if (!runtimeEnv.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Verify the `DB` D1 binding in wrangler.json."
    );
  }

  return drizzle(runtimeEnv.DB, { schema });
}
