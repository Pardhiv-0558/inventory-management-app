import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import { getSettings, saveSettings } from "@/src/store/db";
import { Settings } from "@/src/store/types";
import { darkTheme, lightTheme, ThemeColors, ThemeMode } from "./index";

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  themePref: "light" | "dark" | "system";
  setThemePref: (v: "light" | "dark" | "system") => Promise<void>;
  settings: Settings;
  setSettings: (s: Settings) => Promise<void>;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [settings, setSettingsState] = useState<Settings>({
    theme: "system",
    defaultMinStock: 20,
    ownerName: "Daivala Nagaraju",
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettingsState(s);
      setReady(true);
    })();
  }, []);

  const mode: ThemeMode = useMemo(() => {
    const pref = settings.theme;
    if (pref === "light") return "light";
    if (pref === "dark") return "dark";
    return system === "dark" ? "dark" : "light";
  }, [settings.theme, system]);

  const colors = mode === "dark" ? darkTheme : lightTheme;

  const setThemePref = async (v: "light" | "dark" | "system") => {
    const next = { ...settings, theme: v };
    setSettingsState(next);
    await saveSettings(next);
  };

  const setSettings = async (s: Settings) => {
    setSettingsState(s);
    await saveSettings(s);
  };

  return (
    <ThemeContext.Provider
      value={{ mode, colors, themePref: settings.theme, setThemePref, settings, setSettings, ready }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
