const dark = {
  primary: "#3b82f6",
  primaryForeground: "#ffffff",
  secondary: "#262626",
  secondaryForeground: "#e5e5e5",

  accent: "#1e3a8a",
  accentForeground: "#bfdbfe",

  background: "#171717",
  foreground: "#e5e5e5",
  destructive: "#ef4444",
}

const light = {
  primary: "#3b82f6",
  primaryForeground: "#ffffff",
  secondary: "#f3f4f6",
  secondaryForeground: "#4b5563",

  accent: "#e0f2fe",
  accentForeground: "#1e3a8a",

  background: "#ffffff",
  foreground: "#333333",
  destructive: "#ef4444",
}

const radius = {
  default: 99,
}
  
const theme = light;

export const mainColors = {
  primary: theme.primary,
  primaryForeground: theme.primaryForeground,
  secondary: theme.secondary,
  secondaryForeground: theme.secondaryForeground,

  accent: theme.accent,
  accentForeground: theme.accentForeground,

  background: theme.background,
  foreground: theme.foreground,
  destructive: theme.destructive,

  radius: radius.default,

  sm: 8,
  md: 12,
  lg: 16,
}