import { useThemeMode } from "../context/ThemeModeContext";

export const useTheme = () => useThemeMode();
export const useAppTheme = () => useThemeMode();
export { ThemeModeProvider } from "../context/ThemeModeContext";
