import { type Lesson, units } from "./catalog";
import { badges, type GrowthState } from "./engine";
export async function exportBlueprint(
  s: GrowthState,
  catalog: Lesson[],
  includeJournals = false,
  onlyLesson?: string,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  let y = 28;
  const width = 170;
  const line = (text: string, size = 11) => {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, width);
    for (const l of lines) {
      if (y > 274) {
        doc.addPage();
        y = 25;
      }
      doc.text(l, 20, y);
      y += size * 0.48 + 2;
    }
    y += 4;
  };
  doc.setFillColor(43, 63, 54);
  doc.rect(0, 0, 210, 8, "F");
  doc.setTextColor(43, 63, 54);
  line("TARSIO / LIFE BLUEPRINT", 12);
  line(
    onlyLesson ? "Kontrak Batasan Pribadi" : "Bertumbuh, satu langkah kecil.",
    23,
  );
  line(s.name + " | " + new Date().toLocaleDateString("id-ID"));
  line(
    s.xp +
      " XP  |  " +
      Object.values(s.progress).filter((p) => p.completedAt).length +
      " quest selesai",
  );
  line("Lencana: " + (badges(s).join(", ") || "Perjalanan baru dimulai"));
  y += 5;
  for (const u of units) {
    const ls = catalog.filter(
      (l) =>
        l.unit === u.id &&
        s.progress[l.id]?.completedAt &&
        (!onlyLesson || l.id === onlyLesson),
    );
    if (!ls.length) continue;
    line(u.title, 16);
    for (const l of ls) {
      line(l.title, 13);
      const a = s.progress[l.id].answers;
      if (includeJournals || onlyLesson) {
        for (const st of l.steps)
          for (const f of st.fields) {
            if (a[f.id] !== undefined && a[f.id] !== "")
              line(
                f.label +
                  ": " +
                  (Array.isArray(a[f.id])
                    ? (a[f.id] as string[]).join(", ")
                    : String(a[f.id])),
              );
          }
      } else
        line(
          "Diselesaikan pada " +
            new Date(s.progress[l.id].completedAt!).toLocaleDateString(
              "id-ID",
            ) +
            ". Refleksi pribadi tidak disertakan.",
        );
    }
  }
  line(
    "Dokumen pribadi. Kamu menentukan dengan siapa catatan ini dibagikan.",
    9,
  );
  doc.save(
    onlyLesson ? "Tarsio-Kontrak-Batasan.pdf" : "Tarsio-Life-Blueprint.pdf",
  );
}
export function exportAffirmation(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const c = canvas.getContext("2d");
  if (!c) return;
  c.fillStyle = "#f8f3e8";
  c.fillRect(0, 0, 1080, 1080);
  c.fillStyle = "#2b3f36";
  c.font = "bold 30px sans-serif";
  c.fillText("TARSIO", 90, 110);
  c.font = "48px Georgia";
  const words = text.split(" ");
  let line = "",
    y = 390;
  for (const w of words) {
    if (c.measureText(line + w).width > 900) {
      c.fillText(line, 90, y);
      line = "";
      y += 65;
    }
    line += w + " ";
  }
  c.fillText(line, 90, y);
  c.font = "24px sans-serif";
  c.fillText("Catatan baik untuk diri sendiri.", 90, 970);
  const a = document.createElement("a");
  a.download = "Tarsio-Afirmasi.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
}
