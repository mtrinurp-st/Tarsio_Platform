import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  Flame,
  Gem,
  Heart,
  LayoutDashboard,
  Leaf,
  Lock,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Sprout,
  Sun,
  Target,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { TarsyMascot } from "@/components/TarsyMascot";
import { lessons, units, validateStep, type Lesson } from "./catalog";
import {
  applyAction,
  dailyQuests,
  dayKey,
  effectiveStreak,
  evolution,
  freshState,
  level,
  weeklyXP,
  type Action,
  type GrowthState,
  type Progress,
} from "./engine";
import {
  cloud,
  loadCloud,
  readLocal,
  readPending,
  rpc,
  SESSION_ID,
  writeLocal,
  writePending,
} from "./storage";
import LessonPlayer from "./LessonPlayer";
import { draftIsNewer, initialAnswers, ownedProgress } from "./drafts";
import { Blueprint, Missions, Shop, Social } from "./Views";
import { AuthModal, Onboarding } from "./Account";
import CMS from "./CMS";
import "./growth.css";
import { usePreferences } from "./preferences";
import CommunityQuests from "./CommunityQuests";
type Page =
  | "learn"
  | "explore"
  | "missions"
  | "blueprint"
  | "social"
  | "shop"
  | "settings"
  | "admin"
  | "community";
