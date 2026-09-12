import { useEffect, useState } from "react";
export type Locale = "id" | "en";
export type Theme = "light" | "dark" | "system";
export type Preferences = { locale: Locale; theme: Theme };
export function normalizePreferences(
  raw: Partial<Preferences> | null,
  legacyDark = false,
): Preferences {
  return {
    locale: raw?.locale === "en" ? "en" : "id",
    theme: ["light", "dark", "system"].includes(raw?.theme || "")
      ? raw!.theme!
      : legacyDark
        ? "dark"
        : "system",
  };
}
export function usePreferences(owner: string, legacyDark: boolean) {
  const read = () => {
    try {
      return normalizePreferences(
        JSON.parse(
          localStorage.getItem("tarsio:preferences:" + owner) || "null",
        ),
        legacyDark,
      );
    } catch {
      return normalizePreferences(null, legacyDark);
    }
  };
  const [stored, setStored] = useState(() => ({ owner, value: read() }));
  const value = stored.owner === owner ? stored.value : read();
  const [systemDark, setSystemDark] = useState(
    () => matchMedia("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const dark =
    value.theme === "dark" || (value.theme === "system" && systemDark);
  useEffect(() => {
    document.documentElement.lang = value.locale;
    document.documentElement.dataset.growthTheme = dark ? "dark" : "light";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [value.locale, dark]);
  function update(patch: Partial<Preferences>) {
    const next = normalizePreferences({ ...value, ...patch });
    localStorage.setItem("tarsio:preferences:" + owner, JSON.stringify(next));
    setStored({ owner, value: next });
  }
  return {
    ...value,
    dark,
    update,
    t: (id: string, en: string) => (value.locale === "en" ? en : id),
  };
}
