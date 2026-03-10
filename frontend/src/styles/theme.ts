import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1b6b3a",
      dark: "#124625",
      light: "#4b915c"
    },
    secondary: {
      main: "#8c2f1b",
      dark: "#6b2414",
      light: "#b65d2a"
    },
    background: {
      default: "#f8f4ec",
      paper: "#ffffff"
    },
    text: {
      primary: "#1a1a1a",
      secondary: "#5b5a57"
    }
  },
  typography: {
    fontFamily:
      '"Mukta", "Noto Sans Devanagari", "Noto Sans Bengali", "Noto Sans Gurmukhi", "Noto Sans Gujarati", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Sans Oriya", "Noto Sans Tamil", "Noto Sans Telugu", "Noto Naskh Arabic", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: "3.1rem",
      lineHeight: 1.08,
      letterSpacing: 0.2,
      fontFamily:
        '"Prata", "Mukta", "Noto Sans Devanagari", "Noto Sans Bengali", "Noto Sans Gurmukhi", "Noto Sans Gujarati", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Sans Oriya", "Noto Sans Tamil", "Noto Sans Telugu", "Noto Naskh Arabic", serif',
    },
    h2: {
      fontWeight: 700,
      fontSize: "2.5rem",
      lineHeight: 1.12,
      letterSpacing: 0.15,
      fontFamily:
        '"Prata", "Mukta", "Noto Sans Devanagari", "Noto Sans Bengali", "Noto Sans Gurmukhi", "Noto Sans Gujarati", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Sans Oriya", "Noto Sans Tamil", "Noto Sans Telugu", "Noto Naskh Arabic", serif',
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
          borderRadius: 16,
          border: "1px solid #e7ddcc",
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(2px)",
          boxShadow: "0 16px 34px rgba(20, 20, 20, 0.1)"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: "rgba(255, 255, 255, 0.96)"
        }
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: "1px solid #e7ddcc",
          boxShadow: "0 10px 22px rgba(20, 20, 20, 0.06)",
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
            boxShadow: "0 8px 16px rgba(20, 20, 20, 0.14)"
          },
          "&:focus-visible": {
            boxShadow: "0 0 0 2px rgba(27, 107, 58, 0.35)"
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
            boxShadow: "0 8px 16px rgba(20, 20, 20, 0.12)"
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
          background: "#1b5e20"
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
    MuiStack: {
      defaultProps: {
        useFlexGap: true
      }
    }
  }
});

export default theme;
