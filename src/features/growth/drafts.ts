import type { Answers } from "./catalog";
import type { Progress } from "./engine";

export function initialAnswers(lessonId: string): Answers {
  if (lessonId === "2-3") return { needs: 50, wants: 30, saving: 20 };
  if (lessonId === "2-4") return { initial: 0, rate: 5 };
  return {};
}

/** Server timestamps may include an offset instead of Z; compare instants. */
export function draftIsNewer(local: Progress, remote?: Progress): boolean {
  if (!remote) return true;
  const localTime = Date.parse(local.updatedAt || "");
  const remoteTime = Date.parse(remote.updatedAt || "");
  if (!Number.isFinite(remoteTime)) return true;
  return Number.isFinite(localTime) && localTime > remoteTime;
}

/** Pin pending private writes to the account that created them. */
export function ownedProgress(ownerId: string, progress: Progress) {
  if (!ownerId || ownerId === "device")
    throw new Error("Akun online diperlukan.");
  return { ...progress, ownerId };
}
