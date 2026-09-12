import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync(
  new URL("../src/features/growth/catalog.ts", import.meta.url),
  "utf8",
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { lessons } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
const rows = lessons
  .map(
    (l, i) =>
      `('${l.id}',${l.unit},$content$${JSON.stringify(l)}$content$::jsonb,true,${i + 1})`,
  )
  .join(",\n");
fs.writeFileSync(
  new URL(
    "../supabase/migrations/20260910110100_seed_growth_content.sql",
    import.meta.url,
  ),
  "-- Generated from catalog.ts; never overwrites existing CMS content.\nINSERT INTO public.growth_content(id,unit_id,schema_json,published,sort_order) VALUES\n" +
    rows +
    "\nON CONFLICT(id) DO NOTHING;\n",
);
console.log(
  `Seeded ${lessons.length} lessons across ${new Set(lessons.map((l) => l.unit)).size} units.`,
);
