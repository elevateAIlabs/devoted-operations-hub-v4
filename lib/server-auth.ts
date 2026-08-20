import { headers } from "next/headers";
import { NextResponse } from "next/server";

export interface WorkspaceIdentity {
  email: string;
  displayName: string;
}

export function apiError(messageOrError: unknown, status = 400) {
  const message =
    messageOrError instanceof Error
      ? messageOrError.message
      : typeof messageOrError === "string"
      ? messageOrError
      : String(messageOrError ?? "An unknown error occurred");

  return NextResponse.json({ error: message }, { status });
}

function safeDecode(value: string | null, encoding: string | null): string | null {
  if (!value) return null;
  try {
    if (encoding === "base64") {
      return Buffer.from(value, "base64").toString("utf-8");
    }
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function requireWorkspaceIdentity(): Promise<WorkspaceIdentity> {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const fullName = safeDecode(
    requestHeaders.get("oai-authenticated-user-full-name"),
    requestHeaders.get("oai-authenticated-user-full-name-encoding"),
  );
  if (email) return { email: email.toLowerCase(), displayName: fullName ?? email };

  const previewEmail =
    requestHeaders.get("x-dev-owner-email") ?? "gibby3579@gmail.com";
  return {
    email: previewEmail.toLowerCase(),
    displayName: previewEmail === "gibby3579@gmail.com" ? "Greg Gibson" : previewEmail,
  };
}
