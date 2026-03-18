import { createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";

const bodyFontFamily =
  'var(--app-body-font), "Mukta", "Noto Sans Devanagari", "Noto Sans Bengali", "Noto Sans Gurmukhi", "Noto Sans Gujarati", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Sans Oriya", "Noto Sans Tamil", "Noto Sans Telugu", "Noto Naskh Arabic", sans-serif';
const headingFontFamily =
  'var(--app-heading-font), var(--app-body-font), "Mukta", "Noto Sans Devanagari", "Noto Sans Bengali", "Noto Sans Gurmukhi", "Noto Sans Gujarati", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Sans Oriya", "Noto Sans Tamil", "Noto Sans Telugu", "Noto Naskh Arabic", serif';

export const createAppTheme = (mode: PaletteMode) => {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: isDark
        ? {
            main: "#5fd18b",
            dark: "#3ca864",
            light: "#7ee4a3"
          }
        : {
            main: "#1b6b3a",
            dark: "#124625",
            light: "#4b915c"
          },
      secondary: isDark
        ? {
            main: "#f08a5b",
            dark: "#d96b3a",
            light: "#f6a175"
          }
        : {
            main: "#8c2f1b",
            dark: "#6b2414",
            light: "#b65d2a"
          },
      background: isDark
        ? {
            default: "#0f2d1e",
            paper: "#143f2b"
          }
        : {
            default: "#f6fbf7",
            paper: "#ffffff"
          },
      text: isDark
        ? {
            primary: "#ffffff",
            secondary: "#d4e3d8"
          }
        : {
            primary: "#1a2e22",
            secondary: "#4e6257"
          },
      divider: isDark ? "rgba(255,255,255,0.12)" : "rgba(21, 86, 45, 0.16)"
    },
    typography: {
      fontFamily: bodyFontFamily,
      h1: {
        fontWeight: 700,
        fontSize: "3.1rem",
        lineHeight: 1.08,
        letterSpacing: 0.2,
        fontFamily: headingFontFamily
      },
      h2: {
        fontWeight: 700,
        fontSize: "2.5rem",
        lineHeight: 1.12,
        letterSpacing: 0.15,
        fontFamily: headingFontFamily
      },
      h3: { fontWeight: 700, fontSize: "1.85rem", lineHeight: 1.2 },
      h4: { fontWeight: 700, fontSize: "1.48rem", lineHeight: 1.25 },
      h5: { fontWeight: 700, fontSize: "1.22rem", lineHeight: 1.3 },
      subtitle1: { fontWeight: 600, fontSize: "1.04rem", lineHeight: 1.4 },
      subtitle2: { fontWeight: 600, fontSize: "0.96rem", lineHeight: 1.4 },
      body1: { fontSize: "1.04rem", lineHeight: 1.65 },
      body2: { fontSize: "0.98rem", lineHeight: 1.6 },
      button: { fontWeight: 600, letterSpacing: 0.2 }
    },
    shape: {
      borderRadius: 12
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(21, 86, 45, 0.16)",
            background: isDark
              ? "linear-gradient(140deg, rgba(20, 63, 43, 0.98) 0%, rgba(17, 52, 36, 0.98) 100%)"
              : "linear-gradient(140deg, rgba(255, 255, 255, 0.98) 0%, rgba(244, 249, 244, 0.98) 100%)",
            backdropFilter: "blur(2px)",
            boxShadow: isDark ? "0 18px 30px rgba(0, 0, 0, 0.45)" : "0 18px 30px rgba(16, 66, 35, 0.12)",
            position: "relative",
            transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
            "&:hover": {
              transform: "translateY(-3px)",
              boxShadow: isDark ? "0 22px 36px rgba(0, 0, 0, 0.6)" : "0 22px 36px rgba(16, 66, 35, 0.2)",
              borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(21, 86, 45, 0.28)"
            },
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: isDark
                ? "radial-gradient(circle at 12% 0%, rgba(95, 209, 139, 0.12), transparent 55%)"
                : "radial-gradient(circle at 12% 0%, rgba(27, 107, 58, 0.08), transparent 55%)"
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundColor: isDark ? "rgba(20, 63, 43, 0.96)" : "rgba(255, 255, 255, 0.96)"
          }
        }
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e7ddcc",
            boxShadow: isDark ? "0 10px 22px rgba(0, 0, 0, 0.35)" : "0 10px 22px rgba(20, 20, 20, 0.06)",
            "&:before": {
              display: "none"
            }
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 10,
            letterSpacing: 0.1,
            transition: "box-shadow 0.2s ease, transform 0.2s ease, filter 0.2s ease",
            "&:hover": {
              transform: "translateY(-1px)",
              filter: "saturate(1.05)",
              boxShadow: isDark ? "0 8px 16px rgba(0, 0, 0, 0.35)" : "0 8px 16px rgba(20, 20, 20, 0.14)"
            },
            "&:focus-visible": {
              boxShadow: isDark ? "0 0 0 2px rgba(95, 209, 139, 0.45)" : "0 0 0 2px rgba(27, 107, 58, 0.35)"
            },
            "&.Mui-disabled": {
              transform: "none",
              filter: "none",
              boxShadow: "none"
            }
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: "box-shadow 0.2s ease, transform 0.2s ease, filter 0.2s ease",
            "&:hover": {
              transform: "translateY(-1px)",
              filter: "saturate(1.05)",
              boxShadow: isDark ? "0 8px 16px rgba(0, 0, 0, 0.3)" : "0 8px 16px rgba(20, 20, 20, 0.12)"
            },
            "&.Mui-disabled": {
              transform: "none",
              filter: "none",
              boxShadow: "none"
            }
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isDark ? "#123520" : "#1b5e20"
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8
          }
        }
      },
      MuiTextField: {
        defaultProps: {
          size: "small"
        }
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            width: "min(100%, var(--app-shell-width))",
            maxWidth: "var(--app-shell-width) !important",
            marginInline: "auto",
            paddingLeft: "var(--app-shell-inline-pad) !important",
            paddingRight: "var(--app-shell-inline-pad) !important"
          }
        }
      },
      MuiStack: {
        defaultProps: {
          useFlexGap: true
        }
      }
    }
  });
};

export default createAppTheme("light");
