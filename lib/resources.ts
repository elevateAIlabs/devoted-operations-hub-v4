import type { WorkItem } from "./types";

export type ResourceKey =
  | "master-accounting"
  | "homeworks"
  | "adp"
  | "amex"
  | "wex"
  | "sheffield"
  | "comptroller"
  | "google-drive"
  | "sales-tax"
  | "banking"
  | "insurance"
  | "fleet"
  | "website";

type ResourceDefinition = {
  key: ResourceKey;
  label: string;
  match: string[];
};

export const RESOURCE_REGISTRY: readonly ResourceDefinition[] = [
  {
    key: "master-accounting",
    label: "Master Accounting & Bookkeeping Workbook",
    match: ["d.a.i.s.y. master workbook", "master accounting", "bookkeeping workbook"],
  },
  { key: "homeworks", label: "HomeWorks", match: ["homeworks login"] },
  { key: "adp", label: "ADP RUN", match: ["run powered by adp", "adp login"] },
  { key: "amex", label: "American Express", match: ["american express", "amex"] },
  { key: "wex", label: "WEX / Valero", match: ["wex", "valero"] },
  { key: "sheffield", label: "Sheffield Financial", match: ["sheffield"] },
  {
    key: "comptroller",
    label: "Texas Comptroller",
    match: ["texas comptroller webfile", "comptroller webfile"],
  },
  {
    key: "google-drive",
    label: "Google Drive / shared business folder",
    match: ["google drive / shared business folder", "google drive"],
  },
  {
    key: "sales-tax",
    label: "Devoted Sales Tax Reconciliation Site",
    match: ["devoted sales tax reconciliation"],
  },
  { key: "banking", label: "Banking portal", match: ["banking portal"] },
  { key: "insurance", label: "Insurance portal", match: ["insurance portal"] },
  {
    key: "fleet",
    label: "Vehicle / fleet portal",
    match: ["vehicle / fleet portal", "fleet portal"],
  },
  { key: "website", label: "Devoted website", match: ["devoted website"] },
] as const;

export type ResolvedResource = ResourceDefinition & {
  item: WorkItem | null;
  configured: boolean;
};

export function resolveResources(items: WorkItem[]): ResolvedResource[] {
  const links = items.filter((item) => item.kind === "link" && !item.archivedAt);
  return RESOURCE_REGISTRY.map((definition) => {
    const item =
      links.find((candidate) => {
        const title = candidate.title.toLowerCase();
        return definition.match.some((needle) => title.includes(needle));
      }) ?? null;
    return {
      ...definition,
      item,
      configured: Boolean(item?.relatedUrl),
    };
  });
}

export function selectResources(
  items: WorkItem[],
  keys: readonly ResourceKey[],
): ResolvedResource[] {
  const wanted = new Set(keys);
  return resolveResources(items).filter((resource) => wanted.has(resource.key));
}
