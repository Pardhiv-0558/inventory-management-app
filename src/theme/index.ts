export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceElev: string;
  primary: string;
  primaryDark: string;
  primaryText: string;
  secondary: string;
  text: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  gradientFrom: string;
  gradientTo: string;
  overlay: string;
  chipBg: string;
  chipText: string;
  chipActiveBg: string;
  chipActiveText: string;
}

export const lightTheme: ThemeColors = {
  bg: "#F6F8FB",
  surface: "#FFFFFF",
  surfaceElev: "#FFFFFF",
  primary: "#2563EB",
  primaryDark: "#1E40AF",
  primaryText: "#FFFFFF",
  secondary: "#F59E0B",
  text: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  gradientFrom: "#2563EB",
  gradientTo: "#4338CA",
  overlay: "rgba(15,23,42,0.5)",
  chipBg: "#F1F5F9",
  chipText: "#334155",
  chipActiveBg: "#2563EB",
  chipActiveText: "#FFFFFF",
};

export const darkTheme: ThemeColors = {
  bg: "#0B1220",
  surface: "#111827",
  surfaceElev: "#1F2937",
  primary: "#3B82F6",
  primaryDark: "#1D4ED8",
  primaryText: "#FFFFFF",
  secondary: "#FBBF24",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  border: "#1F2937",
  borderStrong: "#334155",
  success: "#22C55E",
  danger: "#F87171",
  warning: "#FBBF24",
  info: "#60A5FA",
  gradientFrom: "#3B82F6",
  gradientTo: "#6366F1",
  overlay: "rgba(0,0,0,0.6)",
  chipBg: "#1F2937",
  chipText: "#CBD5E1",
  chipActiveBg: "#3B82F6",
  chipActiveText: "#FFFFFF",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};
