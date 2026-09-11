import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { type Answers, type Field, type Lesson, validateStep } from "./catalog";
import { financialProgress, projection, type Progress } from "./engine";
import { SESSION_ID } from "./storage";
import { TarsyMascot } from "@/components/TarsyMascot";
export function FieldInput({
  field: f,
  answers,
  onChange,
}: {
  field: Field;
  answers: Answers;
  onChange: (id: string, value: Answers[string]) => void;
}) {
  const v = answers[f.id];
  const id = "field-" + f.id;
  return (
    <div className={"g-field field-" + f.kind}>
      <label id={id + "-label"} htmlFor={id}>
        {f.label}
        {!f.required && <small> Opsional</small>}
      </label>
      {f.hint && <p>{f.hint}</p>}
      {f.kind === "textarea" ? (
        <textarea
          id={id}
          value={String(v ?? "")}
          rows={3}
          maxLength={5000}
          onChange={(e) => onChange(f.id, e.target.value)}
          placeholder="Tulis dengan bahasamu sendiri…"
        />
      ) : f.kind === "check" ? (
        <label className="g-check">
          <input
            id={id}
            type="checkbox"
            checked={v === true}
            onChange={(e) => onChange(f.id, e.target.checked)}
          />
          <span>Ya, aku setuju</span>
        </label>
      ) : f.kind === "choice" || f.kind === "multi" ? (
        <div className="g-options" role="group" aria-labelledby={id + "-label"}>
          {f.options?.map((o, i) => {
            const active = Array.isArray(v) ? v.includes(o) : v === o;
            return (
              <button
                type="button"
                aria-pressed={active}
                className={active ? "selected" : ""}
                key={o}
                onClick={() =>
                  onChange(
                    f.id,
                    f.kind === "multi"
                      ? active
                        ? (v as string[]).filter((x) => x !== o)
                        : [...(Array.isArray(v) ? v : []), o]
                      : o,
                  )
                }
              >
                <span className="option-key">
                  {active ? <Check size={16} /> : i + 1}
                </span>
                {o}
              </button>
            );
          })}
        </div>
      ) : f.kind === "range" ? (
        <div className="g-range">
          <input
            id={id}
            type="range"
            min={f.min}
            max={f.max}
            value={Number(v ?? f.min ?? 0)}
            onChange={(e) => onChange(f.id, Number(e.target.value))}
          />
          <input
            aria-label={f.label + " angka"}
            type="number"
            min={f.min}
            max={f.max}
            value={v === undefined ? "" : Number(v)}
            onChange={(e) =>
              onChange(
                f.id,
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
          />
        </div>
      ) : (
        <input
          id={id}
          type={f.kind}
          value={String(v ?? "")}
          min={f.min}
          max={f.max}
          maxLength={5000}
          onChange={(e) =>
            onChange(
              f.id,
              f.kind === "number" && e.target.value !== ""
                ? Number(e.target.value)
                : e.target.value,
            )
          }
        />
      )}
    </div>
  );
}
export function Breathing() {
  const [running, setRunning] = useState(false),
    [sec, setSec] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSec((s) => (s + 1) % 19), 1000);
    return () => clearInterval(t);
  }, [running]);
  const phase =
    sec < 4 ? "Tarik napas" : sec < 11 ? "Tahan lembut" : "Hembuskan";
  return (
    <div className="g-breath">
      <div
        className={
          "breath-circle " +
          (running ? (sec < 4 ? "inhale" : sec < 11 ? "hold" : "exhale") : "")
        }
      >
        {running ? phase : "Ambil jeda"}
        <small>
          {running
            ? sec < 4
              ? 4 - sec
              : sec < 11
                ? 11 - sec
                : 19 - sec
            : "4 · 7 · 8"}
        </small>
      </div>
      <button
        className="g-btn secondary"
        onClick={() => {
          setRunning(!running);
          setSec(0);
        }}
      >
        {running ? <Pause size={16} /> : <Play size={16} />}{" "}
        {running ? "Berhenti" : "Mulai napas"}
      </button>
    </div>
  );
}
export function Widget({
  kind,
  answers: a,
}: {
  kind: string;
  answers: Answers;
}) {
  const money = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);
  if (kind === "breathing") return <Breathing />;
  if (kind === "energy")
    return (
      <div className="energy-grid">
        {[
          "Fisik",
          "Emosional",
          "Intelektual",
          "Sosial",
          "Spiritual",
          "Finansial",
        ].map((x, i) => (
          <span key={x} className={a["energy" + i] ? "filled" : ""}>
            {a["energy" + i] ? <Check size={15} /> : <Sparkles size={15} />} {x}
          </span>
        ))}
      </div>
    );
  if (kind === "budget") {
    const total =
      Number(a.needs || 0) + Number(a.wants || 0) + Number(a.saving || 0);
    return (
      <div className={"g-callout " + (total === 100 ? "success" : "")}>
        <strong>Total alokasi: {total}%</strong>
        <div className="budget-bar">
          {["needs", "wants", "saving"].map((x, i) => (
            <i
              key={x}
              style={{
                width: Math.max(0, Math.min(100, Number(a[x] || 0))) + "%",
                background: ["#8e6ac0", "#e2ac39", "#348578"][i],
              }}
            />
          ))}
        </div>
        {total !== 100 && <p>Sesuaikan hingga total 100%.</p>}
      </div>
    );
  }
  if (kind === "finance")
    return (
      <div className="g-callout">
        <strong>Progres terhadap target</strong>
        {[
          "Dana darurat",
          "Batas utang",
          "Batas pengeluaran",
          "Investasi",
          "Proteksi",
        ].map((x, i) => {
          const p = financialProgress(
            Number(a["money" + i] || 0),
            Number(a["target" + i] || 0),
            i === 1 || i === 2,
          );
          return (
            <div className="g-metric" key={x}>
              <span>{x}</span>
              <progress max={100} value={p} />
              <b>{p}%</b>
            </div>
          );
        })}
        <small>
          Perbandingan terhadap target pribadimu, bukan penilaian kesehatan
          finansial.
        </small>
      </div>
    );
  if (kind === "compound") {
    const values = [1, 3, 5].map((y) =>
      projection(
        Number(a.monthly || 0),
        Number(a.initial || 0),
        Number(a.rate || 0),
        y,
      ),
    );
    const max = Math.max(...values, 1);
    return (
      <div className="g-callout">
        <strong>Proyeksi ilustratif</strong>
        <div className="projection">
          {values.map((v, i) => (
            <div key={i}>
              <b>{money(v)}</b>
              <div style={{ height: 30 + (v / max) * 100 }} />
              <span>{[1, 3, 5][i]} tahun</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "time") {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      const v = String(a["hour" + i] || "Belum diisi");
      counts[v] = (counts[v] || 0) + 1;
    }
    return (
      <div className="g-callout">
        <strong>Distribusi 24 jammu</strong>
        {Object.entries(counts).map(([k, v]) => (
          <div className="g-metric" key={k}>
            <span>{k}</span>
            <progress max={24} value={v} />
            <b>{v} jam</b>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "communication") {
    const keys = ["Menyampaikan", "Diam", "Memaksakan", "Setuju"];
    const counts = keys.map(
      (k) =>
        Object.entries(a).filter(
          ([id, v]) => id.startsWith("style") && String(v).startsWith(k),
        ).length,
    );
    const names = ["Asertif", "Pasif", "Agresif", "Pasif-agresif"];
    const explanations = [
      "Kamu cenderung menyampaikan kebutuhan secara langsung sambil menghargai orang lain.",
      "Kamu cenderung mengalah. Berlatih menyebut kebutuhan kecil bisa menjadi awal.",
      "Kamu cenderung mendesak. Coba beri ruang pada kebutuhan lawan bicara.",
      "Kamu cenderung menyampaikan keberatan secara tidak langsung. Coba ubah menjadi permintaan yang spesifik.",
    ];
    const i = counts.indexOf(Math.max(...counts));
    return (
      <div className="g-callout">
        <strong>Kecenderungan: {names[i]}</strong>
        <p>{explanations[i]} Gaya dapat berubah menurut situasi.</p>
      </div>
    );
  }
  if (kind === "script")
    return (
      <blockquote className="g-callout">
        “Aku merasa {String(a.feeling || "…")} ketika {String(a.when || "…")}.
        Aku membutuhkan {String(a.need || "…")}. Bisakah kita{" "}
        {String(a.request || "…")}?”
      </blockquote>
    );
  if (kind === "reframe")
    return (
      <blockquote className="affirmation">
        {String(
          a.affirmation ||
            "Aku sedang belajar menjadi lebih baik untuk diriku.",
        )}
        <small>TARSIO · CATATAN UNTUK DIRI</small>
      </blockquote>
    );
  return null;
}
export default function LessonPlayer({
  lesson,
  draft,
  save,
  complete,
  close,
  syncLabel,
}: {
  lesson: Lesson;
  draft?: Progress;
  save: (p: Progress) => void;
  complete: () => Promise<void>;
  close: () => void;
  syncLabel: string;
}) {
  const [p, setP] = useState<Progress>(
    () =>
      draft ?? {
        answers: {},
        step: 0,
        startedAt: new Date().toISOString(),
        sessionId: SESSION_ID,
      },
  );
  const alreadyCompleted = useRef(!!draft?.completedAt);
  const [done, setDone] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const dialog = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const step = lesson.steps[Math.min(p.step, lesson.steps.length - 1)];
  const validation = validateStep(lesson, p.step, p.answers);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement;
    dialog.current?.focus();
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const nodes = Array.from(
          dialog.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input, textarea, select, [tabindex="0"]',
          ) || [],
        ).filter((n) => n.offsetParent !== null);
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
      prior?.focus();
    };
  }, [close]);
  function update(id: string, value: Answers[string]) {
    const next = { ...p, answers: { ...p.answers, [id]: value } };
    setP(next);
    save(next);
  }
  async function next() {
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    if (p.step < lesson.steps.length - 1) {
      const next = { ...p, step: p.step + 1 };
      setP(next);
      save(next);
      heading.current?.focus();
      dialog.current?.scrollTo(0, 0);
    } else {
      setBusy(true);
      try {
        save(p);
        await complete();
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    }
  }
  return (
    <div className="g-overlay">
      <div
        className="g-player"
        role="dialog"
        aria-modal="true"
        aria-label={lesson.title}
        tabIndex={-1}
        ref={dialog}
      >
        <header>
          <button
            className="g-icon"
            aria-label="Simpan dan tutup"
            onClick={close}
          >
            <X />
          </button>
          <progress
            value={done ? lesson.steps.length : p.step}
            max={lesson.steps.length}
          />
          <span>
            <Sparkles size={17} /> 50 XP
          </span>
        </header>
        {done ? (
          <div className="g-celebrate">
            <TarsyMascot size={150} lang="id" mood="celebrate" />
            <span className="g-eyebrow">SATU LANGKAH LEBIH DEKAT</span>
            <h1>
              Kamu sudah hadir
              <br />
              untuk dirimu.
            </h1>
            <p>
              {lesson.title} selesai. Refleksimu tersimpan di Life Blueprint.
            </p>
            <div className="reward-row">
              <span>
                <CheckCircle2 /> Quest selesai
              </span>
              <span>
                <Sparkles />{" "}
                {alreadyCompleted.current
                  ? "Latihan ulang"
                  : p.sessionId === SESSION_ID
                    ? "+60 XP"
                    : "+50 XP"}
              </span>
            </div>
            <button className="g-btn" onClick={close}>
              Lanjutkan perjalanan <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="player-body">
              <span className="g-eyebrow">
                {lesson.title} · LANGKAH {p.step + 1}/{lesson.steps.length}
              </span>
              <h1 ref={heading} tabIndex={-1}>
                {step.title}
              </h1>
              <p className="player-hint">{step.hint}</p>
              {step.widget === "breathing" && (
                <Widget kind="breathing" answers={p.answers} />
              )}
              <div className={step.widget === "time" ? "time-fields" : ""}>
                {step.fields.map((f) => (
                  <FieldInput
                    key={f.id}
                    field={f}
                    answers={p.answers}
                    onChange={update}
                  />
                ))}
              </div>
              {step.widget && step.widget !== "breathing" && (
                <Widget kind={step.widget} answers={p.answers} />
              )}
              <p className="g-private">
                <ShieldCheck size={15} /> Refleksi ini hanya untukmu.
              </p>
            </div>
            <footer>
              <div>
                <span className="save-status">
                  <Check size={14} />
                  {syncLabel}
                </span>
                {error && (
                  <p role="alert" className="g-error">
                    {error}
                  </p>
                )}
              </div>
              <div className="button-row">
                {p.step > 0 && (
                  <button
                    className="g-btn secondary"
                    onClick={() => {
                      const n = { ...p, step: p.step - 1 };
                      setP(n);
                      save(n);
                    }}
                  >
                    <ArrowLeft size={17} /> Kembali
                  </button>
                )}
                <button
                  className="g-btn"
                  disabled={!!validation || busy}
                  onClick={next}
                >
                  {busy
                    ? "Menyimpan…"
                    : p.step === lesson.steps.length - 1
                      ? "Selesaikan quest"
                      : "Lanjut"}{" "}
                  {p.step === lesson.steps.length - 1 ? (
                    <Check size={18} />
                  ) : (
                    <ArrowRight size={18} />
                  )}
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
