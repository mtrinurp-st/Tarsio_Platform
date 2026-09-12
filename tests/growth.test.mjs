import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { pathToFileURL } from "node:url";
const temp = new URL("../.test-runtime/", import.meta.url);
fs.mkdirSync(temp, { recursive: true });
for (const name of ["catalog", "engine", "drafts"]) {
  const source = fs.readFileSync(
    new URL("../src/features/growth/" + name + ".ts", import.meta.url),
    "utf8",
  );
  let js = ts
    .transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
      },
    })
    .outputText.replace(/(["'])\.\/catalog\1/g, '"./catalog.mjs"');
  fs.writeFileSync(new URL(name + ".mjs", temp), js);
}
const { lessons, validateStep } = await import(new URL("catalog.mjs", temp));
const {
  freshState,
  applyAction,
  dayKey,
  effectiveStreak,
  projection,
  financialProgress,
} = await import(new URL("engine.mjs", temp));
const now = new Date("2026-09-10T10:00:00Z");
export function validAnswers(l) {
  const a = {};
  for (const st of l.steps)
    for (const f of st.fields) {
      a[f.id] =
        f.kind === "number" || f.kind === "range"
          ? (f.min ?? 0)
          : f.kind === "check"
            ? true
            : f.kind === "choice"
              ? f.options[0]
              : f.kind === "multi"
                ? [f.options[0]]
                : f.kind === "date"
                  ? "2026-10-10"
                  : "Satu langkah kecil yang realistis";
    }
  if (l.id === "2-3") Object.assign(a, { needs: 50, wants: 30, saving: 20 });
  return a;
}
test("22 published lessons have unique IDs and accept realistic complete inputs", () => {
  assert.equal(lessons.length, 22);
  assert.equal(new Set(lessons.map((l) => l.id)).size, 22);
  for (const l of lessons) {
    const a = validAnswers(l);
    for (let i = 0; i < l.steps.length; i++)
      assert.equal(validateStep(l, i, a), null, l.id);
  }
});
test("empty/invalid forms cannot complete and action plans need two actions", () => {
  for (const l of lessons) assert.notEqual(validateStep(l, 0, {}), null, l.id);
  const l = lessons.find((l) => l.id === "2-2");
  assert.match(validateStep(l, 0, { action0: "One step" }), /dua/);
  assert.equal(validateStep(l, 0, { action0: "One", action1: "Two" }), null);
  const budget = lessons.find((l) => l.id === "2-3");
  assert.match(
    validateStep(budget, 1, {
      needs: 50,
      wants: 40,
      saving: 20,
      insurance: 0,
      investment: 0,
    }),
    /100/,
  );
});
test("lesson XP is idempotent including on a subsequent day", () => {
  const s = freshState();
  s.progress["1-1"] = {
    answers: {},
    step: 0,
    startedAt: now.toISOString(),
    sessionId: "x",
  };
  const a = applyAction(
    s,
    { type: "complete", lessonId: "1-1", singleSession: true },
    now,
  );
  assert.equal(a.xp, 60);
  assert.equal(a.streak, 1);
  assert.equal(
    applyAction(
      a,
      { type: "complete", lessonId: "1-1", singleSession: true },
      new Date("2026-09-11T10:00:00Z"),
    ).xp,
    60,
  );
});
test("daily reward cannot be claimed twice or before its prerequisite", () => {
  let s = freshState();
  assert.throws(() => applyAction(s, { type: "claim", questId: "mood" }, now));
  s = applyAction(s, { type: "mood", value: "Tenang" }, now);
  s = applyAction(s, { type: "claim", questId: "mood" }, now);
  assert.equal(s.gems, 2);
  assert.equal(applyAction(s, { type: "claim", questId: "mood" }, now).xp, 10);
});
test("Jakarta midnight increments streak even within one elapsed hour", () => {
  let s = applyAction(
    freshState(),
    { type: "mood", value: "Tenang" },
    new Date("2026-09-10T16:50:00Z"),
  );
  s = applyAction(
    s,
    { type: "mood", value: "Tenang" },
    new Date("2026-09-10T17:10:00Z"),
  );
  assert.equal(s.streak, 2);
  assert.equal(dayKey(new Date("2026-09-10T17:10:00Z")), "2026-09-11");
});
test("freeze covers one missed calendar day, reset covers longer gap", () => {
  let s = applyAction(freshState(), { type: "mood", value: "Tenang" }, now);
  s.freezes = 1;
  const protectedState = applyAction(
    s,
    { type: "mood", value: "Tenang" },
    new Date("2026-09-12T10:00:00Z"),
  );
  assert.equal(protectedState.streak, 2);
  assert.equal(protectedState.freezes, 0);
  assert.equal(effectiveStreak(s, "2026-09-14"), 0);
  const reset = applyAction(
    s,
    { type: "mood", value: "Tenang" },
    new Date("2026-09-14T10:00:00Z"),
  );
  assert.equal(reset.streak, 1);
  assert.equal(reset.freezes, 1);
});
test("milestone grants gems once and shop enforces affordability/capacity", () => {
  let s = freshState();
  for (let i = 10; i < 13; i++)
    s = applyAction(
      s,
      { type: "mood", value: "Tenang" },
      new Date(`2026-09-${i}T10:00:00Z`),
    );
  assert.equal(s.gems, 10);
  s = applyAction(
    s,
    { type: "mood", value: "Tenang" },
    new Date("2026-09-12T12:00:00Z"),
  );
  assert.equal(s.gems, 10);
  assert.throws(() => applyAction(s, { type: "buy", item: "freeze" }, now));
  s.gems = 100;
  s = applyAction(s, { type: "buy", item: "freeze" }, now);
  s = applyAction(s, { type: "buy", item: "freeze" }, now);
  assert.equal(s.gems, 60);
  assert.throws(() => applyAction(s, { type: "buy", item: "freeze" }, now));
});
test("financial calculations handle zero rates and maximum debt targets", () => {
  assert.equal(projection(100000, 50000, 0, 1), 1250000);
  assert.equal(financialProgress(0, 0, true), 100);
  assert.equal(financialProgress(1000000, 0, true), 0);
  assert.equal(financialProgress(50, 100), 50);
  assert.equal(financialProgress(200, 100, true), 50);
  assert.ok(projection(100000, 50000, 5, 5) > 6050000);
});

const { initialAnswers, draftIsNewer, ownedProgress } = await import(
  new URL("drafts.mjs", temp)
);
test("budget starts at 50/30/20 without mutating prior answers", () => {
  const a = initialAnswers("2-3");
  assert.deepEqual(a, { needs: 50, wants: 30, saving: 20 });
  a.needs = 10;
  assert.equal(initialAnswers("2-3").needs, 50);
  assert.deepEqual(initialAnswers("1-1"), {});
});
test("pending draft timestamp comparison uses instants, not ISO string order", () => {
  const p = {
    answers: {},
    step: 0,
    startedAt: now.toISOString(),
    sessionId: "s",
  };
  assert.equal(
    draftIsNewer(
      { ...p, updatedAt: "2026-09-11T10:00:00+07:00" },
      { ...p, updatedAt: "2026-09-11T04:00:00Z" },
    ),
    false,
  );
  assert.equal(
    draftIsNewer(
      { ...p, updatedAt: "2026-09-11T10:00:00+07:00" },
      { ...p, updatedAt: "2026-09-11T03:00:00Z" },
    ),
    false,
  );
  assert.equal(
    draftIsNewer(
      { ...p, updatedAt: "2026-09-11T10:01:00+07:00" },
      { ...p, updatedAt: "2026-09-11T03:00:00Z" },
    ),
    true,
  );
  assert.equal(ownedProgress("alice", p).ownerId, "alice");
  assert.throws(() => ownedProgress("device", p));
});
