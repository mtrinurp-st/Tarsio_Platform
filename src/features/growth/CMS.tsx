import { useEffect, useState } from "react";
import { rpc } from "./storage";
import { Copy, Eye, FileText, Plus, Save, Search, Trash2 } from "lucide-react";
import { units, type Lesson, type FieldKind } from "./catalog";
export default function CMS({
  catalog,
  onSave,
  isAdmin,
  device,
}: {
  catalog: Lesson[];
  onSave: (l: Lesson) => Promise<void>;
  isAdmin: boolean;
  device: boolean;
}) {
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState<Lesson | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const canEdit = isAdmin || device;
  const [analytics, setAnalytics] = useState<{
    users: number;
    completedQuests: number;
    activeThisWeek: number;
  } | null>(null);
  useEffect(() => {
    if (isAdmin && !device)
      void rpc("growth_analytics")
        .then(setAnalytics)
        .catch(() => setAnalytics(null));
  }, [isAdmin, device]);
  function updateStep(i: number, key: string, value: unknown) {
    if (!selected) return;
    setSelected({
      ...selected,
      steps: selected.steps.map((s, j) =>
        j === i ? { ...s, [key]: value } : s,
      ),
    });
  }
  async function save() {
    if (!selected) return;
    if (
      !selected.title.trim() ||
      !selected.description.trim() ||
      !selected.steps.length ||
      selected.steps.some(
        (s) =>
          !s.title.trim() ||
          !s.fields.length ||
          s.fields.some(
            (f) =>
              !f.id.trim() ||
              !f.label.trim() ||
              ((f.kind === "choice" || f.kind === "multi") &&
                !f.options?.length),
          ),
      )
    ) {
      setMessage(
        "Lengkapi judul, deskripsi, langkah, dan pilihan setiap field.",
      );
      return;
    }
    const ids = selected.steps.flatMap((s) => s.fields.map((f) => f.id));
    if (new Set(ids).size !== ids.length) {
      setMessage("ID field tidak boleh duplikat.");
      return;
    }
    setBusy(true);
    try {
      await onSave(selected);
      setMessage(
        device
          ? "Konten disimpan pada perangkat ini."
          : "Konten berhasil disimpan.",
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="g-page-head">
        <span className="g-eyebrow">CONTENT STUDIO</span>
        <h1>Ruang racik quest</h1>
        <p>Kelola alur, pertanyaan, dan publikasi dalam satu tempat.</p>
      </div>
      {device && (
        <div className="g-callout">
          <p>
            Preview CMS lokal. Perubahan hanya berlaku di perangkat ini. Pada
            aplikasi tersambung, hanya admin yang bisa mengubah konten.
          </p>
        </div>
      )}
      {analytics && (
        <div className="cms-stats">
          <div className="g-card">
            <strong>{analytics.users}</strong>
            <span>Pengguna</span>
          </div>
          <div className="g-card">
            <strong>{analytics.completedQuests}</strong>
            <span>Quest diselesaikan</span>
          </div>
          <div className="g-card">
            <strong>{analytics.activeThisWeek}</strong>
            <span>Aktif minggu ini</span>
          </div>
        </div>
      )}
      {!canEdit ? (
        <div className="g-empty">
          <p>Halaman ini hanya tersedia untuk admin.</p>
        </div>
      ) : selected ? (
        <section className="g-card cms-editor">
          <div className="g-section-head">
            <button
              className="g-btn small secondary"
              onClick={() => setSelected(null)}
            >
              ← Daftar konten
            </button>
            <span>{selected.id}</span>
          </div>
          <label className="g-field">
            <span>Judul quest</span>
            <input
              value={selected.title}
              onChange={(e) =>
                setSelected({ ...selected, title: e.target.value })
              }
            />
          </label>
          <label className="g-field">
            <span>Deskripsi</span>
            <textarea
              value={selected.description}
              onChange={(e) =>
                setSelected({ ...selected, description: e.target.value })
              }
            />
          </label>
          <div className="form-grid">
            <label className="g-field">
              <span>Unit</span>
              <select
                value={selected.unit}
                onChange={(e) =>
                  setSelected({ ...selected, unit: Number(e.target.value) })
                }
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="g-field">
              <span>Durasi (menit)</span>
              <input
                type="number"
                min={1}
                max={30}
                value={selected.minutes}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    minutes: Math.max(1, Math.min(30, Number(e.target.value))),
                  })
                }
              />
            </label>
          </div>
          <label className="g-check">
            <input
              type="checkbox"
              checked={selected.published}
              onChange={(e) =>
                setSelected({ ...selected, published: e.target.checked })
              }
            />{" "}
            Terbitkan untuk pengguna
          </label>
          {selected.steps.map((st, i) => (
            <details className="cms-step" key={i} open={i === 0}>
              <summary>
                Langkah {i + 1} · {st.title}
              </summary>
              <label className="g-field">
                <span>Judul langkah</span>
                <input
                  value={st.title}
                  onChange={(e) => updateStep(i, "title", e.target.value)}
                />
              </label>
              <label className="g-field">
                <span>Petunjuk</span>
                <textarea
                  value={st.hint}
                  onChange={(e) => updateStep(i, "hint", e.target.value)}
                />
              </label>
              {st.fields.map((f, j) => (
                <div className="cms-field" key={j}>
                  <label className="g-field">
                    <span>Pertanyaan</span>
                    <input
                      value={f.label}
                      onChange={(e) =>
                        updateStep(
                          i,
                          "fields",
                          st.fields.map((x, k) =>
                            k === j ? { ...x, label: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <div className="form-grid">
                    <label className="g-field">
                      <span>Tipe input</span>
                      <select
                        value={f.kind}
                        onChange={(e) =>
                          updateStep(
                            i,
                            "fields",
                            st.fields.map((x, k) =>
                              k === j
                                ? { ...x, kind: e.target.value as FieldKind }
                                : x,
                            ),
                          )
                        }
                      >
                        {[
                          "textarea",
                          "text",
                          "number",
                          "range",
                          "choice",
                          "multi",
                          "check",
                          "date",
                        ].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                    <label className="g-field">
                      <span>ID data (tetap untuk jawaban lama)</span>
                      <input value={f.id} readOnly />
                    </label>
                  </div>
                  {(f.kind === "choice" || f.kind === "multi") && (
                    <label className="g-field">
                      <span>Pilihan, satu per baris</span>
                      <textarea
                        value={(f.options || []).join("\n")}
                        onChange={(e) =>
                          updateStep(
                            i,
                            "fields",
                            st.fields.map((x, k) =>
                              k === j
                                ? {
                                    ...x,
                                    options: e.target.value
                                      .split("\n")
                                      .filter(Boolean),
                                  }
                                : x,
                            ),
                          )
                        }
                      />
                    </label>
                  )}
                  {(f.kind === "range" || f.kind === "number") && (
                    <div className="form-grid">
                      {(["min", "max"] as const).map((key) => (
                        <label className="g-field" key={key}>
                          <span>{key === "min" ? "Minimum" : "Maksimum"}</span>
                          <input
                            type="number"
                            value={f[key] ?? ""}
                            onChange={(e) =>
                              updateStep(
                                i,
                                "fields",
                                st.fields.map((x, k) =>
                                  k === j
                                    ? {
                                        ...x,
                                        [key]:
                                          e.target.value === ""
                                            ? undefined
                                            : Number(e.target.value),
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="g-section-head">
                    <label className="g-check">
                      <input
                        type="checkbox"
                        checked={!!f.required}
                        onChange={(e) =>
                          updateStep(
                            i,
                            "fields",
                            st.fields.map((x, k) =>
                              k === j
                                ? { ...x, required: e.target.checked }
                                : x,
                            ),
                          )
                        }
                      />{" "}
                      Wajib diisi
                    </label>
                    <button
                      className="g-icon"
                      aria-label="Hapus pertanyaan"
                      onClick={() =>
                        updateStep(
                          i,
                          "fields",
                          st.fields.filter((_, k) => k !== j),
                        )
                      }
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                className="g-btn small secondary"
                onClick={() =>
                  updateStep(i, "fields", [
                    ...st.fields,
                    {
                      id: "field_" + crypto.randomUUID().slice(0, 8),
                      label: "Pertanyaan baru",
                      kind: "textarea",
                      required: true,
                    },
                  ])
                }
              >
                <Plus size={15} /> Pertanyaan
              </button>
            </details>
          ))}
          <button
            className="g-btn secondary"
            onClick={() =>
              setSelected({
                ...selected,
                steps: [
                  ...selected.steps,
                  {
                    title: "Langkah baru",
                    hint: "",
                    fields: [
                      {
                        id: "field_" + crypto.randomUUID().slice(0, 8),
                        label: "Refleksimu",
                        kind: "textarea",
                        required: true,
                      },
                    ],
                  },
                ],
              })
            }
          >
            <Plus size={17} /> Tambah langkah
          </button>
          <div className="cms-save">
            <span role="status">{message}</span>
            <button className="g-btn" disabled={busy} onClick={save}>
              <Save size={17} />
              {busy ? "Menyimpan…" : "Simpan konten"}
            </button>
          </div>
        </section>
      ) : (
        <>
          <div className="cms-stats">
            <div className="g-card">
              <FileText />
              <strong>{catalog.length}</strong>
              <span>Total quest</span>
            </div>
            <div className="g-card">
              <Eye />
              <strong>{catalog.filter((l) => l.published).length}</strong>
              <span>Dipublikasikan</span>
            </div>
            <div className="g-card">
              <Copy />
              <strong>{catalog.filter((l) => !l.published).length}</strong>
              <span>Draf</span>
            </div>
          </div>
          <div className="g-section-head">
            <label className="g-search">
              <Search size={18} />
              <input
                placeholder="Cari quest…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button
              className="g-btn small"
              onClick={() =>
                setSelected({
                  id: "custom-" + crypto.randomUUID().slice(0, 8),
                  unit: 1,
                  title: "Quest baru",
                  description: "",
                  minutes: 5,
                  published: false,
                  steps: [
                    {
                      title: "Mulai refleksi",
                      hint: "",
                      fields: [
                        {
                          id: "reflection",
                          label: "Apa yang kamu rasakan?",
                          kind: "textarea",
                          required: true,
                        },
                      ],
                    },
                  ],
                })
              }
            >
              <Plus size={16} /> Quest baru
            </button>
          </div>
          <section className="g-card cms-table">
            <table>
              <thead>
                <tr>
                  <th>Quest</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Langkah</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {catalog
                  .filter((l) =>
                    (l.title + " " + l.description)
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  )
                  .map((l) => (
                    <tr key={l.id}>
                      <td>
                        <strong>{l.title}</strong>
                        <small>{l.minutes} menit · 50 XP</small>
                      </td>
                      <td>{units.find((u) => u.id === l.unit)?.short}</td>
                      <td>
                        <span
                          className={
                            "status-pill " + (l.published ? "live" : "")
                          }
                        >
                          {l.published ? "Terbit" : "Draf"}
                        </span>
                      </td>
                      <td>{l.steps.length}</td>
                      <td>
                        <button
                          className="g-btn small secondary"
                          onClick={() => {
                            setSelected(structuredClone(l));
                            setMessage("");
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </>
  );
}
