import { theme } from "antd";

const { defaultAlgorithm, darkAlgorithm } = theme;

export const getAntdTheme = (mode: "light" | "dark") => ({
  algorithm: mode === "dark" ? darkAlgorithm : defaultAlgorithm,
  token: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    borderRadius: 8,
    ...(mode === "light"
      ? {
          colorPrimary: "#1976d2",
          colorBgContainer: "#ffffff",
          colorBgLayout: "#f0f2f5",
        }
      : {
          colorPrimary: "#90caf9",
          colorBgContainer: "#23233a",
          colorBgLayout: "#13131f",
          colorBgElevated: "#2c2c48",
          colorBorder: "#35355a",
          colorBorderSecondary: "#2a2a48",
        }),
  },
});

/**
 * Semantic colour helpers that downstream pages can use
 * instead of hard-coding hex values.
 * Call with the current dark/light mode flag.
 */
export const getSemanticColors = (isDark: boolean) => ({
  // accent / primary – matches the token but available outside theme.useToken()
  primary: isDark ? "#90caf9" : "#1976d2",

  // surfaces
  cardBg: isDark ? "#23233a" : "#ffffff",
  subtleBg: isDark ? "#1a1a2e" : "#fafafa",
  hoverBg: isDark ? "rgba(144,202,249,0.08)" : "rgba(25,118,210,0.04)",

  // borders
  border: isDark ? "#35355a" : "#f0f0f0",
  borderLight: isDark ? "#2a2a48" : "#e8e8e8",

  // text
  textPrimary: isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.88)",
  textSecondary: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)",

  // semantic status – light backgrounds
  successBg: isDark ? "rgba(82,196,26,0.1)" : "#f6ffed",
  successBorder: isDark ? "rgba(82,196,26,0.25)" : "#b7eb8f",
  errorBg: isDark ? "rgba(255,77,79,0.1)" : "#fff2f0",
  errorBorder: isDark ? "rgba(255,77,79,0.25)" : "#ffccc7",
  warningBg: isDark ? "rgba(250,173,20,0.1)" : "#fffbe6",
  warningBorder: isDark ? "rgba(250,173,20,0.25)" : "#ffe58f",
  infoBg: isDark ? "rgba(144,202,249,0.08)" : "#e6f4ff",
  infoBorder: isDark ? "rgba(144,202,249,0.2)" : "#91caff",
});
