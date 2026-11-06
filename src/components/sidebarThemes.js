// Sidebar themes. "Classic" is the original look. Every other theme is a palette with BOTH a light and
// a dark version, and the light/dark switch picks between them — so each theme works in both modes.
// The colours are applied through CSS variables on the sidebar, which keeps the Tailwind classes in
// Sidebar.jsx the same whichever theme is chosen.
//
// Variables: --sb-bg (background / gradient), --sb-fg (text), --sb-strong (brand text),
// --sb-muted (icons, small text), --sb-border, --sb-hover, --sb-active-bg (the current page),
// --sb-active-fg, --sb-accent (the marker beside the current page), --sb-logo-bg, --sb-btn,
// --sb-btn-hover, --sb-shadow, --sb-flyout (the pop-out shown beside a collapsed sidebar).

// A deep, rich version of a colour: white text on a dark gradient, a bright marker
const dark = ({ bg, fg, accent, shadow, activeTint, flyout }) => ({
  "--sb-bg": bg,
  "--sb-fg": fg,
  "--sb-strong": "#ffffff",
  "--sb-muted": "rgba(255,255,255,0.70)",
  "--sb-border": "rgba(255,255,255,0.12)",
  "--sb-hover": "rgba(255,255,255,0.09)",
  "--sb-active-bg": `linear-gradient(90deg,${activeTint},rgba(255,255,255,0.10))`,
  "--sb-active-fg": "#ffffff",
  "--sb-accent": accent,
  "--sb-logo-bg": "rgba(255,255,255,0.13)",
  "--sb-btn": "rgba(255,255,255,0.07)",
  "--sb-btn-hover": "rgba(255,255,255,0.15)",
  "--sb-shadow": shadow,
  "--sb-flyout": flyout,
});

// A soft, pale tint of the same colour: dark text, and a deep solid pill for the current page
const light = ({ bg, fg, strong, muted, ink, pill, accent, logo }) => ({
  "--sb-bg": bg,
  "--sb-fg": fg,
  "--sb-strong": strong,
  "--sb-muted": muted,
  "--sb-border": `rgba(${ink},0.18)`,
  "--sb-hover": `rgba(${ink},0.09)`,
  "--sb-active-bg": pill,
  "--sb-active-fg": "#ffffff",
  "--sb-accent": accent,
  "--sb-logo-bg": logo,
  "--sb-btn": `rgba(${ink},0.07)`,
  "--sb-btn-hover": `rgba(${ink},0.15)`,
  "--sb-shadow": `rgba(${ink},0.22)`,
  "--sb-flyout": "#ffffff",
});

