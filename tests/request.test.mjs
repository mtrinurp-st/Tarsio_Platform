import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync(
  new URL("../src/features/growth/request.ts", import.meta.url),
  "utf8",
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { withDeadline, boundedFetch } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
test("a stalled SDK/auth promise releases the waiting UI", async () => {
  await assert.rejects(
    withDeadline(new Promise(() => {}), 10),
    /REQUEST_TIMEOUT/,
  );
});
test("deadline preserves SDK success and errors", async () => {
  assert.equal(await withDeadline(Promise.resolve("session"), 100), "session");
  const error = new Error("auth failed");
  await assert.rejects(
    withDeadline(Promise.reject(error), 100),
    (e) => e === error,
  );
});
test("network wrapper preserves caller cancellation", async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  globalThis.fetch = async (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener(
        "abort",
        () => reject(new Error("cancelled")),
        { once: true },
      );
    });
  try {
    const request = boundedFetch("https://example.test", {
      signal: controller.signal,
    });
    controller.abort();
    await assert.rejects(request, /cancelled/);
  } finally {
    globalThis.fetch = original;
  }
});
