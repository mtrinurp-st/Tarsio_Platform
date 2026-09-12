import { withDeadline } from "./request";
import { useEffect, useRef, useState } from "react";
import { Send, X, MessageCircle, RotateCcw } from "lucide-react";
import { TarsyMascot } from "@/components/TarsyMascot";
import { cloud } from "./storage";
import { useDialog } from "./dialog";
import type { Locale } from "./preferences";
type Message = { role: "user" | "tarsy"; content: string; fallback?: boolean };
export default function TarsyChat({
  owner,
  locale,
  close,
  login,
  accountLoading = false,
}: {
  owner: string;
  locale: Locale;
  close: () => void;
  login: () => void;
  accountLoading?: boolean;
}) {
  const t = (id: string, en: string) => (locale === "en" ? en : id);
  const [messages, setMessages] = useState<Message[]>([]),
    [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [consent, setConsent] = useState(false);
  const alive = useRef(true),
    bottom = useRef<HTMLDivElement>(null),
    ref = useDialog(close);
  const hasAccount = !!cloud && owner !== "device";
  const ready = hasAccount && !accountLoading;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!cloud || !ready || !consent || busy || !draft.trim()) return;
    setBusy(true);
    setError("");
    const base =
      error && messages[messages.length - 1]?.role === "user"
        ? messages.slice(0, -1)
        : messages;
    const next = [...base, { role: "user" as const, content: draft.trim() }];
    setMessages(next);
    try {
      const {
        data: { user },
      } = await withDeadline(cloud.auth.getUser());
      if (!alive.current) return;
      if (user?.id !== owner) throw Error("account");
      const { data, error } = await withDeadline(
        cloud.functions.invoke("chat-reply", {
          body: {
            messages: next
              .slice(-20)
              .map(({ role, content }) => ({ role, content })),
            lang: locale,
            user_id: owner,
            consent: true,
          },
        }),
        35000,
      );
      if (!alive.current) return;
      if (error) {
        const context = (error as { context?: Response }).context;
        let code = "provider";
        if (context instanceof Response) {
          const details = await withDeadline(
            context.clone().json(),
            3000,
          ).catch(() => null);
          if (details?.error === "GEMINI_NOT_CONFIGURED") code = "gemini";
          else if (context.status === 401 || context.status === 403)
            code = "account";
        }
        throw Error(code);
      }
      const payload = data as { reply?: unknown; fallback?: boolean } | null;
      if (typeof payload?.reply !== "string" || !payload.reply.trim())
        throw Error("provider");
      setMessages([
        ...next,
        {
          role: "tarsy",
          content: payload.reply.trim(),
          fallback: !!payload.fallback,
        },
      ]);
      setDraft("");
    } catch (e) {
      if (alive.current) {
        const code = e instanceof Error ? e.message : "provider";
        setError(
          code === "REQUEST_TIMEOUT"
            ? t(
                "Tarsy belum merespons dalam batas waktu. Pesanmu tetap ada; kamu bisa mencoba lagi.",
                "Tarsy did not respond in time. Your message is still here; you can retry.",
              )
            : code === "account"
              ? t(
                  "Sesi akun perlu diperbarui. Buka akun untuk masuk kembali.",
                  "Your session needs refreshing. Open your account to sign in again.",
                )
              : code === "gemini"
                ? t(
                    "Layanan Gemini belum dikonfigurasi. Pesanmu tetap di sesi ini; coba lagi setelah layanan diaktifkan.",
                    "Gemini is not configured yet. Your message stays in this session; retry once the service is enabled.",
                  )
                : t(
                    "Tarsy belum bisa merespons. Pesanmu tetap ada; coba lagi setelah koneksi tersedia.",
                    "Tarsy could not respond. Your message is still here; retry when the connection is available.",
                  ),
        );
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <div className="g-overlay">
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t("Ngobrol dengan Tarsy", "Talk to Tarsy")}
        aria-busy={accountLoading || busy}
        className="tarsy-chat"
      >
        <header>
          <div className="chat-identity">
            <TarsyMascot size={56} lang={locale} />
            <div>
              <h2>Tarsy</h2>
              <small>
                {t(
                  "Teman refleksi berbantuan AI",
                  "Your AI reflection companion",
                )}
              </small>
            </div>
          </div>
          <button
            className="g-icon"
            aria-label={t("Tutup chat", "Close chat")}
            onClick={close}
          >
            <X />
          </button>
        </header>
        <div className="chat-messages" role="log" aria-live="polite">
          <div className="chat-bubble tarsy">
            {t(
              "Hai, aku Tarsy. Apa yang ingin kamu ceritakan hari ini? Kita bisa mulai dari satu hal kecil.",
              "Hi, I’m Tarsy. What’s on your mind today? We can start with one small thing.",
            )}
          </div>
          {messages.map((m, i) => (
            <div key={i} className={"chat-bubble " + m.role}>
              <p>{m.content}</p>
              {m.fallback && (
                <small>
                  {t(
                    "Respons cadangan · Gemini belum tersedia",
                    "Fallback response · Gemini unavailable",
                  )}
                </small>
              )}
            </div>
          ))}
          {busy && (
            <div className="chat-bubble tarsy" role="status">
              {t("Tarsy sedang merespons…", "Tarsy is replying…")}
            </div>
          )}
          <div ref={bottom} />
        </div>
        {accountLoading ? (
          <div className="g-callout" role="status">
            <p>
              {t(
                "Sebentar, Tarsy sedang menyiapkan ruang akunmu…",
                "One moment, Tarsy is preparing your account space…",
              )}
            </p>
          </div>
        ) : !hasAccount ? (
          <div className="g-callout">
            <p>
              {t(
                "Chat membutuhkan akun yang terhubung. Pesan hanya digunakan dalam percakapan ini dan dihapus dari tampilan ketika kamu menutup chat.",
                "Chat requires a connected account. Messages are used for this conversation and cleared from the interface when you close it.",
              )}
            </p>
            {cloud ? (
              <button className="g-btn secondary" onClick={login}>
                {t("Hubungkan akun", "Connect account")}{" "}
                <MessageCircle size={18} />
              </button>
            ) : (
              <p role="status">
                {t(
                  "Chat online belum diaktifkan. Kamu tetap bisa mengisi quest dan refleksi di perjalananmu.",
                  "Online chat is not enabled yet. You can still complete quests and reflections on your journey.",
                )}
              </p>
            )}
          </div>
        ) : (
          <label className="chat-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              {t(
                "Saya setuju pesan pada sesi ini dikirim ke Gemini untuk membuat balasan. Jurnal lain tidak disertakan.",
                "I agree to send this session’s messages to Gemini to generate replies. Other journals are not included.",
              )}
            </span>
          </label>
        )}
        {error && (
          <p className="g-error" role="alert">
            {error}
          </p>
        )}
        {ready && !messages.length && (
          <div
            className="button-row"
            aria-label={t("Mulai cerita", "Conversation starters")}
          >
            {[
              t("Aku butuh didengarkan", "I need someone to listen"),
              t("Bantu aku menata pikiran", "Help me sort my thoughts"),
              t("Aku ingin refleksi hari ini", "I want to reflect on today"),
            ].map((prompt) => (
              <button
                type="button"
                className="g-btn small secondary"
                key={prompt}
                onClick={() => setDraft(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={send}>
          <label className="sr-only" htmlFor="tarsy-message">
            {t("Pesan untuk Tarsy", "Message for Tarsy")}
          </label>
          <textarea
            id="tarsy-message"
            rows={2}
            maxLength={2000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!ready || busy}
            placeholder={t(
              "Mulai dari yang sedang kamu rasakan…",
              "Start with how you’re feeling…",
            )}
          />
          <button
            className="g-btn"
            disabled={!ready || !consent || busy || !draft.trim()}
            aria-label={t("Kirim pesan", "Send message")}
          >
            <Send size={20} />
          </button>
        </form>
        <footer>
          <small>
            {t(
              "AI dapat keliru dan bukan pengganti bantuan profesional. Sesi ini tidak disimpan setelah chat ditutup.",
              "AI can make mistakes and is not a substitute for professional care. This session is cleared when you close the chat.",
            )}
          </small>
          <button
            className="g-icon"
            aria-label={t(
              "Hapus percakapan sesi ini",
              "Clear this conversation",
            )}
            disabled={busy}
            onClick={() => {
              setMessages([]);
              setDraft("");
            }}
          >
            <RotateCcw size={18} />
          </button>
        </footer>
      </section>
    </div>
  );
}
