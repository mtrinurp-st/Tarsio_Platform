import { useEffect, useRef, useState } from "react";
import { Music2, Pause, Play } from "lucide-react";
import type { Locale } from "./preferences";
// Original, procedurally composed ambient music. No downloaded audio or trackers.
export default function Ambience({ locale }: { locale: Locale }) {
  const t = (id: string, en: string) => (locale === "en" ? en : id);
  const audio = useRef<AudioContext | null>(null),
    master = useRef<GainNode | null>(null),
    timer = useRef<ReturnType<typeof setInterval>>();
  const [playing, setPlaying] = useState(false),
    [error, setError] = useState("");
  const [volume, setVolume] = useState(() => {
    try {
      return Math.max(
        0,
        Math.min(
          1,
          Number(localStorage.getItem("tarsio:music-volume") || ".2"),
        ),
      );
    } catch {
      return 0.2;
    }
  });
  function stop() {
    clearInterval(timer.current);
    void audio.current?.close();
    audio.current = null;
    master.current = null;
    setPlaying(false);
  }
  useEffect(
    () => () => {
      clearInterval(timer.current);
      void audio.current?.close();
    },
    [],
  );
  useEffect(() => {
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  async function start() {
    if (audio.current) return;
    setPlaying(true);
    try {
      const Context =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Context) throw new Error("AudioContext unavailable");
      const ctx = new Context();
      audio.current = ctx;
      const output = ctx.createGain();
      const warmth = ctx.createBiquadFilter();
      master.current = output;
      output.gain.value = volume * 0.2;
      warmth.type = "lowpass";
      warmth.frequency.value = 1450;
      warmth.Q.value = 0.35;
      output.connect(warmth);
      warmth.connect(ctx.destination);
      await ctx.resume();
      if (audio.current !== ctx) return;
      let bar = 0;
      const chords = [
        [130.81, 164.81, 196, 246.94], // Cmaj7
        [110, 130.81, 164.81, 220], // Am7
        [87.31, 130.81, 174.61, 220], // Fmaj7
        [98, 146.83, 196, 246.94], // Gsus2
      ];
      const schedule = () => {
        if (ctx.state === "closed") return;
        const now = ctx.currentTime;
        chords[bar++ % chords.length].forEach((hz, i) => {
          const osc = ctx.createOscillator(),
            gain = ctx.createGain();
          osc.type = i === 0 ? "triangle" : "sine";
          osc.detune.value = i % 2 ? 3 : -3;
          osc.frequency.value = hz * (i === 3 ? 2 : 1);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.14, now + 1.5 + i * 0.12);
          gain.gain.linearRampToValueAtTime(0.09, now + 3.8);
          gain.gain.linearRampToValueAtTime(0, now + 6.6);
          osc.connect(gain);
          gain.connect(output);
          osc.start(now);
          osc.stop(now + 6.8);
          osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
          };
        });
      };
      schedule();
      timer.current = setInterval(schedule, 5600);
      setPlaying(true);
      setError("");
    } catch {
      stop();
      setError(
        t(
          "Audio belum dapat diputar. Coba lagi.",
          "Audio could not start. Please retry.",
        ),
      );
    }
  }
  return (
    <section className="g-card ambience">
      <div>
        <Music2 size={24} />
        <h2>{t("Musik untuk jeda", "Music for a pause")}</h2>
      </div>
      <p>
        {t(
          "Nada ambient lembut untuk menemani refleksi. Musik berhenti saat tab ditinggalkan.",
          "A soft ambient soundscape for reflection. Music pauses when you leave this tab.",
        )}
      </p>
      <div className="button-row">
        <button
          className="g-btn secondary"
          aria-pressed={playing}
          onClick={() => (playing ? stop() : void start())}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}{" "}
          {playing
            ? t("Matikan musik", "Turn music off")
            : t("Nyalakan musik", "Turn music on")}
        </button>
        <label>
          {t("Volume", "Volume")}
          <input
            aria-label={t("Volume musik", "Music volume")}
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              if (master.current && audio.current)
                master.current.gain.setTargetAtTime(
                  v * 0.2,
                  audio.current.currentTime,
                  0.1,
                );
              try {
                localStorage.setItem("tarsio:music-volume", String(v));
              } catch {
                /* Playback still works without storage. */
              }
            }}
          />
        </label>
      </div>
      {error && <p role="alert">{error}</p>}
      <small>
        {t(
          "Tidak diputar otomatis. Kamu yang memilih kapan mulai.",
          "No autoplay. You choose when to start.",
        )}
      </small>
    </section>
  );
}
