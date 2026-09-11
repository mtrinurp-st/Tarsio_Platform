import { useCallback, useEffect, useState } from "react";
import {
  Award,
  Check,
  ChevronRight,
  Copy,
  Download,
  Gem,
  Plus,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Users,
} from "lucide-react";
import { units, type Lesson } from "./catalog";
import {
  badges,
  dailyQuests,
  dayKey,
  evolution,
  level,
  weeklyXP,
  type Action,
  type GrowthState,
} from "./engine";
import { exportAffirmation, exportBlueprint } from "./export";
import { cloud, rpc } from "./storage";
import { TarsyMascot } from "@/components/TarsyMascot";
export function Missions({
  s,
  act,
  open,
}: {
  s: GrowthState;
  act: (a: Action) => Promise<void>;
  open: (id: string) => void;
}) {
  const [reflection, setReflection] = useState(
    s.actions["reflection:" + dayKey()] || "",
  );
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  const plans = s.progress["2-2"];
  const commitment = s.progress["2-3"];
  const career = s.progress["5-3"];
  const future = s.progress["3-2"];
  const sixMonths = future?.completedAt ? new Date(future.completedAt) : null;
  if (sixMonths) sixMonths.setMonth(sixMonths.getMonth() + 6);
  return (
    <>
      <div className="g-page-head">
        <span className="g-eyebrow">SEDIKIT, TAPI KONSISTEN</span>
        <h1>Misi hari ini</h1>
        <p>Langkah kecilmu tetap berarti.</p>
      </div>
      <section className="g-card">
        <h2>Apa kabarmu hari ini?</h2>
        <p>
          Pilih yang paling mendekati perasaanmu. Semua perasaan boleh hadir.
        </p>
        <div className="g-chips mission-moods">
          {[
            ["🌤️", "Tenang"],
            ["⚡", "Bersemangat"],
            ["🌧️", "Lelah"],
            ["🌀", "Banyak pikiran"],
            ["🌱", "Penuh harapan"],
          ].map(([emoji, mood]) => (
            <button
              key={mood}
              type="button"
              aria-pressed={s.moods[dayKey()] === mood}
              className={s.moods[dayKey()] === mood ? "selected" : ""}
              onClick={() => void act({ type: "mood", value: mood })}
            >
              <span aria-hidden="true">{emoji}</span>
              {mood}
            </button>
          ))}
        </div>
      </section>
      <section className="g-card">
        <h2>Tiga cara untuk hadir</h2>
        {dailyQuests(s).map((q) => {
          const claimed = Object.prototype.hasOwnProperty.call(
            s.events,
            "quest:" + q.id + ":" + dayKey(),
          );
          return (
            <div className="quest-row" key={q.id}>
              <span className="quest-icon">
                <Sparkles />
              </span>
              <div>
                <strong>{q.title}</strong>
                <p>
                  {q.description} · +{q.xp} XP · {q.gems} poin
                </p>
              </div>
              <button
                className="g-btn small secondary"
                disabled={claimed || !q.ready}
                onClick={() => void act({ type: "claim", questId: q.id })}
              >
                {claimed ? (
                  <>
                    <Check size={16} /> Diambil
                  </>
                ) : q.ready ? (
                  "Ambil reward"
                ) : (
                  "Belum selesai"
                )}
              </button>
            </div>
          );
        })}
        <label className="g-field">
          <span>Satu hal yang kamu syukuri hari ini</span>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            maxLength={2000}
            placeholder="Hari ini, aku bersyukur karena…"
          />
        </label>
        <button
          className="g-btn"
          disabled={!reflection.trim()}
          onClick={() =>
            void act({
              type: "action",
              key: "reflection:" + dayKey(),
              value: reflection,
            })
          }
        >
          Simpan refleksi <Check size={17} />
        </button>
      </section>
      <section className="g-card">
        <h2>Aksi 24 jam</h2>
        {plans?.completedAt ? (
          Array.from({ length: 6 }, (_, i) => i)
            .filter((i) => plans.answers["action" + i])
            .map((i) => {
              const due = s.actions["planDue:" + i]
                ? Date.parse(s.actions["planDue:" + i])
                : Date.parse(plans.completedAt!) + 86400000;
              const remaining = Math.max(0, Math.ceil((due - now) / 3600000));
              return (
                <div className="followup" key={i}>
                  <strong>{String(plans.answers["action" + i])}</strong>
                  <span>
                    {remaining
                      ? remaining + " jam tersisa"
                      : "Waktunya check-in"}
                  </span>
                  <div className="g-chips">
                    {["Sudah", "Belum", "Perlu waktu"].map((v) => (
                      <button
                        key={v}
                        aria-pressed={s.actions["plan:" + i] === v}
                        className={
                          s.actions["plan:" + i] === v ? "selected" : ""
                        }
                        onClick={() =>
                          void act({
                            type: "action",
                            key: "plan:" + i,
                            value: v,
                          })
                        }
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
        ) : (
          <div className="g-empty">
            <p>Siapkan dua aksi kecil untuk kondisi finansialmu.</p>
            <button className="g-btn secondary" onClick={() => open("2-2")}>
              Buat rencana <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>
      {s.notifications && (
        <section className="g-card">
          <h2>Komitmen jangka panjang</h2>
          {commitment?.completedAt && commitment.answers.remind ? (
            Array.from({ length: 13 }, (_, i) => i + 1).map((week) => {
              const due =
                Date.parse(commitment.completedAt!) +
                Math.min(week * 7, 90) * 86400000;
              return (
                <div className="checkin-row" key={week}>
                  <span>
                    Minggu {week} · {new Date(due).toLocaleDateString("id-ID")}
                  </span>
                  <button
                    className="g-btn small secondary"
                    disabled={now < due || s.actions["week:" + week] === "done"}
                    onClick={() =>
                      void act({
                        type: "action",
                        key: "week:" + week,
                        value: "done",
                      })
                    }
                  >
                    {s.actions["week:" + week] === "done"
                      ? "Tercatat"
                      : now < due
                        ? "Terjadwal"
                        : "Aku sudah review"}
                  </button>
                </div>
              );
            })
          ) : (
            <p>
              Pengingat mingguan muncul setelah menyelesaikan Komitmen 90 Hari.
            </p>
          )}
          {career?.completedAt && career.answers.careerReminder && (
            <div className="followup">
              <strong>{String(career.answers.careerAction)}</strong>
              <p>Target: {String(career.answers.due)}</p>
              <button
                className="g-btn secondary"
                disabled={s.actions.career === "done"}
                onClick={() =>
                  void act({ type: "action", key: "career", value: "done" })
                }
              >
                {s.actions.career === "done" ? "Tercapai" : "Tandai tercapai"}
              </button>
            </div>
          )}
          {sixMonths && future?.answers.future && (
            <div className="followup">
              <strong>Surat untuk dirimu di masa depan</strong>
              <p>
                {now >= sixMonths.getTime()
                  ? String(future.answers.letter)
                  : "Kembali pada " + sixMonths.toLocaleDateString("id-ID")}
              </p>
            </div>
          )}
        </section>
      )}
      {s.progress["4-2"]?.completedAt && (
        <section className="g-card">
          <h2>Tujuh hari tanpa layar di zonamu</h2>
          <div className="g-chips">
            {Array.from({ length: 7 }, (_, i) => i + 1).map((i) => (
              <button
                key={i}
                className={s.actions["detox:" + i] ? "selected" : ""}
                aria-pressed={!!s.actions["detox:" + i]}
                onClick={() =>
                  void act({
                    type: "action",
                    key: "detox:" + i,
                    value: s.actions["detox:" + i] ? "" : "done",
                  })
                }
              >
                Hari {i} {s.actions["detox:" + i] && <Check size={15} />}
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
export function Blueprint({
  s,
  catalog,
  open,
}: {
  s: GrowthState;
  catalog: Lesson[];
  open: (id: string) => void;
}) {
  const [include, setInclude] = useState(false);
  return (
    <>
      <div className="g-page-head">
        <span className="g-eyebrow">CERITA YANG TERUS TUMBUH</span>
        <h1>Life Blueprint</h1>
        <p>Potongan kecil perjalananmu, dalam satu tempat.</p>
      </div>
      <section className="blueprint-cover">
        <div>
          <span className="g-eyebrow">BLUEPRINT MILIK</span>
          <h2>{s.name}</h2>
          <p>
            Level {level(s.xp)} · {evolution(s.xp)}
          </p>
          <div className="g-chips">
            <span>{s.xp} XP</span>
            <span>
              {Object.values(s.progress).filter((p) => p.completedAt).length}{" "}
              quest selesai
            </span>
          </div>
        </div>
        <TarsyMascot lang="id" size={130} />
      </section>
      <section className="g-card">
        <div className="g-section-head">
          <h2>Jejak pencapaian</h2>
          <Award />
        </div>
        <div className="badge-grid">
          {badges(s).length ? (
            badges(s).map((b) => (
              <div key={b}>
                <Award size={29} />
                <strong>{b}</strong>
              </div>
            ))
          ) : (
            <p>Selesaikan quest pertamamu untuk mendapatkan lencana.</p>
          )}
        </div>
      </section>
      {units.map((u) => {
        const complete = catalog.filter(
          (l) => l.unit === u.id && s.progress[l.id]?.completedAt,
        );
        return (
          <section className="g-card" key={u.id}>
            <div className="g-section-head">
              <h2>{u.title}</h2>
              <span>
                {complete.length}/
                {catalog.filter((l) => l.unit === u.id).length}
              </span>
            </div>
            {complete.length ? (
              complete.map((l) => (
                <details className="blueprint-entry" key={l.id}>
                  <summary>
                    {l.title}
                    <ChevronRight size={17} />
                  </summary>
                  {l.steps
                    .flatMap((st) => st.fields)
                    .filter((f) => s.progress[l.id].answers[f.id] !== undefined)
                    .map((f) => (
                      <div key={f.id}>
                        <small>{f.label}</small>
                        <p>
                          {Array.isArray(s.progress[l.id].answers[f.id])
                            ? (s.progress[l.id].answers[f.id] as string[]).join(
                                ", ",
                              )
                            : typeof s.progress[l.id].answers[f.id] ===
                                "boolean"
                              ? s.progress[l.id].answers[f.id]
                                ? "Ya"
                                : "Tidak"
                              : String(s.progress[l.id].answers[f.id])}
                        </p>
                      </div>
                    ))}
                  <button
                    className="g-btn small secondary"
                    onClick={() => open(l.id)}
                  >
                    Buka kembali
                  </button>
                  {l.id === "1-3" && (
                    <button
                      className="g-btn small secondary"
                      onClick={() => exportBlueprint(s, catalog, true, "1-3")}
                    >
                      <Download size={15} /> Unduh kontrak PDF
                    </button>
                  )}
                  {l.id === "3-3" && (
                    <button
                      className="g-btn small secondary"
                      onClick={() =>
                        exportAffirmation(
                          String(s.progress[l.id].answers.affirmation),
                        )
                      }
                    >
                      <Download size={15} /> Kartu afirmasi
                    </button>
                  )}
                </details>
              ))
            ) : (
              <p className="muted">Belum ada refleksi. Mulai saat kamu siap.</p>
            )}
          </section>
        );
      })}
      <section className="g-card">
        <h2>Bawa perjalananmu</h2>
        <label className="g-check">
          <input
            type="checkbox"
            checked={include}
            onChange={(e) => setInclude(e.target.checked)}
          />{" "}
          Sertakan isi refleksi pribadi dalam PDF
        </label>
        <p className="g-private">
          <ShieldCheck size={15} /> Secara default, ekspor hanya berisi progres
          dan pencapaian.
        </p>
        <button
          className="g-btn"
          onClick={() => exportBlueprint(s, catalog, include)}
        >
          <Download size={18} /> Unduh Life Blueprint
        </button>
      </section>
    </>
  );
}
export function Shop({
  s,
  act,
}: {
  s: GrowthState;
  act: (a: Action) => Promise<void>;
}) {
  return (
    <>
      <div className="g-page-head">
        <span className="g-eyebrow">HADIAH UNTUK LANGKAH KECIL</span>
        <h1>Toko Tarsy</h1>
        <p>Gunakan Poin yang kamu dapatkan dari misi.</p>
      </div>
      <div className="wallet-banner">
        <Gem /> <strong>{s.gems} Poin</strong>
        <span>Didapat dari progres, tanpa pembayaran.</span>
      </div>
      <div className="shop-grid">
        <section className="g-card">
          <div className="shop-art blue">
            <Snowflake size={64} />
          </div>
          <h2>Streak Freeze</h2>
          <p>
            Jaga streak ketika kamu perlu satu hari jeda. Maksimal dua
            tersimpan.
          </p>
          <span className="stock">Dimiliki: {s.freezes}/2</span>
          <button
            className="g-btn"
            disabled={s.gems < 20 || s.freezes >= 2}
            onClick={() => void act({ type: "buy", item: "freeze" })}
          >
            <Gem size={18} /> 20 poin
          </button>
        </section>
        <section className="g-card">
          <div className="shop-art gold">
            <TarsyMascot size={110} lang="id" />
            <span>✦</span>
          </div>
          <h2>Aura Penjelajah</h2>
          <p>Cahaya keemasan untuk menemani Tarsy di perjalananmu.</p>
          <span className="stock">Kosmetik permanen</span>
          <button
            className="g-btn"
            disabled={s.gems < 35 || s.cosmetic === "explorer"}
            onClick={() => void act({ type: "buy", item: "explorer" })}
          >
            {s.cosmetic === "explorer" ? (
              <>
                <Check size={18} /> Dimiliki
              </>
            ) : (
              <>
                <Gem size={18} /> 35 poin
              </>
            )}
          </button>
        </section>
      </div>
    </>
  );
}
type SocialData = {
  squad?: { name: string; code: string };
  members: { id: string; name: string; xp: number; kudos: number }[];
  posts: { id: string; name: string; body: string }[];
  league: { name: string; xp: number }[];
  tier?: string;
};
export function Social({
  s,
  userId,
  notice,
}: {
  s: GrowthState;
  userId: string;
  notice: (text: string) => void;
}) {
  const [data, setData] = useState<SocialData>({
    members: [],
    posts: [],
    league: [],
  });
  const [code, setCode] = useState(""),
    [name, setName] = useState(""),
    [body, setBody] = useState(""),
    [busy, setBusy] = useState(false);
  const connected = !!cloud && userId !== "device";
  const load = useCallback(async () => {
    try {
      setData(await rpc("growth_social"));
    } catch (e) {
      notice(String((e as Error).message));
    }
  }, [notice]);
  useEffect(() => {
    if (connected) void load();
  }, [connected, load]);
  async function action(action: string, payload: Record<string, string> = {}) {
    setBusy(true);
    try {
      await rpc("growth_social_action", {
        p_action: action,
        p_payload: payload,
      });
      await load();
      notice("Berhasil disimpan.");
    } catch (e) {
      notice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="g-page-head">
        <span className="g-eyebrow">TUMBUH BARENG, TANPA BANDING-BANDING</span>
        <h1>Ruang Bersama</h1>
        <p>Sedikit teman, lebih banyak dukungan.</p>
      </div>
      {!connected && (
        <div className="g-callout">
          <ShieldCheck size={20} />
          <p>
            Squad dan liga membutuhkan akun Supabase yang tersambung. Progres
            perangkatmu tetap bisa digunakan; tidak ada anggota atau peringkat
            fiktif.
          </p>
        </div>
      )}
      <section className="g-card">
        <div className="g-section-head">
          <h2>
            <Users size={21} /> Squad kecilmu
          </h2>
          <span>Maks. 6 orang</span>
        </div>
        {data.squad ? (
          <>
            <div className="squad-invite">
              <strong>{data.squad.name}</strong>
              <button
                className="g-btn small secondary"
                onClick={() =>
                  navigator.clipboard.writeText(data.squad!.code).then(
                    () => notice("Kode disalin."),
                    () =>
                      notice("Tidak bisa menyalin. Kode: " + data.squad!.code),
                  )
                }
              >
                <Copy size={15} /> {data.squad.code}
              </button>
            </div>
            {data.members.map((m) => (
              <div className="quest-row" key={m.id}>
                <span className="avatar">{m.name.charAt(0)}</span>
                <div>
                  <strong>{m.name}</strong>
                  <p>
                    {m.xp} XP · {m.kudos} dukungan
                  </p>
                </div>
                <button
                  className="g-btn small secondary"
                  disabled={busy || m.id === userId}
                  onClick={() => void action("kudos", { recipient: m.id })}
                >
                  Beri kudos
                </button>
              </div>
            ))}
            <small>
              Maksimal 5 kudos per hari. Isi jurnal tidak dibagikan.
            </small>
            <button
              className="g-btn small secondary"
              disabled={busy}
              onClick={() => void action("leave")}
            >
              Keluar squad
            </button>
          </>
        ) : (
          <div className="squad-forms">
            <label className="g-field">
              <span>Buat squad</span>
              <input
                placeholder="Nama squad"
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                className="g-btn"
                disabled={!connected || busy || name.trim().length < 3}
                onClick={() => void action("create", { name })}
              >
                <Plus size={17} /> Buat squad
              </button>
            </label>
            <label className="g-field">
              <span>Punya kode undangan?</span>
              <input
                placeholder="Kode squad"
                maxLength={20}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
              <button
                className="g-btn secondary"
                disabled={!connected || busy || code.trim().length < 4}
                onClick={() => void action("join", { code })}
              >
                Gabung squad
              </button>
            </label>
          </div>
        )}
      </section>
      <section className="g-card">
        <span className="g-eyebrow">REFLEKSI MINGGU INI</span>
        <h2>Hal kecil apa yang membuatmu merasa didukung?</h2>
        <textarea
          aria-label="Jawaban refleksi squad"
          placeholder="Bagikan hanya yang nyaman kamu ceritakan…"
          maxLength={1000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          className="g-btn"
          disabled={!data.squad || busy || !body.trim()}
          onClick={() => void action("post", { body }).then(() => setBody(""))}
        >
          Bagikan ke squad
        </button>
        {data.posts.map((p) => (
          <div className="social-post" key={p.id}>
            <strong>{p.name}</strong>
            <p>{p.body}</p>
          </div>
        ))}
      </section>
      <section className="g-card">
        <h2>Progres squad</h2>
        <p>
          Saling mendukung melalui langkah kecil. Liga lintas-squad belum
          diaktifkan pada revamp ini.
        </p>
        <p>XP minggumu: {weeklyXP(s)}</p>
      </section>
    </>
  );
}
