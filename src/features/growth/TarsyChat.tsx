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
}: {
  owner: string;
  locale: Locale;
  close: () => void;
  login: () => void;
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
  const ready = !!cloud && owner !== "device";
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(
    () => bottom.current?.scrollIntoView({ block: "nearest" }),
    [messages, busy],
  );
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!cloud || !ready || !consent || busy || !draft.trim()) return;
    setBusy(true);
    setError("");
    const next = [
      ...messages,
      { role: "user" as const, content: draft.trim() },
    ];
    try {
      const {
        data: { user },
      } = await cloud.auth.getUser();
      if (!alive.current) return;
      if (user?.id !== owner) throw Error("account");
      const { data, error } = await cloud.functions.invoke("chat-reply", {
        body: {
          messages: next
            .slice(-20)
            .map(({ role, content }) => ({ role, content })),
          lang: locale,
          user_id: owner,
          consent: true,
        },
      });
      if (!alive.current) return;
      if (error || !data?.reply) throw Error("provider");
      setMessages([
        ...next,
        { role: "tarsy", content: data.reply, fallback: !!data.fallback },
      ]);
      setDraft("");
    } catch {
      if (alive.current)
        setError(
          t(
            "Tarsy belum bisa merespons. Pesanmu tetap ada; coba lagi setelah koneksi tersedia.",
            "Tarsy could not respond. Your message is still here; retry when the connection is available.",
          ),
        );
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
        {!ready ? (
          <div className="g-callout">
            <p>
              {t(
                "Chat online membutuhkan akun yang tersambung. Pada preview ini, chat akan aktif setelah layanan akun dan Gemini dikonfigurasi.",
                "Online chat requires a connected account. In this preview, chat becomes available once account services and Gemini are configured.",
              )}
            </p>
            <button className="g-btn secondary" onClick={login}>
              {t("Buka akun", "Open account")} <MessageCircle size={18} />
            </button>
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
