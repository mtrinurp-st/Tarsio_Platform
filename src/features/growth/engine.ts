import { lessons, units, type Answers } from "./catalog";
export type Progress = {
  answers: Answers;
  step: number;
  completedAt?: string;
  startedAt: string;
  sessionId: string;
  updatedAt?: string;
};
export type GrowthState = {
  name: string;
  onboarded: boolean;
  goal: number;
  startUnit: number;
  freeRoam: boolean;
  dark: boolean;
  publicProfile: boolean;
  xp: number;
  gems: number;
  freezes: number;
  streak: number;
  longest: number;
  lastDay: string;
  events: Record<string, number>;
  progress: Record<string, Progress>;
  moods: Record<string, string>;
  actions: Record<string, string>;
  cosmetic: string;
  notifications: boolean;
};
export const freshState = (): GrowthState => ({
  name: "Penjelajah",
  onboarded: false,
  goal: 5,
  startUnit: 1,
  freeRoam: false,
  dark: false,
  publicProfile: false,
  xp: 0,
  gems: 0,
  freezes: 0,
  streak: 0,
  longest: 0,
  lastDay: "",
  events: {},
  progress: {},
  moods: {},
  actions: {},
  cosmetic: "original",
  notifications: true,
});
export function dayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function dayDistance(a: string, b: string) {
  return Math.round(
    (Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000,
  );
}
export function touch(s: GrowthState, day: string) {
  if (s.lastDay === day) return;
  const diff = s.lastDay ? dayDistance(s.lastDay, day) : 999;
  const missed = Math.max(0, diff - 1);
  if (s.lastDay && missed <= s.freezes) {
    s.freezes -= missed;
    s.streak += 1;
  } else s.streak = 1;
  s.longest = Math.max(s.longest, s.streak);
  s.lastDay = day;
  if ([3, 7, 30].includes(s.streak)) {
    const k = "milestone:" + day;
    if (!s.events[k]) {
      s.events[k] = 0;
      s.gems += s.streak === 30 ? 50 : s.streak === 7 ? 20 : 10;
    }
  }
}
export function effectiveStreak(s: GrowthState, day = dayKey()) {
  if (!s.lastDay) return 0;
  return dayDistance(s.lastDay, day) - 1 > s.freezes ? 0 : s.streak;
}
export function weekStart(now = new Date()) {
  const day = dayKey(now);
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
export function weeklyXP(s: GrowthState) {
  const start = weekStart();
  return Object.entries(s.events)
    .filter(([k]) => k.slice(-10) >= start)
    .reduce((a, [, v]) => a + v, 0);
}
export function level(xp: number) {
  return Math.floor(xp / 150) + 1;
}
export function evolution(xp: number) {
  const l = level(xp);
  return l >= 31
    ? "Tarsy Purnama"
    : l >= 16
      ? "Tarsy Bijak"
      : l >= 6
        ? "Tarsy Penjelajah"
        : "Tarsy Kecil";
}
export function badges(s: GrowthState) {
  const result = units
    .filter((u) =>
      lessons
        .filter((l) => l.unit === u.id)
        .every((l) => s.progress[l.id]?.completedAt),
    )
    .map((u) => u.badge);
  if (Object.values(s.progress).some((p) => p.completedAt))
    result.unshift("Langkah Pertama");
  if (s.longest >= 3) result.push("3 Hari Bertumbuh");
  if (s.longest >= 7) result.push("Seminggu Bersama");
  return result;
}
export function dailyQuests(s: GrowthState, day = dayKey()) {
  return [
    {
      id: "mood",
      title: "Sapa perasaanmu",
      description: "Catat mood hari ini",
      xp: 10,
      gems: 2,
      ready: !!s.moods[day],
    },
    {
      id: "lesson",
      title: "Satu langkah berarti",
      description: "Selesaikan satu quest",
      xp: 15,
      gems: 3,
      ready: Object.values(s.progress).some(
        (p) => p.completedAt && dayKey(new Date(p.completedAt)) === day,
      ),
    },
    {
      id: "reflection",
      title: "Ruang untuk refleksi",
      description: "Tulis satu hal yang kamu syukuri",
      xp: 10,
      gems: 2,
      ready: !!s.actions["reflection:" + day]?.trim(),
    },
  ];
}
export type Action =
  | { type: "mood"; value: string }
  | {
      type: "complete";
      lessonId: string;
      singleSession: boolean;
      sessionId?: string;
    }
  | { type: "claim"; questId: string }
  | { type: "buy"; item: string }
  | { type: "action"; key: string; value: string };
export function applyAction(
  source: GrowthState,
  action: Action,
  now = new Date(),
): GrowthState {
  const s = structuredClone(source),
    day = dayKey(now);
  const award = (key: string, xp: number, gems = 0) => {
    if (Object.prototype.hasOwnProperty.call(s.events, key)) return;
    s.events[key] = xp;
    s.xp += xp;
    s.gems += gems;
    touch(s, day);
  };
  if (action.type === "mood") {
    s.moods[day] = action.value;
    touch(s, day);
  }
  if (action.type === "complete") {
    const p = s.progress[action.lessonId];
    if (!p) throw new Error("Draf belum tersimpan.");
    if (!p.completedAt) {
      p.completedAt = now.toISOString();
      award(
        "lesson:" + action.lessonId + ":" + day,
        50 + (action.singleSession ? 10 : 0),
      );
    }
  }
  if (action.type === "claim") {
    const q = dailyQuests(s, day).find((q) => q.id === action.questId);
    if (!q?.ready) throw new Error("Selesaikan misi terlebih dahulu.");
    award("quest:" + q.id + ":" + day, q.xp, q.gems);
  }
  if (action.type === "buy") {
    const freeze = action.item === "freeze",
      cost = freeze ? 20 : 35;
    if (s.gems < cost) throw new Error("Insight Gems belum cukup.");
    if (freeze && s.freezes >= 2)
      throw new Error("Kamu sudah punya dua Streak Freeze.");
    if (!freeze && s.cosmetic === "explorer")
      throw new Error("Aksesori sudah dimiliki.");
    s.gems -= cost;
    if (freeze) s.freezes++;
    else s.cosmetic = "explorer";
  }
  if (action.type === "action") {
    s.actions[action.key] = action.value;
    if (action.key.startsWith("plan:") && action.value === "Perlu waktu")
      s.actions["planDue:" + action.key.split(":")[1]] = new Date(
        now.getTime() + 86400000,
      ).toISOString();
    touch(s, day);
  }
  return s;
}
export function projection(
  monthly: number,
  initial: number,
  rate: number,
  years: number,
) {
  const r = rate / 1200,
    n = years * 12;
  return r === 0
    ? initial + monthly * n
    : initial * Math.pow(1 + r, n) + monthly * ((Math.pow(1 + r, n) - 1) / r);
}
export function financialProgress(
  current: number,
  target: number,
  isMaximum = false,
) {
  if (isMaximum)
    return current <= target
      ? 100
      : Math.max(0, Math.round((target / current) * 100));
  return target === 0
    ? current === 0
      ? 100
      : 0
    : Math.min(100, Math.round((current / target) * 100));
}