export const SIDEBAR_THEMES = [
  {
    key: "classic",
    name: "Classic",
    nameAr: "كلاسيكي",
    swatches: {
      dark: "linear-gradient(135deg,#1e293b 0%,#475569 100%)",
      light: "linear-gradient(135deg,#f8fafc 0%,#cbd5e1 45%,#e2e8f0 100%)",
    },
  },
  {
    // the brand red #74030c: dark = lit wine fading to near-black with a gold marker;
    // light = a blush tint with #74030c as the current-page pill
    key: "crimson",
    name: "Crimson Royal",
    nameAr: "قرمزي ملكي",
    modes: {
      dark: {
        swatch: "linear-gradient(160deg,#9a1220 0%,#74030c 45%,#3f0108 100%)",
        vars: dark({
          bg: "linear-gradient(160deg,#9a1220 0%,#74030c 42%,#3f0108 100%)",
          fg: "#fbe9ea",
          accent: "#f2c879",
          shadow: "rgba(116,3,12,0.45)",
          activeTint: "rgba(242,200,121,0.30)",
          flyout: "#4a0509",
        }),
      },
      light: {
        swatch: "linear-gradient(160deg,#fff7f7 0%,#fbe3e4 50%,#e9a9ad 100%)",
        vars: light({
          bg: "linear-gradient(160deg,#fff7f7 0%,#fbe3e4 50%,#f2c4c7 100%)",
          fg: "#5c0610",
          strong: "#3d0107",
          muted: "#94393f",
          ink: "116,3,12",
          pill: "linear-gradient(90deg,#74030c,#9a1220)",
          accent: "#e0a53c",
          logo: "#74030c",
        }),
      },
    },
  },
  {
    key: "ocean",
    name: "Midnight Ocean",
    nameAr: "محيط منتصف الليل",
    modes: {
      dark: {
        swatch: "linear-gradient(160deg,#17408b 0%,#0f2d63 45%,#07162f 100%)",
        vars: dark({
          bg: "linear-gradient(160deg,#17408b 0%,#0f2d63 45%,#07162f 100%)",
          fg: "#e6f0ff",
          accent: "#5cc8ff",
          shadow: "rgba(15,45,99,0.45)",
          activeTint: "rgba(92,200,255,0.30)",
          flyout: "#0c2350",
        }),
      },
      light: {
        swatch: "linear-gradient(160deg,#f5faff 0%,#dbeafe 50%,#9fc3f5 100%)",
        vars: light({
          bg: "linear-gradient(160deg,#f5faff 0%,#dbeafe 50%,#bcd6fb 100%)",
          fg: "#12315c",
          strong: "#0a1f40",
          muted: "#4a6a99",
          ink: "23,64,139",
          pill: "linear-gradient(90deg,#17408b,#0f2d63)",
          accent: "#38b6ff",
          logo: "#0f2d63",
        }),
      },
    },
  },
  {
    key: "emerald",
    name: "Emerald Forest",
    nameAr: "الغابة الزمردية",
    modes: {
      dark: {
        swatch: "linear-gradient(160deg,#0f6b5c 0%,#08463c 45%,#04201c 100%)",
        vars: dark({
          bg: "linear-gradient(160deg,#0f6b5c 0%,#08463c 45%,#04201c 100%)",
          fg: "#e4faf3",
          accent: "#6ee7b7",
          shadow: "rgba(8,70,60,0.45)",
          activeTint: "rgba(110,231,183,0.28)",
          flyout: "#06342d",
        }),
      },
      light: {
        swatch: "linear-gradient(160deg,#f2fdf8 0%,#d3f5e6 50%,#8fdcbc 100%)",
        vars: light({
          bg: "linear-gradient(160deg,#f2fdf8 0%,#d3f5e6 50%,#a8e6cf 100%)",
          fg: "#064e3b",
          strong: "#022c22",
          muted: "#3f7a68",
          ink: "15,107,92",
          pill: "linear-gradient(90deg,#0f6b5c,#08463c)",
          accent: "#34d399",
          logo: "#08463c",
        }),
      },
    },
  },
  {
    key: "violet",
    name: "Royal Violet",
    nameAr: "بنفسجي ملكي",
    modes: {
      dark: {
        swatch: "linear-gradient(160deg,#5b2db0 0%,#3a1a7a 45%,#190a3d 100%)",
        vars: dark({
          bg: "linear-gradient(160deg,#5b2db0 0%,#3a1a7a 45%,#190a3d 100%)",
          fg: "#efe9ff",
          accent: "#d0b3ff",
          shadow: "rgba(58,26,122,0.45)",
          activeTint: "rgba(208,179,255,0.30)",
          flyout: "#2a1259",
        }),
      },
      light: {
        swatch: "linear-gradient(160deg,#faf7ff 0%,#eadfff 50%,#c9b0f7 100%)",
        vars: light({
          bg: "linear-gradient(160deg,#faf7ff 0%,#eadfff 50%,#d4bff9 100%)",
          fg: "#3a1a7a",
          strong: "#21094f",
          muted: "#7a5cb5",
          ink: "91,45,176",
          pill: "linear-gradient(90deg,#5b2db0,#3a1a7a)",
          accent: "#b794f6",
          logo: "#3a1a7a",
        }),
      },
    },
  },
  {
    // warm parchment (light) / dark espresso (dark), bronze and amber
    key: "sand",
    name: "Desert Sand",
    nameAr: "رمال الصحراء",
    modes: {
      dark: {
        swatch: "linear-gradient(160deg,#5a4020 0%,#3a2a14 48%,#1c1307 100%)",
        vars: dark({
          bg: "linear-gradient(160deg,#5a4020 0%,#3a2a14 48%,#1c1307 100%)",
          fg: "#f6e9d0",
          accent: "#e0a53c",
          shadow: "rgba(58,42,20,0.5)",
          activeTint: "rgba(224,165,60,0.34)",
          flyout: "#2e2110",
        }),
      },
      light: {
        swatch: "linear-gradient(160deg,#fffaf0 0%,#f2e3c8 50%,#d9bf93 100%)",
        vars: light({
          bg: "linear-gradient(160deg,#fffaf0 0%,#f6ead6 48%,#ead7b7 100%)",
          fg: "#4a3416",
          strong: "#2e1f0a",
          muted: "#7a5c33",
          ink: "120,80,20",
          pill: "linear-gradient(90deg,#5e3b12,#8a5a1c)",
          accent: "#b9770e",
          logo: "#4a3416",
        }),
      },
    },
  },
];

const STORAGE_KEY = "sidebarTheme";
const KEYS = new Set(SIDEBAR_THEMES.map((t) => t.key));

export const readSidebarTheme = () => {
  try {
    const k = localStorage.getItem(STORAGE_KEY);
    return KEYS.has(k) ? k : "classic";
  } catch {
    return "classic";
  }
};

export const saveSidebarTheme = (key) => {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // storage unavailable — the choice just isn't remembered
  }
};

