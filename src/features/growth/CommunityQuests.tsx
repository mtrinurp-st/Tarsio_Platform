import { useEffect, useRef, useState } from "react";
import { FieldInput } from "./LessonPlayer";
import { cloud, rpc } from "./storage";
import type { Answers, FieldKind } from "./catalog";
import type { Locale } from "./preferences";

type Question = {
  type: "single_choice" | "multi_choice" | "scale" | "text";
  prompt: string;
  options: string[];
};
type Content = {
  title: string;
  description: string;
  language: Locale;
  category: string;
  minutes: number;
  sources: string;
  questions: Question[];
};
type Quest = {
  id: string;
  revision: number;
  status: string;
  content: Content;
  reason: string;
  own: boolean;
  reports: { reason: string; note: string; revision: number }[];
};
const blank = (): Content => ({
  title: "",
  description: "",
  language: "id",
  category: "reflection",
  minutes: 5,
  sources: "",
  questions: [{ type: "text", prompt: "", options: [] }],
});
const kinds: Record<Question["type"], FieldKind> = {
  single_choice: "choice",
  multi_choice: "multi",
  scale: "range",
  text: "textarea",
};
const checklistKeys = [
  "objective",
  "claims",
  "privacy",
  "respect",
  "clarity",
  "rights",
];
export default function CommunityQuests({
  owner,
  admin,
  locale,
}: {
  owner: string;
  admin: boolean;
  locale: Locale;
}) {
  const t = (id: string, en: string) => (locale === "en" ? en : id);
  const [mode, setMode] = useState<"published" | "mine" | "review">(
    "published",
  );
  const [items, setItems] = useState<Quest[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Quest | null>(null),
    [showEditor, setShowEditor] = useState(false);
  const [content, setContent] = useState<Content>(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem("tarsio:ugc-draft:" + owner) || "null",
        ) || blank()
      );
    } catch {
      return blank();
    }
  });
  const [consent, setConsent] = useState(false),
    [selected, setSelected] = useState<Quest | null>(null),
    [answers, setAnswers] = useState<Answers>({});
  const [reason, setReason] = useState(""),
    [checks, setChecks] = useState<Record<string, boolean>>({}),
    [reporting, setReporting] = useState<Quest | null>(null),
    [reportReason, setReportReason] = useState("misinformation");
  const alive = useRef(true);
  const requests = useRef(0);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function refresh(view = mode) {
    if (owner === "device") return;
    const token = ++requests.current;
    setBusy(true);
    setError("");
    try {
      const data = await rpc("ugc_list", { p_mode: view });
      if (alive.current && token === requests.current)
        setItems(
          data.filter(
            (q: Quest) =>
              typeof q.content?.title === "string" &&
              typeof q.content?.description === "string" &&
              Array.isArray(q.content?.questions),
          ),
        );
    } catch {
      if (alive.current && token === requests.current)
        setError(
          t(
            "Quest komunitas belum dapat dimuat. Backend moderasi harus diaktifkan terlebih dahulu.",
            "Community quests could not be loaded. The moderation backend must be enabled first.",
          ),
        );
    } finally {
      if (alive.current && token === requests.current) setBusy(false);
    }
  }
  useEffect(() => {
    void refresh(mode); /* Each tab issues a fresh authenticated query. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, owner]);
  async function action(name: string, data: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await rpc("ugc_mutate", {
        p_action: name,
        p_data: { ...data, expectedUserId: owner },
      });
      if (!alive.current) return null;
      setMessage(t("Perubahan tersimpan.", "Changes saved."));
      await refresh();
      return result;
    } catch (e) {
      if (alive.current)
        setError(
          t(
            "Tidak dapat menyimpan. Periksa isian, status revisi, dan koneksi lalu coba lagi.",
            "Could not save. Check the fields, revision status and connection, then retry.",
          ) +
            (String((e as Error).message).includes("REVISION_CONFLICT")
              ? t(
                  " Versi sudah berubah; muat ulang daftar.",
                  " The revision changed; reload the list.",
                )
              : ""),
        );
      return null;
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function exportResponses() {
    if (!cloud || owner === "device") return;
    setBusy(true);
    setError("");
    try {
      const { data, error } = await cloud
        .from("user_quest_responses")
        .select("quest_id,revision,answers,completed_at")
        .eq("owner_id", owner);
      if (error) throw error;
      if (!alive.current) return;
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "tarsio-community-private-reflections.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      if (alive.current)
        setError(
          t(
            "Ekspor belum tersedia. Periksa koneksi dan coba lagi.",
            "Export is unavailable. Check the connection and retry.",
          ),
        );
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  const ref = (q: Quest) => ({ id: q.id, revision: q.revision });
  const statuses: Record<string, [string, string]> = {
    draft: ["Draf", "Draft"],
    pending_review: ["Menunggu review", "Pending review"],
    published: ["Terbit", "Published"],
    rejected: ["Ditolak", "Rejected"],
    changes_requested: ["Perlu perbaikan", "Changes requested"],
    withdrawn: ["Ditarik", "Withdrawn"],
    suspended: ["Ditangguhkan", "Suspended"],
  };
  const status = (value: string) => {
    const s = statuses[value];
    return s ? t(...s) : value;
  };
  return (
    <div className="ugc-stack">
      <header className="g-page-heading">
        <h1>{t("Quest komunitas", "Community quests")}</h1>
        <p>
          {t(
            "Berbagi langkah kecil, dengan review manusia sebelum terbit.",
            "Share small steps, with human review before publication.",
          )}
        </p>
      </header>
      <section className="g-card ugc-card">
        <p>
          {t(
            "Quest komunitas adalah aktivitas refleksi umum, bukan diagnosis atau pengganti bantuan profesional. Jawabanmu privat; pembuat quest dan moderator konten tidak dapat membacanya. Pilot ini tidak memberikan XP atau Poin.",
            "Community quests are general reflection activities, not diagnosis or a substitute for professional help. Your answers are private; creators and content moderators cannot read them. This pilot does not award XP or Poin.",
          )}
        </p>
        {owner === "device" && (
          <p className="g-callout">
            {t(
              "Mode perangkat: kamu dapat menulis draf lokal. Hubungkan akun dari Pengaturan untuk mengajukan quest saat backend tersedia.",
              "Device mode: you can write a local draft. Connect an account in Settings to submit a quest when the backend is available.",
            )}
          </p>
        )}
        <div className="button-row">
          {(["published", "mine", ...(admin ? ["review"] : [])] as const).map(
            (v) => (
              <button
                key={v}
                className="g-btn secondary"
                aria-pressed={mode === v}
                disabled={busy}
                onClick={() => {
                  setMode(v as typeof mode);
                  setItems([]);
                  setSelected(null);
                }}
              >
                {v === "published"
                  ? t("Katalog", "Catalog")
                  : v === "mine"
                    ? t("Karyaku", "My quests")
                    : t("Moderasi", "Moderation")}
              </button>
            ),
          )}
          <button
            className="g-btn"
            onClick={() => {
              setEditing(null);
              setShowEditor(true);
              setConsent(false);
            }}
          >
            {t("Buat quest", "Create quest")}
          </button>
        </div>
      </section>
      {owner !== "device" && (
        <button
          className="g-btn secondary"
          disabled={busy}
          onClick={() => void exportResponses()}
        >
          {t(
            "Ekspor refleksi komunitas saya (privat)",
            "Export my community reflections (private)",
          )}
        </button>
      )}
      {error && (
        <p className="g-callout" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="g-callout" role="status">
          {message}
        </p>
      )}
      {showEditor && (
        <form
          className="g-card ugc-card"
          onSubmit={async (e) => {
            e.preventDefault();
            if (owner === "device") {
              try {
                localStorage.setItem(
                  "tarsio:ugc-draft:" + owner,
                  JSON.stringify(content),
                );
                setMessage(
                  t(
                    "Draf tersimpan hanya pada perangkat ini.",
                    "Draft saved on this device only.",
                  ),
                );
              } catch {
                setError(
                  t(
                    "Penyimpanan penuh. Salin draf sebelum menutup.",
                    "Storage full. Copy your draft before closing.",
                  ),
                );
              }
              return;
            }
            const saved = await action("save", {
              ...(editing ? ref(editing) : {}),
              content,
            });
            if (saved && alive.current) {
              setEditing({
                ...saved,
                content,
                status: "draft",
                reason: "",
                own: true,
                reports: [],
              });
              setMode("mine");
            }
          }}
        >
          <h2>{t("Draf quest", "Quest draft")}</h2>
          <label>
            {t("Judul", "Title")}
            <input
              required
              minLength={5}
              maxLength={100}
              value={content.title}
              onChange={(e) =>
                setContent({ ...content, title: e.target.value })
              }
            />
          </label>
          <label>
            {t("Ringkasan dan tujuan refleksi", "Summary and reflection goal")}
            <textarea
              required
              minLength={20}
              maxLength={800}
              value={content.description}
              onChange={(e) =>
                setContent({ ...content, description: e.target.value })
              }
            />
          </label>
          <label>
            {t("Bahasa konten", "Content language")}
            <select
              value={content.language}
              onChange={(e) =>
                setContent({ ...content, language: e.target.value as Locale })
              }
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            {t("Kategori", "Category")}
            <select
              value={content.category}
              onChange={(e) =>
                setContent({ ...content, category: e.target.value })
              }
            >
              {[
                ["reflection", "Refleksi", "Reflection"],
                ["habits", "Kebiasaan", "Habits"],
                ["communication", "Komunikasi", "Communication"],
                ["wellbeing", "Kesejahteraan diri", "Wellbeing"],
              ].map(([v, id, en]) => (
                <option key={v} value={v}>
                  {t(id, en)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("Estimasi menit (3–15)", "Estimated minutes (3–15)")}
            <input
              type="number"
              required
              min={3}
              max={15}
              value={content.minutes}
              onChange={(e) =>
                setContent({ ...content, minutes: Number(e.target.value) })
              }
            />
          </label>
          <label>
            {t(
              "Sumber untuk klaim faktual (opsional jika refleksi pribadi)",
              "Sources for factual claims (optional for personal reflection)",
            )}
            <textarea
              maxLength={2000}
              value={content.sources}
              onChange={(e) =>
                setContent({ ...content, sources: e.target.value })
              }
            />
          </label>
          {content.questions.map((q, i) => (
            <fieldset key={i}>
              <legend>
                {t("Pertanyaan", "Question")} {i + 1}
              </legend>
              <label>
                {t("Jenis", "Type")}
                <select
                  value={q.type}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      questions: content.questions.map((x, j) =>
                        i === j
                          ? {
                              ...x,
                              type: e.target.value as Question["type"],
                              options: [],
                            }
                          : x,
                      ),
                    })
                  }
                >
                  {[
                    ["text", "Teks bebas", "Free text"],
                    ["single_choice", "Satu pilihan", "Single choice"],
                    ["multi_choice", "Banyak pilihan", "Multiple choice"],
                    ["scale", "Skala 1–5", "Scale 1–5"],
                  ].map(([v, id, en]) => (
                    <option key={v} value={v}>
                      {t(id, en)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("Pertanyaan refleksi", "Reflection prompt")}
                <input
                  required
                  minLength={5}
                  maxLength={300}
                  value={q.prompt}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      questions: content.questions.map((x, j) =>
                        i === j ? { ...x, prompt: e.target.value } : x,
                      ),
                    })
                  }
                />
              </label>
              {q.type.includes("choice") && (
                <label>
                  {t(
                    "Opsi unik, satu per baris (2–6)",
                    "Unique options, one per line (2–6)",
                  )}
                  <textarea
                    required
                    value={q.options.join("\n")}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        questions: content.questions.map((x, j) =>
                          i === j
                            ? { ...x, options: e.target.value.split("\n") }
                            : x,
                        ),
                      })
                    }
                  />
                </label>
              )}
              <button
                type="button"
                className="g-btn secondary"
                disabled={content.questions.length === 1}
                onClick={() =>
                  setContent({
                    ...content,
                    questions: content.questions.filter((_, j) => j !== i),
                  })
                }
              >
                {t("Hapus pertanyaan", "Remove question")}
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            className="g-btn secondary"
            disabled={content.questions.length >= 10}
            onClick={() =>
              setContent({
                ...content,
                questions: [
                  ...content.questions,
                  { type: "text", prompt: "", options: [] },
                ],
              })
            }
          >
            {t("Tambah pertanyaan", "Add question")}
          </button>
          <p>
            {t(
              "Jangan meminta PIN, OTP, data kesehatan rinci, identitas lengkap, atau rahasia orang lain. Tidak ada klaim diagnosis, kesembuhan, atau keuntungan pasti.",
              "Do not request PINs, verification codes, detailed health records, full identifiers or other people’s secrets. No diagnosis, cure or guaranteed profit claims.",
            )}
          </p>
          <div className="button-row">
            <button
              type="button"
              className="g-btn secondary"
              onClick={() => {
                setMode("mine");
                setSelected({
                  id: "device-preview",
                  revision: 0,
                  status: "preview",
                  content,
                  reason: "",
                  own: true,
                  reports: [],
                });
                setAnswers(
                  Object.fromEntries(
                    content.questions.flatMap((q, i) =>
                      q.type === "scale" ? [[String(i), 1]] : [],
                    ),
                  ),
                );
              }}
            >
              {t(
                "Preview draf tanpa menyimpan jawaban",
                "Preview draft without saving answers",
              )}
            </button>
            <button className="g-btn" formNoValidate disabled={busy}>
              {t("Simpan draf", "Save draft")}
            </button>
            <button
              className="g-btn secondary"
              type="button"
              onClick={() => setShowEditor(false)}
            >
              {t("Tutup editor", "Close editor")}
            </button>
          </div>
        </form>
      )}
      {busy && <p role="status">{t("Memuat…", "Loading…")}</p>}
      {!busy && !items.length && owner !== "device" && !error && (
        <p className="g-card">
          {t("Belum ada quest pada daftar ini.", "No quests in this list yet.")}
        </p>
      )}
      {items.map((q) => (
        <section key={q.id} className="g-card ugc-card">
          <span>
            {q.content.language === "en" ? "English" : "Bahasa Indonesia"} ·{" "}
            {status(q.status)} · v{q.revision}
          </span>
          <h2>{q.content.title}</h2>
          <p>{q.content.description}</p>
          {q.reason && <p>{q.reason}</p>}
          <div className="button-row">
            <button
              className="g-btn secondary"
              onClick={() => {
                setSelected(q);
                setAnswers(
                  Object.fromEntries(
                    q.content.questions.flatMap((x, i) =>
                      x.type === "scale" ? [[String(i), 1]] : [],
                    ),
                  ),
                );
                setReason("");
                setChecks({});
                setConsent(false);
              }}
            >
              {q.status === "published"
                ? t("Buka quest", "Open quest")
                : t("Preview dan tindakan", "Preview and actions")}
            </button>
            {mode === "mine" &&
              ["draft", "rejected", "changes_requested", "withdrawn"].includes(
                q.status,
              ) && (
                <button
                  className="g-btn secondary"
                  onClick={() => {
                    setEditing(q);
                    setContent(q.content);
                    setShowEditor(true);
                  }}
                >
                  {t("Edit draf", "Edit draft")}
                </button>
              )}
          </div>
        </section>
      ))}
      {selected && (
        <section className="g-card ugc-card">
          <h2>{selected.content.title}</h2>
          <p>{selected.content.description}</p>
          <p>
            {t("Sumber", "Sources")}:{" "}
            {selected.content.sources ||
              t("Tidak dicantumkan", "None supplied")}
          </p>
          {selected.content.questions.map((q, i) => (
            <FieldInput
              locale={locale}
              key={i}
              field={{
                id: String(i),
                label: q.prompt,
                kind: kinds[q.type],
                required: true,
                options: q.options,
                min: 1,
                max: 5,
              }}
              answers={answers}
              onChange={(id, v) => setAnswers({ ...answers, [id]: v })}
            />
          ))}
          {mode === "published" && (
            <>
              <p>
                {t(
                  "Jawaban disimpan hanya setelah kamu memilih Simpan. Tanpa XP/Poin pada pilot.",
                  "Answers are stored only when you select Save. No XP/Poin in this pilot.",
                )}
              </p>
              <button
                className="g-btn"
                disabled={busy}
                onClick={async () => {
                  const r = await action("respond", {
                    ...ref(selected),
                    answers,
                  });
                  if (r && alive.current) {
                    setAnswers({});
                    setSelected(null);
                    setMessage(
                      t(
                        "Refleksi pribadi tersimpan.",
                        "Private reflection saved.",
                      ),
                    );
                  }
                }}
              >
                {t("Simpan refleksi pribadi", "Save private reflection")}
              </button>
              <button
                className="g-btn secondary"
                onClick={() => {
                  setReporting(selected);
                  setReason("");
                }}
              >
                {t("Laporkan konten", "Report content")}
              </button>
            </>
          )}
          {mode === "mine" &&
            selected.status !== "preview" &&
            owner !== "device" && (
              <>
                <label className="setting-row">
                  <span>
                    {t(
                      "Saya memahami isi quest ini akan dibaca reviewer dan dapat dipublikasikan. Saya tidak menyertakan data rahasia. Jawaban peserta tetap privat.",
                      "I understand that reviewers will read this quest and it may be published. I have not included confidential data. Participant answers remain private.",
                    )}
                  </span>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                </label>
                {[
                  "draft",
                  "rejected",
                  "changes_requested",
                  "withdrawn",
                ].includes(selected.status) && (
                  <button
                    className="g-btn"
                    disabled={busy || !consent}
                    onClick={async () => {
                      if (await action("submit", { ...ref(selected), consent }))
                        setSelected(null);
                    }}
                  >
                    {t("Ajukan untuk review", "Submit for review")}
                  </button>
                )}
                <button
                  className="g-btn secondary"
                  disabled={busy}
                  onClick={async () => {
                    if (await action("withdraw", ref(selected)))
                      setSelected(null);
                  }}
                >
                  {t("Tarik quest", "Withdraw quest")}
                </button>
              </>
            )}
          {mode === "review" && admin && (
            <>
              <p>
                {t(
                  "Review hanya isi quest. Jangan meminta jawaban peserta.",
                  "Review quest content only. Do not request participant answers.",
                )}
              </p>
              {selected.reports.map((r, i) => (
                <p key={i}>
                  {t("Laporan", "Report")} v{r.revision}: {r.reason} — {r.note}
                </p>
              ))}
              {checklistKeys.map((k, i) => (
                <label key={k} className="setting-row">
                  <span>
                    {t(
                      [
                        "Objektif dan suportif",
                        "Klaim tidak menyesatkan",
                        "Tidak ada data rahasia",
                        "Menghormati pengguna",
                        "Pertanyaan jelas",
                        "Hak konten dan sumber layak",
                      ][i],
                      [
                        "Objective and supportive",
                        "No misleading claims",
                        "No confidential data",
                        "Respectful",
                        "Clear questions",
                        "Content rights and sources reviewed",
                      ][i],
                    )}
                  </span>
                  <input
                    type="checkbox"
                    checked={!!checks[k]}
                    onChange={(e) =>
                      setChecks({ ...checks, [k]: e.target.checked })
                    }
                  />
                </label>
              ))}
              <label>
                {t(
                  "Alasan keputusan (10–1.000 karakter)",
                  "Decision reason (10–1,000 characters)",
                )}
                <textarea
                  minLength={10}
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <div className="button-row">
                {(selected.status === "published"
                  ? ["suspended"]
                  : selected.status === "pending_review"
                    ? ["published", "changes_requested", "rejected"]
                    : []
                ).map((a) => (
                  <button
                    key={a}
                    className="g-btn secondary"
                    disabled={
                      busy ||
                      selected.own ||
                      reason.trim().length < 10 ||
                      (a === "published" &&
                        !checklistKeys.every((k) => checks[k]))
                    }
                    onClick={async () => {
                      if (
                        await action(a, {
                          ...ref(selected),
                          reason,
                          checklist: checks,
                        })
                      )
                        setSelected(null);
                    }}
                  >
                    {status(a)}
                  </button>
                ))}
              </div>
              {selected.own && (
                <p>
                  {t(
                    "Karyamu harus direview admin lain.",
                    "Another admin must review your quest.",
                  )}
                </p>
              )}
            </>
          )}
          <button className="g-btn secondary" onClick={() => setSelected(null)}>
            {t("Tutup preview", "Close preview")}
          </button>
        </section>
      )}
      {reporting && (
        <form
          className="g-card ugc-card"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await action("report", {
                ...ref(reporting),
                reason: reportReason,
                note: reason,
              })
            )
              setReporting(null);
          }}
        >
          <h2>{t("Laporkan konten", "Report content")}</h2>
          <p>
            {t(
              "Identitasmu tidak diberikan kepada creator. Jangan menyertakan jawaban atau data rahasia.",
              "Your identity is not shared with the creator. Do not include answers or confidential data.",
            )}
          </p>
          <label>
            {t("Alasan", "Reason")}
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            >
              {[
                ["misinformation", "Informasi menyesatkan", "Misinformation"],
                ["privacy", "Privasi", "Privacy"],
                ["harassment", "Pelecehan", "Harassment"],
                ["unsafe_advice", "Saran berisiko", "Unsafe advice"],
                ["other", "Lainnya", "Other"],
              ].map(([v, id, en]) => (
                <option key={v} value={v}>
                  {t(id, en)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("Catatan opsional", "Optional note")}
            <textarea
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="button-row">
            <button className="g-btn" disabled={busy}>
              {t("Kirim laporan", "Send report")}
            </button>
            <button
              className="g-btn secondary"
              type="button"
              onClick={() => setReporting(null)}
            >
              {t("Batal", "Cancel")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
