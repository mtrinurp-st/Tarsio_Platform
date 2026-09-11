import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Mail, X } from "lucide-react";
import { cloud } from "./storage";
import { units } from "./catalog";
import { type GrowthState } from "./engine";
import { TarsyMascot } from "@/components/TarsyMascot";
export function Onboarding({
  s,
  save,
  close,
}: {
  s: GrowthState;
  save: (patch: Partial<GrowthState>) => Promise<void>;
  close: () => void;
}) {
  const [step, setStep] = useState(0),
    [name, setName] = useState(s.name === "Penjelajah" ? "" : s.name),
    [unit, setUnit] = useState(s.startUnit),
    [goal, setGoal] = useState(s.goal),
    [mood, setMood] = useState(""),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const can = [
    name.trim().length >= 2,
    !!mood,
    unit > 0,
    goal > 0,
    reason.trim().length > 2,
  ][step];
  return (
    <div className="g-overlay">
      <section
        className="g-onboarding"
        role="dialog"
        aria-modal="true"
        aria-label="Siapkan perjalananmu"
      >
        <button className="g-icon close" aria-label="Tutup" onClick={close}>
          <X />
        </button>
        <TarsyMascot lang="id" size={100} />
        <span className="g-eyebrow">KENALAN DULU, YUK · {step + 1}/5</span>
        <progress value={step + 1} max={5} />
        {step === 0 ? (
          <>
            <h1>
              Aku Tarsy.
              <br />
              Panggil kamu siapa?
            </h1>
            <p>Kita mulai pelan-pelan, sesuai ritmemu.</p>
            <input
              aria-label="Nama panggilan"
              placeholder="Nama panggilanmu"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </>
        ) : step === 1 ? (
          <>
            <h1>
              Bagaimana kabarmu
              <br />
              akhir-akhir ini?
            </h1>
            <div className="g-options">
              {[
                "Penuh semangat",
                "Butuh jeda",
                "Banyak pikiran",
                "Sedang mencari arah",
              ].map((m) => (
                <button
                  className={mood === m ? "selected" : ""}
                  key={m}
                  onClick={() => setMood(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </>
        ) : step === 2 ? (
          <>
            <h1>
              Mulai dari yang
              <br />
              paling kamu butuhkan.
            </h1>
            <div className="onboard-units">
              {units.map((u) => (
                <button
                  className={unit === u.id ? "selected" : ""}
                  key={u.id}
                  onClick={() => setUnit(u.id)}
                >
                  {u.title}
                  {unit === u.id && <Check size={17} />}
                </button>
              ))}
            </div>
          </>
        ) : step === 3 ? (
          <>
            <h1>
              Berapa menit
              <br />
              untuk dirimu?
            </h1>
            <div className="g-options">
              {[5, 10, 15].map((g) => (
                <button
                  className={goal === g ? "selected" : ""}
                  key={g}
                  onClick={() => setGoal(g)}
                >
                  {g} menit / hari{" "}
                  <small>
                    {g === 5
                      ? "Langkah ringan"
                      : g === 10
                        ? "Ruang bertumbuh"
                        : "Jeda lebih panjang"}
                  </small>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1>
              Apa yang ingin
              <br />
              kamu rasakan?
            </h1>
            <p>Bukan target besar. Cukup satu alasan untuk kembali.</p>
            <textarea
              aria-label="Alasan bertumbuh"
              placeholder="Aku ingin merasa lebih…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
            />
            <p className="g-private">
              Refleksimu privat. Tidak ada jawaban benar atau salah.
            </p>
          </>
        )}
        {error && (
          <p className="g-error" role="alert">
            {error}
          </p>
        )}
        <div className="button-row">
          {step > 0 && (
            <button
              className="g-btn secondary"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={17} />
            </button>
          )}
          <button
            className="g-btn"
            disabled={!can || busy}
            onClick={async () => {
              if (step < 4) setStep(step + 1);
              else {
                setBusy(true);
                try {
                  await save({
                    name: name.trim(),
                    goal,
                    startUnit: unit,
                    onboarded: true,
                    actions: { ...s.actions, onboardingMood: mood, reason },
                  });
                  close();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }
            }}
          >
            {busy ? "Menyimpan…" : step === 4 ? "Mulai perjalananku" : "Lanjut"}
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
export function AuthModal({
  close,
  recovery = false,
}: {
  close: () => void;
  recovery?: boolean;
}) {
  const [mode, setMode] = useState(recovery ? "password" : "login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (recovery) setMode("password");
  }, [recovery]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cloud) return;
    setBusy(true);
    setMessage("");
    try {
      if (mode === "login") {
        const { error } = await cloud.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        close();
      } else if (mode === "register") {
        const { data, error } = await cloud.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name, language_pref: "id" },
            emailRedirectTo: location.origin,
          },
        });
        if (error) throw error;
        if (data.session) close();
        else setMessage("Cek email untuk mengonfirmasi akun sebelum masuk.");
      } else if (mode === "reset") {
        const { error } = await cloud.auth.resetPasswordForEmail(email, {
          redirectTo: location.origin,
        });
        if (error) throw error;
        setMessage("Jika email terdaftar, tautan pemulihan akan dikirim.");
      } else {
        const { error } = await cloud.auth.updateUser({ password });
        if (error) throw error;
        setMessage("Kata sandi berhasil diperbarui.");
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="g-overlay">
      <section
        className="g-auth"
        role="dialog"
        aria-modal="true"
        aria-label="Akun Tarsio"
      >
        <button className="g-icon close" aria-label="Tutup" onClick={close}>
          <X />
        </button>
        <Mail size={32} />
        <h1>
          {mode === "register"
            ? "Buat ruangmu."
            : mode === "reset"
              ? "Kembali ke akunmu."
              : mode === "password"
                ? "Kata sandi baru."
                : "Selamat datang lagi."}
        </h1>
        {!cloud ? (
          <div className="g-callout">
            <p>
              Akun online belum diaktifkan pada versi ini. Kamu bisa menjelajahi
              seluruh quest dalam mode perangkat. Data tersimpan hanya pada
              browser ini.
            </p>
            <p>
              Untuk mengaktifkan akun, pemilik aplikasi perlu memasang
              konfigurasi Supabase dan menjalankan migrasi yang disertakan.
            </p>
          </div>
        ) : (
          <form onSubmit={submit}>
            {mode === "register" && (
              <label className="g-field">
                <span>Nama</span>
                <input
                  required
                  minLength={2}
                  maxLength={40}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </label>
            )}
            {mode !== "password" && (
              <label className="g-field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
            )}
            {mode !== "reset" && (
              <label className="g-field">
                <span>Kata sandi (minimal 8 karakter)</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
              </label>
            )}
            <button className="g-btn" disabled={busy}>
              {busy
                ? "Memproses…"
                : mode === "login"
                  ? "Masuk"
                  : mode === "register"
                    ? "Buat akun"
                    : mode === "reset"
                      ? "Kirim tautan"
                      : "Simpan kata sandi"}
            </button>
            <div className="auth-links">
              {mode !== "register" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setMessage("");
                  }}
                >
                  Buat akun
                </button>
              )}
              {mode !== "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setMessage("");
                  }}
                >
                  Masuk
                </button>
              )}
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("reset");
                    setMessage("");
                  }}
                >
                  Lupa kata sandi?
                </button>
              )}
            </div>
          </form>
        )}
        {message && <p role="status">{message}</p>}
        <p className="g-private">
          Mode perangkat dan akun online memiliki penyimpanan terpisah.
        </p>
      </section>
    </div>
  );
}