/** The swatch to show for a theme in the picker, in the current light / dark mode. */
export const themeSwatch = (theme, isDarkMode) =>
  theme.swatches ? theme.swatches[isDarkMode ? "dark" : "light"] : theme.modes[isDarkMode ? "dark" : "light"].swatch;

// Original look, kept exactly as it was (light and dark variants)
const CLASSIC_LIGHT = "bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-800 border border-slate-300/60 shadow-xl shadow-slate-200/60";
const CLASSIC_DARK = "bg-gradient-to-br from-slate-800 to-gray-600 text-gray-200 border border-white/5 shadow-2xl";

/**
 * The class names (and CSS variables) the sidebar is drawn with, for the chosen theme in the
 * current light / dark mode. Classic reproduces the original two looks; the others read their
 * colours from CSS variables.
 */
export function sidebarUi(themeKey, isDarkMode) {
  const theme = SIDEBAR_THEMES.find((t) => t.key === themeKey);

  if (!theme || !theme.modes) {
    return {
      themed: false,
      style: undefined,
      shell: isDarkMode ? CLASSIC_DARK : CLASSIC_LIGHT,
      text: isDarkMode ? "text-gray-200" : "text-slate-800",
      activeItem: isDarkMode ? "bg-white/10 text-white" : "bg-slate-800 text-white shadow-lg shadow-slate-400/30 scale-[1.01]",
      idleItem: isDarkMode ? "hover:bg-white/5" : "hover:bg-slate-200/70 hover:scale-[1.01]",
      groupHover: isDarkMode ? "hover:bg-white/5" : "hover:bg-slate-200/70 hover:scale-[1.01]",
      indicator: isDarkMode ? "bg-blue-400" : "bg-slate-500",
      dot: isDarkMode ? "bg-blue-400" : "bg-slate-800",
      iconActive: "text-white",
      iconIdle: isDarkMode ? "text-gray-300" : "text-slate-600",
      divider: isDarkMode ? "border-white/10" : "border-slate-300",
      logoTile: isDarkMode ? "bg-white/10" : "bg-slate-800",
      darkLogo: isDarkMode,
      brand: isDarkMode ? "text-white" : "text-slate-800",
      tagline: isDarkMode ? "text-gray-400" : "text-slate-500",
      btn: isDarkMode
        ? "border-white/10 bg-white/5 hover:bg-white/10"
        : "border-slate-300 bg-slate-200 hover:bg-slate-300 hover:scale-105 active:scale-95",
      closeBtn: isDarkMode ? "bg-white/10 hover:bg-white/20" : "bg-slate-200 hover:bg-slate-300",
      moon: "text-slate-700",
      flyout: isDarkMode ? "bg-slate-800 text-gray-200 ring-white/10" : "bg-white text-slate-700 ring-slate-200",
      handle: isDarkMode ? "bg-slate-600 text-white ring-white/20 hover:bg-slate-500" : "bg-slate-800 text-white ring-slate-500 hover:bg-slate-700",
    };
  }

  const mode = theme.modes[isDarkMode ? "dark" : "light"];
  return {
    themed: true,
    style: mode.vars,
    shell: "[background:var(--sb-bg)] text-[var(--sb-fg)] border border-[var(--sb-border)] shadow-2xl shadow-[var(--sb-shadow)]",
    text: "text-[var(--sb-fg)]",
    activeItem: "[background:var(--sb-active-bg)] text-[var(--sb-active-fg)] shadow-lg shadow-black/10 scale-[1.01]",
    idleItem: "hover:bg-[var(--sb-hover)] hover:scale-[1.01]",
    groupHover: "hover:bg-[var(--sb-hover)] hover:scale-[1.01]",
    indicator: "bg-[var(--sb-accent)]",
    dot: "bg-[var(--sb-accent)]",
    iconActive: "text-[var(--sb-active-fg)]",
    iconIdle: "text-[var(--sb-muted)]",
    divider: "border-[var(--sb-border)]",
    logoTile: "bg-[var(--sb-logo-bg)]",
    // dark mode shows the dark-mode logo on a translucent tile; light mode the light logo on a deep tile
    darkLogo: !!isDarkMode,
    brand: "text-[var(--sb-strong)]",
    tagline: "text-[var(--sb-muted)]",
    btn: "border-[var(--sb-border)] bg-[var(--sb-btn)] hover:bg-[var(--sb-btn-hover)] hover:scale-105 active:scale-95",
    closeBtn: "bg-[var(--sb-btn)] hover:bg-[var(--sb-btn-hover)]",
    moon: "text-[var(--sb-fg)]",
    flyout: "[background:var(--sb-flyout)] text-[var(--sb-fg)] ring-[var(--sb-border)]",
    handle: "bg-[var(--sb-accent)] text-slate-900 ring-white/70 hover:brightness-110",
  };
}
