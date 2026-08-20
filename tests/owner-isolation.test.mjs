import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Miniflare } from "miniflare";

const ownerEmail = "owner@devoted-business.test";
const secondEmail = "second-user@devoted-business.test";

function request(path, email, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("oai-authenticated-user-email", email);
  return new Request(`http://localhost${path}`, { ...init, headers });
}

test("a simulated second user cannot read the recovered workspace", async () => {
  const miniflare = new Miniflare({
    compatibilityDate: "2026-08-05",
    compatibilityFlags: ["nodejs_compat"],
    modules: true,
    script: "export default { fetch() { return new Response('ok') } }",
    d1Databases: { DB: "devoted-owner-isolation-test" },
  });
  try {
    const db = await miniflare.getD1Database("DB");
    const migration = await readFile(
      new URL("../drizzle/0000_lying_random.sql", import.meta.url),
      "utf8",
    );
    await db.exec(migration);

    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("isolation", `${process.pid}-${Date.now()}`);
    const { default: worker } = await import(workerUrl.href);
    const env = {
      DB: db,
      BUCKET: {
        get: async () => null,
        put: async () => undefined,
        delete: async () => undefined,
      },
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    };
    const ctx = { waitUntil() {}, passThroughOnException() {} };

    const ownerResponse = await worker.fetch(
      request("/api/bootstrap", ownerEmail),
      env,
      ctx,
    );
    assert.equal(ownerResponse.status, 200);
    const owner = await ownerResponse.json();
    assert.equal(owner.records.length, 70);
    assert.equal(owner.actions.length, 9);
    assert.equal(owner.attachments.length, 6);
    assert.match(JSON.stringify(owner), /Trading in three old trucks/);

    const secondResponse = await worker.fetch(
      request("/api/bootstrap", secondEmail),
      env,
      ctx,
    );
    assert.equal(secondResponse.status, 200);
    const second = await secondResponse.json();
    assert.equal(second.records.length, 0);
    assert.equal(second.actions.length, 0);
    assert.equal(second.attachments.length, 0);
    assert.equal(second.workItems.length, 0);
    assert.doesNotMatch(JSON.stringify(second), /Trading in three old trucks/);

    const exportResponse = await worker.fetch(
      request("/api/export", secondEmail, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ format: "json" }),
      }),
      env,
      ctx,
    );
    assert.equal(exportResponse.status, 400);

    const attachmentId = owner.attachments[0].id;
    const attachmentResponse = await worker.fetch(
      request(`/api/attachments?id=${encodeURIComponent(attachmentId)}`, secondEmail),
      env,
      ctx,
    );
    assert.equal(attachmentResponse.status, 404);
  } finally {
    await miniflare.dispose();
  }
});
