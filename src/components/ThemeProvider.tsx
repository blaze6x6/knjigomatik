"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_DARK, DEFAULT_LIGHT, THEMES, THEME_STORAGE_KEY } from "@/lib/themes";

/** "auto" = sledi nastavitvi sistema (svetla/temna), sicer ID izbrane teme. */
export type ThemeSetting = "auto" | string;

interface Ctx {
  setting: ThemeSetting;
  /** ID teme, ki se dejansko uporablja */
  active: string;
  setSetting: (s: ThemeSetting) => void;
}

const ThemeContext = createContext<Ctx>({ setting: "auto", active: DEFAULT_LIGHT, setSetting: () => {} });
export const useTheme = () => useContext(ThemeContext);

const ids = new Set(THEMES.map((t) => t.id));
const systemDark = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;

function resolve(setting: ThemeSetting, dark: boolean): string {
  if (ids.has(setting)) return setting;
  return dark ? DEFAULT_DARK : DEFAULT_LIGHT;
}

function apply(id: string) {
  const root = document.documentElement;
  root.dataset.theme = id;
  const t = THEMES.find((x) => x.id === id);
  if (!t) return;
  root.style.colorScheme = t.mode;
  // barva vrstice brskalnika na telefonu
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = t.paper;
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [setting, setSettingState] = useState<ThemeSetting>("auto");
  const [dark, setDark] = useState(false);

  // začetno stanje beremo po hidraciji (pred prvim izrisom je že nastavljeno z zagonskim skriptom)
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(THEME_STORAGE_KEY); } catch { /* zasebni način */ }
    if (saved === "light") saved = DEFAULT_LIGHT; // vrednosti iz starejših različic
    if (saved === "dark") saved = DEFAULT_DARK;
    setSettingState(saved && ids.has(saved) ? saved : "auto");
    setDark(systemDark());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const active = resolve(setting, dark);
  useEffect(() => { apply(active); }, [active]);

  const setSetting = useCallback((s: ThemeSetting) => {
    setSettingState(s);
    try {
      if (s === "auto") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, s);
    } catch { /* zasebni način */ }
  }, []);

  const value = useMemo(() => ({ setting, active, setSetting }), [setting, active, setSetting]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
