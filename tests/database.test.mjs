import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import ts from "typescript";
const js = ts.transpileModule(
  fs.readFileSync(
    new URL("../src/features/growth/catalog.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const { lessons } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
const db = new PGlite();
const ids = {
  alice: "10000000-0000-4000-8000-000000000001",
  bob: "10000000-0000-4000-8000-000000000002",
  admin: "10000000-0000-4000-8000-000000000003",
};
let currentUserId;
async function asUser(name) {
  currentUserId = ids[name];
  await db.exec("RESET ROLE");
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
    ids[name],
  ]);
  await db.exec("SET ROLE authenticated");
}
async function rpc(name, args = []) {
  args = [...args];
  if (name === "growth_save_progress")
    args[1] = { ownerId: currentUserId, ...args[1] };
  if (name === "growth_action" || name === "growth_settings")
    args[0] = { expectedUserId: currentUserId, ...args[0] };
  const params = args.map((_, i) => "$" + (i + 1)).join(",");
  const r = await db.query(`SELECT public.${name}(${params}) AS result`, args);
  return r.rows[0]?.result;
}
function answers(l) {
  const a = {};
  for (const st of l.steps)
    for (const f of st.fields)
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
                  : "Langkah realistis";
  if (l.id === "2-3") Object.assign(a, { needs: 50, wants: 30, saving: 20 });
  return a;
}
await test("Postgres integration: migrations, forms, rewards, privacy, roles, CMS and squads", async (t) => {
  try {
    await db.exec(
      `CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;GRANT USAGE ON SCHEMA auth TO anon,authenticated;GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated;`,
    );
    for (const file of fs
      .readdirSync(new URL("../supabase/migrations/", import.meta.url))
      .sort()) {
      await db.exec(
        fs.readFileSync(
          new URL("../supabase/migrations/" + file, import.meta.url),
          "utf8",
        ),
      );
    }
    await db.exec(
      fs.readFileSync(
        new URL("../supabase/pending/community_quests.sql", import.meta.url),
        "utf8",
      ),
    );
    for (const [name, id] of Object.entries(ids))
      await db.query(
        "INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,$3)",
        [id, name + "@example.test", JSON.stringify({ display_name: name })],
      );
    await db.query("UPDATE public.profiles SET role='admin' WHERE id=$1", [
      ids.admin,
    ]);
    await asUser("alice");
    await t.test(
      "queued private writes reject a different account owner",
      async () => {
        await assert.rejects(
          rpc("growth_save_progress", [
            "1-1",
            { ownerId: ids.bob, answers: {}, step: 0, sessionId: "s" },
          ]),
          /Akun telah berubah/,
        );
        await assert.rejects(
          rpc("growth_action", [
            { type: "mood", value: "Tenang", expectedUserId: ids.bob },
          ]),
          /Akun telah berubah/,
        );
        await assert.rejects(
          rpc("growth_settings", [
            { name: "Wrong account", expectedUserId: ids.bob },
          ]),
          /Akun telah berubah/,
        );
      },
    );
    await t.test(
      "reward fields and role cannot be edited directly",
      async () => {
        await assert.rejects(
          db.query("UPDATE public.profiles SET role='admin' WHERE id=$1", [
            ids.alice,
          ]),
          /permission denied/,
        );
        await assert.rejects(
          rpc("growth_settings", [{ xp: 999999 }]),
          /not editable/,
        );
        await assert.rejects(rpc("growth_analytics"), /Admin only/);
      },
    );
    await t.test(
      "gated lessons and incomplete submissions rejected",
      async () => {
        await rpc("growth_load");
        await assert.rejects(
          rpc("growth_save_progress", [
            "2-1",
            { answers: {}, step: 0, sessionId: "s" },
          ]),
          /sebelumnya/,
        );
        await rpc("growth_save_progress", [
          "1-1",
          { answers: {}, step: 0, sessionId: "s" },
        ]);
        await assert.rejects(
          rpc("growth_action", [
            { type: "complete", lessonId: "1-1", sessionId: "s" },
          ]),
          /Lengkapi/,
        );
      },
    );
    await t.test(
      "all 22 lesson payloads complete and XP is awarded exactly once",
      async () => {
        await rpc("growth_settings", [{ freeRoam: true }]);
        for (const l of lessons) {
          await rpc("growth_save_progress", [
            l.id,
            { answers: answers(l), step: l.steps.length - 1, sessionId: "s" },
          ]);
          await rpc("growth_action", [
            { type: "complete", lessonId: l.id, sessionId: "s" },
          ]);
        }
        const before = await rpc("growth_load");
        assert.equal(Object.keys(before.progress).length, 22);
        assert.equal(before.xp, 22 * 60);
        await rpc("growth_action", [
          { type: "complete", lessonId: "1-1", sessionId: "s" },
        ]);
        assert.equal((await rpc("growth_load")).xp, before.xp);
      },
    );
    await t.test(
      "daily reward prerequisites and replay protection run on server",
      async () => {
        await assert.rejects(
          rpc("growth_action", [{ type: "claim", questId: "mood" }]),
          /Selesaikan/,
        );
        await rpc("growth_action", [{ type: "mood", value: "Tenang" }]);
        const one = await rpc("growth_action", [
          { type: "claim", questId: "mood" },
        ]);
        const two = await rpc("growth_action", [
          { type: "claim", questId: "mood" },
        ]);
        assert.equal(two.xp, one.xp);
        assert.equal(two.gems, one.gems);
        await assert.rejects(
          rpc("growth_action", [{ type: "buy", item: "freeze" }]),
          /Gems/,
        );
      },
    );
    await t.test(
      "another user and admin cannot select personal reflections",
      async () => {
        await asUser("bob");
        assert.equal(
          (await db.query("SELECT * FROM public.growth_progress")).rows.length,
          0,
        );
        await assert.rejects(
          db.query(
            "INSERT INTO public.growth_xp_ledger(user_id,event_key,xp) VALUES($1,$2,$3)",
            [ids.bob, "forged", 999],
          ),
          /permission denied/,
        );
        await asUser("admin");
        assert.equal(
          (await db.query("SELECT * FROM public.growth_progress")).rows.length,
          0,
        );
        const a = await rpc("growth_analytics");
        assert.equal(a.completedQuests, 22);
      },
    );
    await t.test(
      "CMS draft is admin-only and revision is written",
      async () => {
        const l = {
          ...lessons[0],
          id: "test-draft",
          title: "Test draft",
          published: false,
        };
        await rpc("growth_save_content", [l]);
        assert.equal(
          (await db.query("SELECT * FROM growth_content WHERE id='test-draft'"))
            .rows.length,
          1,
        );
        await asUser("bob");
        assert.equal(
          (await db.query("SELECT * FROM growth_content WHERE id='test-draft'"))
            .rows.length,
          0,
        );
        await assert.rejects(rpc("growth_save_content", [l]), /Admin only/);
      },
    );
    await t.test(
      "squad membership, private posts and five-kudos limit",
      async () => {
        await asUser("alice");
        await rpc("growth_social_action", ["create", { name: "Ruang Tumbuh" }]);
        const a = await rpc("growth_social");
        assert.ok(a.squad.code);
        await asUser("bob");
        await rpc("growth_social_action", ["join", { code: a.squad.code }]);
        await rpc("growth_social_action", [
          "post",
          { body: "Terima kasih sudah hadir." },
        ]);
        await asUser("alice");
        assert.equal((await rpc("growth_social")).posts.length, 1);
        for (let i = 0; i < 5; i++)
          await rpc("growth_social_action", ["kudos", { recipient: ids.bob }]);
        await assert.rejects(
          rpc("growth_social_action", ["kudos", { recipient: ids.bob }]),
          /Lima kudos/,
        );
        await asUser("admin");
        assert.equal((await rpc("growth_social")).posts.length, 0);
        await assert.rejects(
          rpc("growth_social_action", ["kudos", { recipient: ids.bob }]),
          /satu squad/,
        );
      },
    );
    await t.test(
      "UGC requires review, rejects stale approvals, and keeps responses private",
      async () => {
        const content = {
          title: "A small reflection",
          description: "Notice a small habit you would like to practice.",
          language: "en",
          category: "reflection",
          minutes: 5,
          sources: "",
          questions: [
            {
              type: "text",
              prompt: "What would you like to practice?",
              options: [],
            },
          ],
        };
        const mutate = (name, data) =>
          rpc("ugc_mutate", [name, { expectedUserId: currentUserId, ...data }]);
        await asUser("alice");
        const draft = await mutate("save", { content });
        const key = { id: draft.id, revision: 1 };
        await asUser("admin");
        assert.equal((await rpc("ugc_list", ["review"])).length, 0);
        assert.equal(
          (await db.query("select * from user_created_quests")).rows.length,
          0,
        );
        await asUser("alice");
        await assert.rejects(mutate("submit", key), /CONSENT_REQUIRED/);
        await mutate("submit", { ...key, consent: true });
        await assert.rejects(
          mutate("published", { ...key, reason: "This is supportive." }),
          /FORBIDDEN/,
        );
        await assert.rejects(
          db.query(
            "update user_created_quests set status='published' where id=$1",
            [draft.id],
          ),
          /permission denied/,
        );
        await asUser("admin");
        const checklist = {
          objective: true,
          claims: true,
          privacy: true,
          respect: true,
          clarity: true,
          rights: true,
        };
        await assert.rejects(
          mutate("published", {
            ...key,
            revision: 2,
            reason: "All checks passed.",
            checklist,
          }),
          /REVISION_CONFLICT/,
        );
        await assert.rejects(
          mutate("published", { ...key, reason: "All checks passed." }),
          /CHECKLIST_REQUIRED/,
        );
        await mutate("published", {
          ...key,
          reason: "All checks passed.",
          checklist,
        });
        const own = await mutate("save", { content });
        await mutate("submit", { ...own, consent: true });
        await assert.rejects(
          mutate("published", {
            ...own,
            reason: "All checks passed.",
            checklist,
          }),
          /SELF_REVIEW_FORBIDDEN/,
        );
        await asUser("bob");
        const published = await rpc("ugc_list", ["published"]);
        assert.equal(published.length, 1);
        assert.equal("creator_id" in published[0], false);
        await assert.rejects(
          mutate("respond", { ...key, answers: {} }),
          /INVALID_ANSWERS/,
        );
        await mutate("respond", {
          ...key,
          answers: { 0: "My confidential reflection" },
        });
        assert.equal(
          (await db.query("select * from user_quest_responses")).rows.length,
          1,
        );
        await mutate("report", {
          ...key,
          reason: "privacy",
          note: "Please recheck this prompt.",
        });
        await asUser("alice");
        assert.equal(
          (await db.query("select * from user_quest_responses")).rows.length,
          0,
        );
        assert.equal((await rpc("ugc_list", ["mine"]))[0].reports.length, 0);
        await assert.rejects(
          mutate("save", { ...key, content }),
          /WITHDRAW_BEFORE_EDIT/,
        );
        await asUser("admin");
        assert.equal(
          (await db.query("select * from user_quest_responses")).rows.length,
          0,
        );
        await mutate("suspended", {
          ...key,
          reason: "Privacy report requires investigation.",
        });
        await asUser("bob");
        assert.equal((await rpc("ugc_list", ["published"])).length, 0);
        await assert.rejects(
          mutate("respond", { ...key, answers: { 0: "No longer available" } }),
          /QUEST_UNAVAILABLE/,
        );
        await asUser("alice");
        await mutate("withdraw", key);
        const next = await mutate("save", {
          ...key,
          content: { ...content, title: "A revised reflection" },
        });
        assert.equal(next.revision, 2);
        assert.equal((await rpc("ugc_list", ["published"])).length, 0);
        await assert.rejects(
          mutate("submit", { ...next, consent: true, expectedUserId: ids.bob }),
          /ACCOUNT_CHANGED/,
        );
      },
    );
    await t.test(
      "league requires opt-in and never includes journal payloads",
      async () => {
        await asUser("alice");
        assert.equal((await rpc("growth_social")).league.length, 0);
        await rpc("growth_settings", [{ publicProfile: true }]);
        const data = await rpc("growth_social");
        assert.equal(data.league.length, 1);
        assert.equal(data.league[0].name, "alice");
        assert.equal("answers" in data.league[0], false);
      },
    );
  } catch (e) {
    console.error("DATABASE FAILURE:", e.message);
    throw new Error(e.message);
  } finally {
    await db.close();
  }
});