const nav = [
  { id: "learn", label: "Perjalanan", icon: Compass },
  { id: "explore", label: "Jelajahi", icon: BookOpen },
  { id: "missions", label: "Misi harian", icon: Target },
  { id: "social", label: "Ruang bersama", icon: Users },
  { id: "blueprint", label: "Life Blueprint", icon: Leaf },
  { id: "shop", label: "Toko Tarsy", icon: ShoppingBag },
] as const;
const moods = [
  ["🌤️", "Tenang"],
  ["⚡", "Bersemangat"],
  ["🌧️", "Lelah"],
  ["🌀", "Banyak pikiran"],
  ["🌱", "Penuh harapan"],
];
function localCatalog() {
  try {
    return (
      JSON.parse(localStorage.getItem("tarsio:cms:v2") || "null") || lessons
    );
  } catch {
    return lessons;
  }
}
export default function GrowthApp() {
  const [s, setS] = useState<GrowthState>(() => readLocal("device"));
  const state = useRef(s);
  const [userId, setUserId] = useState("device"),
    [isAdmin, setIsAdmin] = useState(false),
    [loading, setLoading] = useState(false),
    [cloudReady, setCloudReady] = useState(false);
  const identity = useRef("device");
  const preferences = usePreferences(userId, s.dark);
  const { t } = preferences;
  const [catalog, setCatalog] = useState<Lesson[]>(localCatalog),
    [page, setPage] = useState<Page>(() => {
      const p = location.hash.slice(1);
      return [
        "learn",
        "explore",
        "missions",
        "blueprint",
        "social",
        "shop",
        "settings",
        "admin",
        "community",
      ].includes(p)
        ? (p as Page)
        : "learn";
    }),
    [unit, setUnit] = useState(s.startUnit),
    [active, setActive] = useState<string | null>(null),
    [onboarding, setOnboarding] = useState(false),
    [auth, setAuth] = useState(false),
    [recovery, setRecovery] = useState(false),
    [mobile, setMobile] = useState(false),
    [toast, setToast] = useState(""),
    [sync, setSync] = useState("Tersimpan di perangkat"),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [confirmReset, setConfirmReset] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const pending = useRef<Record<string, Progress>>({});
  const actionBusy = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const notice = useCallback((m: string) => {
    setToast(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 6000);
  }, []);
  const persist = useCallback(
    (next: GrowthState, expectedId = identity.current) => {
      if (identity.current !== expectedId) return false;
      state.current = next;
      setS(next);
      try {
        writeLocal(expectedId, next);
        return true;
      } catch {
        setSync("Penyimpanan perangkat penuh");
        notice(
          "Draf belum tersimpan pada perangkat. Ekspor data atau kosongkan ruang browser.",
        );
        return false;
      }
    },
    [notice],
  );
  useEffect(() => {
    if (!cloud) return;
    let cancelled = false;
    async function sessionChanged(id?: string) {
      if (cancelled) return;
      const nextId = id || "device";
      if (identity.current === nextId) return;
      clearTimeout(saveTimer.current);
      pending.current = {};
      queue.current = Promise.resolve();
      identity.current = nextId;
      setUserId(nextId);
      setActive(null);
      setLoading(!!id);
      setCloudReady(false);
      setIsAdmin(false);
      persist(readLocal(nextId));
      if (!id) {
        setCatalog(localCatalog());
        setSync("Tersimpan di perangkat");
        return;
      }
      try {
        let next = await loadCloud();
        if (cancelled || identity.current !== nextId) return;
        pending.current = readPending(nextId);
        for (const [lessonId, draft] of Object.entries(pending.current)) {
          if (cancelled || identity.current !== nextId) return;
          const remote = next.progress[lessonId];
          if (draftIsNewer(draft, remote)) {
            try {
              await rpc("growth_save_progress", {
                p_lesson_id: lessonId,
                p_progress: ownedProgress(nextId, draft),
              });
              if (cancelled || identity.current !== nextId) return;
              delete pending.current[lessonId];
            } catch {
              if (cancelled || identity.current !== nextId) return;
              next.progress[lessonId] = draft;
            }
          } else delete pending.current[lessonId];
        }
        if (cancelled || identity.current !== nextId) return;
        writePending(nextId, pending.current);
        if (!Object.keys(pending.current).length) next = await loadCloud();
        if (cancelled || identity.current !== nextId) return;
        persist(next, nextId);
        setUnit(next.startUnit);
        setCloudReady(true);
        setSync(
          Object.keys(pending.current).length
            ? "Draf lokal · sinkronisasi tertunda"
            : "Tersimpan di akun",
        );
        const [{ data: role }, { data: content }] = await Promise.all([
          cloud!.from("profiles").select("role").eq("id", id).single(),
          cloud!
            .from("growth_content")
            .select("schema_json")
            .order("sort_order"),
        ]);
        if (cancelled || identity.current !== nextId) return;
        setIsAdmin(role?.role === "admin");
        if (content?.length)
          setCatalog(content.map((x) => x.schema_json as Lesson));
        else setCatalog(lessons);
      } catch (e) {
        if (cancelled || identity.current !== nextId) return;
        notice(
          "Akun masuk, tetapi data belum dapat dimuat: " + (e as Error).message,
        );
        setSync("Koneksi data perlu diperiksa");
      } finally {
        if (!cancelled && identity.current === nextId) setLoading(false);
      }
    }
    cloud.auth
      .getSession()
      .then(({ data }) => sessionChanged(data.session?.user.id))
      .catch((e) => notice(e.message));
    const { data } = cloud.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecovery(true);
        setAuth(true);
      }
      setTimeout(() => void sessionChanged(session?.user.id), 0);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [persist, notice]);
  useEffect(() => {
    const f = () => {
      const p = location.hash.slice(1) as Page;
      if (
        [
          "learn",
          "explore",
          "missions",
          "blueprint",
          "social",
          "shop",
          "settings",
          "admin",
          "community",
        ].includes(p)
      )
        setPage(p);
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);

  const go = (p: Page) => {
    setPage(p);
    location.hash = p;
    setMobile(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  async function flush() {
    clearTimeout(saveTimer.current);
    if (identity.current === "device") return;
    if (!cloudReady)
      throw new Error(
        "Koneksi data belum siap. Draf tetap tersimpan pada perangkat ini.",
      );
    const batch = { ...pending.current };
    if (!Object.keys(batch).length) {
      await queue.current;
      return;
    }
    const id = identity.current;
    const task = queue.current
      .catch(() => undefined)
      .then(async () => {
        for (const [lessonId, progress] of Object.entries(batch)) {
          if (identity.current !== id) throw new Error("Akun telah berubah.");
          await rpc("growth_save_progress", {
            p_lesson_id: lessonId,
            p_progress: ownedProgress(id, progress),
          });
          if (identity.current !== id) throw new Error("Akun telah berubah.");
          if (pending.current[lessonId] === progress)
            delete pending.current[lessonId];
          writePending(id, pending.current);
        }
        if (identity.current === id)
          setSync(
            Object.keys(pending.current).length
              ? "Menyimpan draf…"
              : "Tersimpan di akun",
          );
      });
    queue.current = task;
    await task;
  }
  function saveDraft(id: string, p: Progress) {
    p = { ...p, updatedAt: new Date().toISOString() };
    const stored = persist({
      ...state.current,
      progress: { ...state.current.progress, [id]: p },
    });
    if (userId === "device") {
      if (stored) setSync("Tersimpan di perangkat");
      return;
    }
    pending.current[id] = p;
    try {
      writePending(userId, pending.current);
    } catch {
      notice("Draf belum dapat disimpan. Penyimpanan browser penuh.");
    }
    setSync("Menyimpan draf…");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(
      () =>
        void flush().catch(() =>
          setSync("Draf lokal · klik coba sinkronkan di Pengaturan"),
        ),
      700,
    );
  }
  async function act(a: Action) {
    const requestUser = identity.current;
    if (actionBusy.current)
      throw new Error("Tunggu penyimpanan sebelumnya selesai.");
    actionBusy.current = true;
    setBusy(true);
    try {
      if (userId === "device") {
        if (!persist(applyAction(state.current, a)))
          throw new Error(
            "Perubahan belum tersimpan. Periksa ruang penyimpanan browser.",
          );
      } else {
        await flush();
        if (identity.current !== requestUser)
          throw new Error("Akun telah berubah.");
        const next = await rpc("growth_action", {
          p_action: { ...a, expectedUserId: requestUser },
        });
        if (identity.current !== requestUser)
          throw new Error("Akun telah berubah.");
        persist({
          ...freshState(),
          ...next,
          progress: { ...next.progress, ...pending.current },
        });
      }
      if (a.type === "claim")
        notice("Reward masuk! Terima kasih sudah hadir hari ini.");
      if (a.type === "buy") notice("Hadiahmu sudah siap.");
    } catch (e) {
      notice((e as Error).message);
      throw e;
    } finally {
      actionBusy.current = false;
      setBusy(false);
    }
  }
  const safeAct = async (a: Action) => {
    try {
      await act(a);
    } catch {
      /* notification is shown by act */
    }
  };
  async function settings(patch: Partial<GrowthState>) {
    const requestUser = identity.current;
    if (userId === "device") {
      if (!persist({ ...state.current, ...patch }))
        throw new Error(
          "Pengaturan belum tersimpan. Periksa ruang penyimpanan browser.",
        );
    } else {
      await flush();
      if (identity.current !== requestUser)
        throw new Error("Akun telah berubah.");
      const next = await rpc("growth_settings", {
        p_settings: { ...patch, expectedUserId: requestUser },
      });
      if (identity.current !== requestUser)
        throw new Error("Akun telah berubah.");
      persist(
        {
          ...freshState(),
          ...next,
          progress: { ...next.progress, ...pending.current },
        },
        requestUser,
      );
    }
  }
  const visible = catalog.filter((l) => l.published),
    current = units.find((u) => u.id === unit) || units[0],
    unitLessons = visible.filter((l) => l.unit === unit),
    completed = unitLessons.filter((l) => s.progress[l.id]?.completedAt).length;
  function accessible(l: Lesson) {
    const group = visible.filter((x) => x.unit === l.unit),
      index = group.findIndex((x) => x.id === l.id);
    if (s.freeRoam || s.progress[l.id]?.completedAt) return true;
    const unitOpen =
      l.unit === s.startUnit ||
      l.unit === 1 ||
      visible
        .filter((x) => x.unit === l.unit - 1)
        .every((x) => s.progress[x.id]?.completedAt);
    return (
      unitOpen &&
      (index === 0 || !!s.progress[group[index - 1].id]?.completedAt)
    );
  }
  function open(id: string) {
    const l = visible.find((l) => l.id === id);
    if (!l) return;
    if (!s.onboarded) {
      setOnboarding(true);
      return;
    }
    if (!accessible(l)) {
      notice(
        "Selesaikan langkah sebelumnya, atau aktifkan Jelajah Bebas di Pengaturan.",
      );
      return;
    }
    setActive(id);
    if (!s.progress[id])
      saveDraft(id, {
        answers: initialAnswers(id),
        step: 0,
        startedAt: new Date().toISOString(),
        sessionId: SESSION_ID,
      });
  }
  const next =
    unitLessons.find((l) => !s.progress[l.id]?.completedAt) || unitLessons[0];
  const selectedLesson = catalog.find((l) => l.id === active);
  const closeLesson = useCallback(() => {
    setActive(null);
  }, []);
  async function complete() {
    if (!active || !selectedLesson) return;
    const p = state.current.progress[active];
    for (let i = 0; i < selectedLesson.steps.length; i++) {
      const error = validateStep(selectedLesson, i, p.answers);
      if (error) throw new Error(error);
    }
    await act({
      type: "complete",
      lessonId: active,
      singleSession: p.sessionId === SESSION_ID,
      sessionId: SESSION_ID,
    });
  }
  async function saveContent(l: Lesson) {
    if (userId !== "device") {
      if (!isAdmin) throw new Error("Hanya admin yang dapat mengubah konten.");
      await rpc("growth_save_content", { p_content: l });
    }
    const next = catalog.some((x) => x.id === l.id)
      ? catalog.map((x) => (x.id === l.id ? l : x))
      : [...catalog, l];
    if (userId === "device")
      localStorage.setItem("tarsio:cms:v2", JSON.stringify(next));
    setCatalog(next);
  }
  const streak = effectiveStreak(s);
  return (
    <div className={"g-app " + (preferences.dark ? "g-dark" : "")}>
      <a className="skip-link" href="#main-content">
        Lewati ke konten
      </a>
      <aside className={"g-sidebar " + (mobile ? "open" : "")}>
        <button className="g-brand" onClick={() => go("learn")}>
          <TarsyMascot lang="id" size={43} />
          <span>
            tarsio<span className="brand-dot">.</span>
          </span>
        </button>
        <span className="g-brand-sub">a softer way to figure things out</span>
        <nav aria-label="Navigasi utama">
          {nav.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "active" : ""}
              onClick={() => go(n.id)}
            >
              <n.icon size={21} />
              {t(
                n.label,
                {
                  learn: "Journey",
                  explore: "Explore",
                  missions: "Daily missions",
                  social: "Friends",
                  blueprint: "Life Blueprint",
                  shop: "Tarsy shop",
                }[n.id],
              )}
              {n.id === "missions" && (
                <span className="nav-count">
                  {
                    dailyQuests(s).filter(
                      (q) =>
                        !Object.prototype.hasOwnProperty.call(
                          s.events,
                          "quest:" + q.id + ":" + dayKey(),
                        ),
                    ).length
                  }
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => go("community")}
            className={page === "community" ? "active" : ""}
          >
            <Users size={20} />
            {t("Quest komunitas", "Community quests")}
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Sprout size={25} />
            <strong>Tumbuh dengan ritmemu.</strong>
            <p>
              Kecil hari ini.
              <br />
              Berarti di kemudian hari.
            </p>
          </div>
          {(isAdmin || userId === "device") && (
            <button
              onClick={() => go("admin")}
              className={page === "admin" ? "active" : ""}
            >
              <LayoutDashboard size={19} /> Content Studio
            </button>
          )}
          <button onClick={() => go("settings")}>
            <Settings size={20} /> {t("Pengaturan", "Settings")}
          </button>
          <button
            className="profile-link"
            onClick={() =>
              userId === "device" ? setAuth(true) : go("blueprint")
            }
          >
            <span className="avatar">{s.name.charAt(0).toUpperCase()}</span>
            <span>
              <strong>{s.name}</strong>
              <small>
                {userId === "device" ? "Mode perangkat" : "Akun tersambung"}
              </small>
            </span>
            <ChevronRight size={17} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Tutup menu"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="g-workspace">
        <header className="g-topbar">
          <div className="top-left">
            <button
              className="g-icon mobile-toggle"
              aria-label="Buka menu"
              onClick={() => setMobile(!mobile)}
            >
              <Menu />
            </button>
            <span>
              {page === "learn"
                ? t("Perjalananmu", "Your journey")
                : nav.find((n) => n.id === page)?.label ||
                  (page === "admin"
                    ? "Content Studio"
                    : page === "community"
                      ? t("Quest komunitas", "Community quests")
                      : t("Pengaturan", "Settings"))}
            </span>
            <span className="top-divider">/</span>
            <small>{t("Ruang untuk bertumbuh", "Room to grow")}</small>
          </div>
          <div className="top-stats">
            <label className="g-language">
              <span className="sr-only">
                {t("Bahasa aplikasi", "App language")}
              </span>
              <select
                aria-label={t("Bahasa aplikasi", "App language")}
                value={preferences.locale}
                onChange={(e) => {
                  try {
                    preferences.update({
                      locale: e.target.value as "id" | "en",
                    });
                  } catch {
                    notice(
                      t(
                        "Preferensi belum tersimpan.",
                        "Preferences could not be saved.",
                      ),
                    );
                  }
                }}
              >
                <option value="id">ID</option>
                <option value="en">EN</option>
              </select>
            </label>
            <button title="Streak" onClick={() => go("missions")}>
              <Flame className="orange" size={21} />
              <b>{streak}</b>
              <small>{t("hari", "days")}</small>
            </button>
            <button title="Poin" onClick={() => go("shop")}>
              <Gem className="teal" size={21} />
              <b>{s.gems}</b>
            </button>
            <button title="Total XP" onClick={() => go("blueprint")}>
              <Zap className="gold-text" size={21} />
              <b>{s.xp}</b>
              <small>XP</small>
            </button>
            <button
              className="notification"
              aria-label="Lihat pengingat"
              onClick={() => go("missions")}
            >
              <Bell size={20} />
            </button>
          </div>
        </header>
        <div className="g-content-layout">
          <main
            id="main-content"
            className={"g-main " + (page !== "learn" ? "full" : "")}
          >
            {loading && (
              <div className="g-callout" role="status">
                Memuat progres akun…
              </div>
            )}
            {userId === "device" && (
              <div className="device-label">
                <span>
                  <ShieldCheck size={14} /> Progres tersimpan di browser ini
                </span>
                <button onClick={() => setAuth(true)}>
                  Hubungkan akun <ArrowRight size={13} />
                </button>
              </div>
            )}
            {page === "learn" && (
              <>
                <div className="g-page-head greeting">
                  <div>
                    <span className="g-eyebrow">
                      SETIAP LANGKAH ITU BERARTI
                    </span>
                    <h1>
                      Hai, {s.name === "Penjelajah" ? "penjelajah" : s.name}.
                      <span> Yuk, tumbuh lagi.</span>
                    </h1>
                    <p>Kamu nggak perlu menyelesaikan semuanya hari ini.</p>
                  </div>
                  <Sun size={38} className="greeting-sun" />
                </div>
                <section className="journey-banner">
                  <div className="journey-copy">
                    <span className="g-eyebrow">
                      {s.onboarded
                        ? "LANGKAH KECIL HARI INI"
                        : "PERJALANAN BARUMU DIMULAI DI SINI"}
                    </span>
                    <h2>
                      {s.onboarded
                        ? "Lima menit untuk\ndirimu sendiri."
                        : "Kenali dirimu.\nTemukan ritmemu."}
                    </h2>
                    <p>
                      {s.onboarded
                        ? "Tarsy siap menemani. Mulai dari yang kamu rasakan."
                        : "Quest singkat untuk hidup yang lebih kamu pahami."}
                    </p>
                    <button
                      className="g-btn"
                      onClick={() =>
                        s.onboarded && next
                          ? open(next.id)
                          : setOnboarding(true)
                      }
                    >
                      {s.onboarded
                        ? "Lanjutkan perjalanan"
                        : "Siapkan perjalananku"}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                  <div
                    className={
                      "hero-mascot " +
                      (s.cosmetic === "explorer" ? "explorer-aura" : "")
                    }
                  >
                    <span className="mascot-spark one">✦</span>
                    <TarsyMascot size={182} lang="id" mood="happy" />
                    <span className="mascot-spark two">✧</span>
                    <div className="mascot-caption">
                      pelan-pelan juga sampai.
                    </div>
                  </div>
                </section>
                <div className="path-heading">
                  <div>
                    <h2>Jalur bertumbuhmu</h2>
                    <p>Satu quest, satu hal baru tentang dirimu.</p>
                  </div>
                  <button
                    className="g-btn small secondary"
                    onClick={() => go("explore")}
                  >
                    Semua unit <ChevronRight size={15} />
                  </button>
                </div>
                <div
                  className="unit-tabs"
                  role="tablist"
                  aria-label="Unit perjalanan"
                >
                  {units.map((u) => (
                    <button
                      key={u.id}
                      role="tab"
                      aria-selected={unit === u.id}
                      className={unit === u.id ? "selected" : ""}
                      onClick={() => setUnit(u.id)}
                    >
                      {u.id.toString().padStart(2, "0")} <span>{u.short}</span>
                    </button>
                  ))}
                </div>
                <section
                  className="skill-path"
                  style={{ "--unit-color": current.color } as CSSProperties}
                >
                  <div className="unit-banner">
                    <span className="unit-emblem">
                      <Sun size={29} />
                    </span>
                    <div>
                      <span className="g-eyebrow">
                        UNIT {unit} · {unitLessons.length} QUEST
                      </span>
                      <h2>{current.title}</h2>
                      <p>{current.description}</p>
                    </div>
                    <span className="unit-completion">
                      {completed}/{unitLessons.length}
                    </span>
                  </div>
                  <div className="path-track">
                    {unitLessons.map((l, i) => {
                      const done = !!s.progress[l.id]?.completedAt,
                        available = accessible(l),
                        isNext = next?.id === l.id;
                      return (
                        <div
                          className={
                            "path-stop position-" +
                            (i % 3) +
                            (done ? " complete" : "") +
                            (isNext ? " current" : "") +
                            (!available ? " locked" : "")
                          }
                          key={l.id}
                        >
                          <div className="node-wrap">
                            {isNext && available && (
                              <span className="start-label">
                                {s.progress[l.id]
                                  ? "LANJUTKAN"
                                  : "MULAI DI SINI"}
                              </span>
                            )}
                            <button
                              className="path-node"
                              aria-label={
                                (done
                                  ? "Ulangi "
                                  : available
                                    ? "Mulai "
                                    : "Terkunci: ") + l.title
                              }
                              onClick={() => open(l.id)}
                            >
                              {done ? (
                                <Check size={33} />
                              ) : !available ? (
                                <Lock size={26} />
                              ) : i === 0 ? (
                                <Sun size={33} />
                              ) : i === 1 ? (
                                <Heart size={29} />
                              ) : (
                                <ShieldCheck size={30} />
                              )}
                            </button>
                          </div>
                          <div className="node-caption">
                            <h3>{l.title}</h3>
                            <p>
                              {done
                                ? "Selesai · boleh diulang"
                                : l.minutes + " menit · 50 XP"}
                            </p>
                            {isNext && available && (
                              <span className="node-kind">
                                Refleksi interaktif
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="path-end">
                      <Award size={27} />
                      <strong>{current.badge}</strong>
                      <small>Selesaikan unit untuk membuka lencana</small>
                    </div>
                  </div>
                </section>
                <div className="bottom-note">
                  <Leaf size={18} />
                  <span>
                    Perjalananmu bukan perlombaan. Kamu boleh istirahat.
                  </span>
                </div>
              </>
            )}
            {page === "explore" && (
              <>
                <div className="g-page-head">
                  <span className="g-eyebrow">
                    TEMUKAN RUANG YANG KAMU BUTUHKAN
                  </span>
                  <h1>Jelajahi perjalanan</h1>
                  <p>Tujuh area hidup. Satu langkah kecil untuk mulai.</p>
                </div>
                <label className="g-search">
                  <Search size={18} />
                  <input
                    placeholder="Cari energi, finansial, karier…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <div className="explore-grid">
                  {units
                    .filter(
                      (u) =>
                        (u.title + " " + u.description)
                          .toLowerCase()
                          .includes(query.toLowerCase()) ||
                        visible.some(
                          (l) =>
                            l.unit === u.id &&
                            l.title.toLowerCase().includes(query.toLowerCase()),
                        ),
                    )
                    .map((u) => (
                      <section
                        className="g-card explore-unit"
                        key={u.id}
                        style={{ "--unit-color": u.color } as CSSProperties}
                      >
                        <span className="unit-number">
                          {String(u.id).padStart(2, "0")}
                        </span>
                        <h2>{u.title}</h2>
                        <p>{u.description}</p>
                        <progress
                          value={
                            visible.filter(
                              (l) =>
                                l.unit === u.id &&
                                s.progress[l.id]?.completedAt,
                            ).length
                          }
                          max={visible.filter((l) => l.unit === u.id).length}
                        />
                        {visible
                          .filter((l) => l.unit === u.id)
                          .map((l) => (
                            <button
                              className="explore-lesson"
                              key={l.id}
                              onClick={() => open(l.id)}
                            >
                              {s.progress[l.id]?.completedAt ? (
                                <Check size={17} />
                              ) : (
                                <BookOpen size={17} />
                              )}
                              <span>{l.title}</span>
                              <small>{l.minutes}m</small>
                            </button>
                          ))}
                      </section>
                    ))}
                </div>
              </>
            )}
            {page === "missions" && (
              <Missions key={userId} s={s} act={safeAct} open={open} />
            )}
            {page === "blueprint" && (
              <Blueprint key={userId} s={s} catalog={catalog} open={open} />
            )}
            {page === "shop" && <Shop s={s} act={safeAct} />}
            {page === "social" && (
              <Social key={userId} s={s} userId={userId} notice={notice} />
            )}
            {page === "admin" && (
              <CMS
                key={userId}
                catalog={catalog}
                onSave={saveContent}
                isAdmin={isAdmin}
                device={userId === "device"}
              />
            )}
            {page === "community" && (
              <CommunityQuests
                key={userId}
                owner={userId}
                admin={isAdmin}
                locale={preferences.locale}
              />
            )}
            {page === "settings" && (
              <>
                <div className="g-page-head">
                  <span className="g-eyebrow">SESUAIKAN RUANGMU</span>
                  <h1>Pengaturan</h1>
                  <p>Perjalanan ini milikmu.</p>
                </div>
                <section className="g-card">
                  <h2>Profil & ritme</h2>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      void settings({
                        name: String(f.get("name")),
                        goal: Number(f.get("goal")),
                      }).then(
                        () => notice("Profil diperbarui."),
                        (e) => notice(e.message),
                      );
                    }}
                  >
                    <label className="g-field">
                      <span>Nama panggilan</span>
                      <input
                        name="name"
                        defaultValue={s.name}
                        minLength={2}
                        maxLength={40}
                        required
                      />
                    </label>
                    <label className="g-field">
                      <span>Target waktu harian</span>
                      <select name="goal" defaultValue={s.goal}>
                        {[5, 10, 15].map((g) => (
                          <option key={g} value={g}>
                            {g} menit
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="g-btn">Simpan profil</button>
                  </form>
                </section>
                <section className="g-card">
                  <h2>{t("Preferensi", "Preferences")}</h2>
                  <label className="setting-row">
                    <span>{t("Bahasa aplikasi", "App language")}</span>
                    <select
                      value={preferences.locale}
                      onChange={(e) => {
                        try {
                          preferences.update({
                            locale: e.target.value as "id" | "en",
                          });
                        } catch {
                          notice(
                            t(
                              "Preferensi belum tersimpan.",
                              "Preferences could not be saved.",
                            ),
                          );
                        }
                      }}
                    >
                      <option value="id">Bahasa Indonesia</option>
                      <option value="en">English</option>
                    </select>
                  </label>
                  <label className="setting-row">
                    <span>{t("Tema", "Theme")}</span>
                    <select
                      value={preferences.theme}
                      onChange={(e) => {
                        try {
                          preferences.update({
                            theme: e.target.value as
                              "light" | "dark" | "system",
                          });
                        } catch {
                          notice(
                            t(
                              "Preferensi belum tersimpan.",
                              "Preferences could not be saved.",
                            ),
                          );
                        }
                      }}
                    >
                      <option value="system">
                        {t("Ikuti perangkat", "System")}
                      </option>
                      <option value="light">{t("Terang", "Light")}</option>
                      <option value="dark">{t("Gelap", "Dark")}</option>
                    </select>
                  </label>
                  <p>
                    {t(
                      "Preferensi disimpan pada browser ini untuk akun yang sedang digunakan. Sebagian konten perjalanan masih tersedia dalam Bahasa Indonesia.",
                      "Preferences are saved in this browser for the current account. Some journey content is currently available in Indonesian.",
                    )}
                  </p>
                  {(
                    [
                      {
                        key: "freeRoam",
                        title: "Jelajah bebas",
                        text: "Buka semua unit tanpa urutan. XP tetap hanya sekali per quest.",
                      },
                      {
                        key: "notifications",
                        title: "Pengingat dalam aplikasi",
                        text: "Lihat tindak lanjut di halaman Misi.",
                      },
                    ] as const
                  ).map((x) => (
                    <label className="setting-row" key={x.key}>
                      <span>
                        <strong>{x.title}</strong>
                        <small>{x.text}</small>
                      </span>
                      <input
                        type="checkbox"
                        role="switch"
                        checked={s[x.key]}
                        onChange={(e) =>
                          void settings({ [x.key]: e.target.checked }).catch(
                            (e) => notice(e.message),
                          )
                        }
                      />
                    </label>
                  ))}
                </section>
                <section className="g-card">
                  <h2>{t("Akun & data", "Account & data")}</h2>
                  <details className="g-callout">
                    <summary>
                      {t(
                        "Privasi dan kerahasiaan",
                        "Privacy and confidentiality",
                      )}
                    </summary>
                    <p>
                      {t(
                        "Jurnal, mood, dan jawaban pribadi tidak dipublikasikan kepada creator quest atau moderator konten. Hanya isi quest yang sengaja kamu ajukan yang masuk antrean review. Jangan menuliskan PIN, OTP, identitas lengkap, atau data orang lain.",
                        "Journals, moods and private answers are not published to quest creators or content moderators. Only quest content you explicitly submit enters the review queue. Do not include PINs, verification codes, full identifiers or other people’s data.",
                      )}
                    </p>
                    <p>
                      {t(
                        "Mode perangkat menyimpan data pada browser ini. Akun tersambung menggunakan pembatasan akses per pemilik; ini bukan enkripsi end-to-end. Ekspor berisi data pribadi, jadi simpan dengan hati-hati.",
                        "Device mode stores data in this browser. Connected accounts use owner-scoped access controls; this is not end-to-end encryption. Exports contain private data, so store them carefully.",
                      )}
                    </p>
                  </details>
                  <p>{sync}</p>
                  <div className="button-row">
                    <button
                      className="g-btn secondary"
                      onClick={() =>
                        userId === "device"
                          ? setAuth(true)
                          : void cloud?.auth.signOut()
                      }
                    >
                      {userId === "device" ? (
                        <>
                          <ShieldCheck size={18} /> Hubungkan akun
                        </>
                      ) : (
                        <>
                          <LogOut size={18} /> Keluar akun
                        </>
                      )}
                    </button>
                    {userId !== "device" && (
                      <button
                        className="g-btn secondary"
                        onClick={() =>
                          void flush().then(
                            () => notice("Sinkronisasi selesai."),
                            (e) => notice(e.message),
                          )
                        }
                      >
                        Coba sinkronkan
                      </button>
                    )}
                    <button
                      className="g-btn secondary"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(s, null, 2)], {
                          type: "application/json",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "tarsio-data-pribadi.json";
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                      }}
                    >
                      Ekspor data pribadi
                    </button>
                  </div>
                  <p className="g-private">
                    Ekspor JSON berisi refleksi pribadi. Simpan di tempat yang
                    kamu percaya.
                  </p>
                  {userId === "device" && (
                    <button
                      className="text-danger"
                      onClick={() => setConfirmReset(true)}
                    >
                      Hapus progres perangkat ini
                    </button>
                  )}
                </section>
              </>
            )}
          </main>
          {page === "learn" && (
            <aside className="g-rightbar">
              <section className="g-card streak-card">
                <div className="g-section-head">
                  <h3>Jaga langkah kecilmu</h3>
                  <Flame className="orange" size={22} />
                </div>
                <div className="streak-total">
                  <strong>{streak}</strong>
                  <span>hari bertumbuh</span>
                </div>
                <div className="week-dots">
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    const key = dayKey(d);
                    const active =
                      !!s.moods[key] ||
                      Object.keys(s.events).some((e) => e.endsWith(key));
                    return (
                      <div key={key}>
                        <span>
                          {
                            ["M", "S", "S", "R", "K", "J", "S"][
                              new Date(key).getDay()
                            ]
                          }
                        </span>
                        <i className={active ? "done" : ""}>
                          {active ? (
                            <Check size={13} />
                          ) : i === 6 ? (
                            <Flame size={13} />
                          ) : null}
                        </i>
                      </div>
                    );
                  })}
                </div>
                <p>
                  <Snowflake size={15} /> {s.freezes} Streak Freeze tersimpan
                </p>
              </section>
              <section className="g-card mood-card">
                <h3>Apa kabarmu hari ini?</h3>
                <p>Nggak perlu selalu baik-baik saja.</p>
                <div className="mood-picker">
                  {moods.map(([emoji, label]) => (
                    <button
                      key={label}
                      title={label}
                      aria-label={label}
                      aria-pressed={s.moods[dayKey()] === label}
                      className={s.moods[dayKey()] === label ? "selected" : ""}
                      disabled={busy}
                      onClick={() =>
                        void safeAct({ type: "mood", value: label })
                      }
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <small>
                  {s.moods[dayKey()]
                    ? "Hari ini: " + s.moods[dayKey()]
                    : "Pilih yang paling mendekati perasaanmu."}
                </small>
              </section>
              <section className="g-card daily-card">
                <div className="g-section-head">
                  <h3>Misi harian</h3>
                  <button onClick={() => go("missions")}>Lihat semua</button>
                </div>
                {dailyQuests(s).map((q) => (
                  <div className="daily-mini" key={q.id}>
                    <span className={q.ready ? "ready" : ""}>
                      {q.ready ? <Check size={17} /> : <Target size={17} />}
                    </span>
                    <div>
                      <strong>{q.title}</strong>
                      <small>+{q.xp} XP</small>
                      <progress value={q.ready ? 1 : 0} max={1} />
                    </div>
                  </div>
                ))}
              </section>
              <section className="league-card">
                <div className="league-art">
                  <Trophy size={36} />
                </div>
                <h3>Teman satu perjalanan</h3>
                <p>
                  Tumbuh bareng penjelajah lain.
                  <br />
                  Saling dukung, bukan saling buru.
                </p>
                <button
                  className="g-btn secondary"
                  onClick={() => go("social")}
                >
                  Lihat ruang bersama <ChevronRight size={16} />
                </button>
              </section>
              <div className="companion-note">
                <TarsyMascot size={58} lang="id" />
                <p>
                  “Satu langkah kecil hari ini sudah lebih dari cukup.”
                  <small>— Tarsy</small>
                </p>
              </div>
            </aside>
          )}
        </div>
        <footer className="g-site-footer">
          <span>tarsio. · Ruang aman untuk bertumbuh</span>
          <span>
            {evolution(s.xp)} · Lv. {level(s.xp)} · {weeklyXP(s)} XP minggu ini
          </span>
        </footer>
      </div>
      {onboarding && (
        <Onboarding
          s={s}
          save={async (p) => {
            await settings(p);
            if (p.startUnit) setUnit(p.startUnit);
          }}
          close={() => setOnboarding(false)}
        />
      )}
      {auth && (
        <AuthModal
          recovery={recovery}
          close={() => {
            setAuth(false);
            setRecovery(false);
          }}
        />
      )}
      {selectedLesson && active && (
        <LessonPlayer
          key={active}
          lesson={selectedLesson}
          draft={s.progress[active]}
          save={(p) => saveDraft(active, p)}
          complete={complete}
          close={closeLesson}
          syncLabel={sync}
        />
      )}
      {toast && (
        <div className="g-toast" role="status">
          <Sparkles size={18} />
          {toast}
          <button
            className="g-icon"
            aria-label="Tutup pemberitahuan"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {confirmReset && (
        <div className="g-overlay">
          <section
            className="g-auth"
            role="alertdialog"
            aria-modal="true"
            aria-label="Hapus progres perangkat"
          >
            <h2>Hapus progres perangkat?</h2>
            <p>
              Refleksi, XP, dan pengaturan lokal akan dihapus. Ekspor data
              terlebih dahulu jika ingin menyimpannya.
            </p>
            <div className="button-row">
              <button
                className="g-btn secondary"
                onClick={() => setConfirmReset(false)}
              >
                Batal
              </button>
              <button
                className="g-btn danger"
                onClick={() => {
                  persist(freshState());
                  setConfirmReset(false);
                  notice("Progres perangkat dihapus.");
                }}
              >
                Hapus progres
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
