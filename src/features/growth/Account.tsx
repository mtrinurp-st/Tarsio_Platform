import { Copy } from "./copy";
import { useDialog } from "./dialog";
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
  const dialog = useDialog(close);
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
        ref={dialog}
        className="g-onboarding"
        role="dialog"
        aria-modal="true"
        aria-label="Siapkan perjalananmu"
      >
        <button className="g-icon close" aria-label="Tutup" onClick={close}>
          <X />
        </button>
        <TarsyMascot lang="id" size={100} />
        <span className="g-eyebrow">
          <Copy text="KENALAN DULU, YUK ·" />
          {step + 1}/5
        </span>
        <progress value={step + 1} max={5} />
        {step === 0 ? (
          <>
            <h1>
              <Copy text="Aku Tarsy." />
              <br />
              <Copy text="Panggil kamu siapa?" />
            </h1>
            <p>
              <Copy text="Kita mulai pelan-pelan, sesuai ritmemu." />
            </p>
            <input
              aria-label="Nama panggilan"
              placeholder="Nama panggilanmu"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </>
        ) : step === 1 ? (
          <>
            <h1>
              <Copy text="Bagaimana kabarmu" />
              <br />
              <Copy text="akhir-akhir ini?" />
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
                  <Copy text={m} />
                </button>
              ))}
            </div>
          </>
        ) : step === 2 ? (
          <>
            <h1>
              <Copy text="Mulai dari yang" />
              <br />
              <Copy text="paling kamu butuhkan." />
            </h1>
            <div className="onboard-units">
              {units.map((u) => (
                <button
                  className={unit === u.id ? "selected" : ""}
                  key={u.id}
                  onClick={() => setUnit(u.id)}
                >
                  <Copy text={u.title} />
                  {unit === u.id && <Check size={17} />}
                </button>
              ))}
            </div>
          </>
        ) : step === 3 ? (
          <>
            <h1>
              <Copy text="Berapa menit" />
              <br />
              <Copy text="untuk dirimu?" />
            </h1>
            <div className="g-options">
              {[5, 10, 15].map((g) => (
                <button
                  className={goal === g ? "selected" : ""}
                  key={g}
                  onClick={() => setGoal(g)}
                >
                  {g}
                  <Copy text="menit / hari" />{" "}
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
              <Copy text="Apa yang ingin" />
              <br />
              <Copy text="kamu rasakan?" />
            </h1>
            <p>
              <Copy text="Bukan target besar. Cukup satu alasan untuk kembali." />
            </p>
            <textarea
              aria-label="Alasan bertumbuh"
              placeholder="Aku ingin merasa lebih…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
            />
            <p className="g-private">
              <Copy text="Refleksimu privat. Tidak ada jawaban benar atau salah." />
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
            <Copy
              text={
                busy
                  ? "Menyimpan…"
                  : step === 4
                    ? "Mulai perjalananku"
                    : "Lanjut"
              }
            />
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
  locale = "id",
}: {
  close: () => void;
  recovery?: boolean;
  locale?: "id" | "en";
}) {
  const t = (id: string, en: string) => (locale === "en" ? en : id);
  const ref = useDialog(close);
  const [mode, setMode] = useState(recovery ? "password" : "login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [name, setName] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false);
  useEffect(() => {
    if (recovery) setMode("password");
  }, [recovery]);
  function change(next: string) {
    setMode(next);
    setMessage("");
    setError("");
    setPassword("");
    setConfirmation("");
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cloud || busy) return;
    setError("");
    setMessage("");
    if (
      (mode === "register" || mode === "password") &&
      password !== confirmation
    ) {
      setError(t("Kedua kata sandi belum sama.", "The passwords don’t match."));
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await cloud.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        close();
      } else if (mode === "register") {
        const { data, error } = await cloud.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: name.trim(), language_pref: locale },
            emailRedirectTo: location.origin + location.pathname,
          },
        });
        if (error) throw error;
        if (data.session) close();
        else
          setMessage(
            t(
              "Periksa email untuk mengonfirmasi akunmu. Setelah itu, kamu bisa masuk.",
              "Check your email to confirm your account. Then you can sign in.",
            ),
          );
      } else if (mode === "reset") {
        const { error } = await cloud.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: location.origin + location.pathname,
        });
        if (error) throw error;
        setMessage(
          t(
            "Jika alamat ini terdaftar, tautan pemulihan akan dikirim. Periksa juga folder spam.",
            "If this address is registered, a recovery link will be sent. Check your spam folder too.",
          ),
        );
      } else if (mode === "resend") {
        const { error } = await cloud.auth.resend({
          type: "signup",
          email: email.trim(),
          options: { emailRedirectTo: location.origin + location.pathname },
        });
        if (error) throw error;
        setMessage(
          t(
            "Jika akun memerlukan konfirmasi, email akan dikirim ulang.",
            "If your account needs confirmation, another email will be sent.",
          ),
        );
      } else {
        const { error } = await cloud.auth.updateUser({ password });
        if (error) throw error;
        setMessage(
          t(
            "Kata sandi diperbarui. Kamu bisa menutup jendela ini.",
            "Password updated. You can close this window.",
          ),
        );
        setPassword("");
        setConfirmation("");
      }
    } catch (e) {
      const code = (e as { code?: string }).code;
      setError(
        code === "invalid_credentials"
          ? t(
              "Email atau kata sandi belum cocok. Coba lagi.",
              "The email or password doesn’t match. Please retry.",
            )
          : code === "email_not_confirmed"
            ? t(
                "Konfirmasi email terlebih dahulu, atau kirim ulang tautannya.",
                "Confirm your email first, or resend the link.",
              )
            : code === "over_email_send_rate_limit"
              ? t(
                  "Tunggu sebentar sebelum meminta email lagi.",
                  "Please wait before requesting another email.",
                )
              : t(
                  "Permintaan belum berhasil. Periksa koneksi dan coba lagi.",
                  "The request didn’t go through. Check your connection and retry.",
                ),
      );
    } finally {
      setBusy(false);
    }
  }
  const title =
    mode === "register"
      ? t("Buat akun Tarsio", "Create your Tarsio account")
      : mode === "reset"
        ? t("Atur ulang kata sandi", "Reset your password")
        : mode === "password"
          ? t("Pilih kata sandi baru", "Choose a new password")
          : mode === "resend"
            ? t("Kirim ulang konfirmasi", "Resend confirmation")
            : t("Selamat datang kembali", "Welcome back");
  return (
    <div className="g-overlay">
      <section
        ref={ref}
        className="g-auth"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          className="g-icon close"
          onClick={close}
          aria-label={t("Tutup", "Close")}
        >
          <X />
        </button>
        <Mail size={32} />
        <h1>{title}</h1>
        <p>
          {t(
            "Simpan langkah kecilmu, lalu lanjutkan saat kamu siap.",
            "Keep your small steps, and return when you’re ready.",
          )}
        </p>
        {!cloud ? (
          <div className="g-callout">
            <p>
              {t(
                "Akun online belum tersedia pada preview ini. Kamu tetap bisa mencoba perjalanan dan menyimpan progres di browser ini.",
                "Online accounts aren’t available in this preview yet. You can still explore the journey and save progress in this browser.",
              )}
            </p>
            <button className="g-btn secondary" onClick={close}>
              {t("Lanjutkan di perangkat ini", "Continue on this device")}
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            {mode === "register" && (
              <label className="g-field">
                <span>{t("Nama panggilan", "Display name")}</span>
                <input
                  required
                  minLength={2}
                  maxLength={40}
                  autoComplete="nickname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={busy}
                />
              </label>
            )}
            {mode !== "password" && (
              <label className="g-field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                />
              </label>
            )}
            {["login", "register", "password"].includes(mode) && (
              <>
                <label className="g-field">
                  <span>{t("Kata sandi", "Password")}</span>
                  <input
                    type={show ? "text" : "password"}
                    required
                    minLength={mode === "login" ? 1 : 8}
                    maxLength={128}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                  />
                </label>
                <button
                  type="button"
                  className="text-button"
                  aria-pressed={show}
                  onClick={() => setShow(!show)}
                >
                  {show
                    ? t("Sembunyikan kata sandi", "Hide password")
                    : t("Tampilkan kata sandi", "Show password")}
                </button>
              </>
            )}
            {["register", "password"].includes(mode) && (
              <label className="g-field">
                <span>{t("Ulangi kata sandi", "Confirm password")}</span>
                <input
                  type={show ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  disabled={busy}
                />
                <small>
                  {t(
                    "Gunakan setidaknya 8 karakter.",
                    "Use at least 8 characters.",
                  )}
                </small>
              </label>
            )}
            <button className="g-btn" disabled={busy}>
              {busy
                ? t("Memproses…", "Working…")
                : mode === "login"
                  ? t("Masuk", "Sign in")
                  : mode === "register"
                    ? t("Buat akun", "Create account")
                    : mode === "password"
                      ? t("Simpan kata sandi", "Save password")
                      : t("Kirim email", "Send email")}
            </button>
            <div className="auth-links">
              {mode !== "register" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => change("register")}
                >
                  {t("Buat akun", "Create account")}
                </button>
              )}
              {mode !== "login" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => change("login")}
                >
                  {t("Masuk", "Sign in")}
                </button>
              )}
              {mode === "login" && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => change("reset")}
                  >
                    {t("Lupa kata sandi?", "Forgot password?")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => change("resend")}
                  >
                    {t("Kirim ulang konfirmasi", "Resend confirmation")}
                  </button>
                </>
              )}
            </div>
          </form>
        )}
        {error && (
          <p role="alert" className="g-error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="g-callout success">
            {message}
          </p>
        )}
        <p className="g-private">
          {t(
            "Progres mode perangkat tidak otomatis dipindahkan ke akun online.",
            "Device progress is not automatically transferred to an online account.",
          )}
        </p>
      </section>
    </div>
  );
}
