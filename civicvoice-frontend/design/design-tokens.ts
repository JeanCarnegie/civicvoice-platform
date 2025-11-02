export type DensityScale = "compact" | "comfortable";

type PaletteVariant = {
  surface: string;
  surfaceRaised: string;
  surfaceSunken: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryMuted: string;
  primaryStrong: string;
  accent: string;
  accentStrong: string;
  success: string;
  warning: string;
  danger: string;
  chartPositive: string;
  chartNegative: string;
  chartBaseline: string;
};

type MotionTokens = {
  durationShort: string;
  durationMedium: string;
  easings: {
    standard: string;
    emphasized: string;
  };
};

type TypographyTokens = {
  heading: string;
  body: string;
  mono: string;
  lineHeightTight: number;
  lineHeightCozy: number;
};

type LayoutTokens = {
  radii: {
    sm: string;
    md: string;
    lg: string;
  };
  shadow: {
    focus: string;
    raised: string;
  };
  breakpoints: {
    sm: number;
    md: number;
    lg: number;
  };
  spacing: number[];
};

type DensityTokens = Record<DensityScale, number>;

export type DesignTokens = {
  seed: string;
  palette: {
    light: PaletteVariant;
    dark: PaletteVariant;
  };
  typography: TypographyTokens;
  layout: LayoutTokens;
  density: DensityTokens;
  motion: MotionTokens;
};

export const designTokens: DesignTokens = {
  seed: "13b53dfc2b19077c87217553bc67f6e6e525618a8fe043551bc35755ea96e13d",
  palette: {
    light: {
      surface: "#F4FBFD",
      surfaceRaised: "#FFFFFF",
      surfaceSunken: "#E4F0F4",
      border: "#C7DDE3",
      textPrimary: "#0C1F25",
      textSecondary: "#2F4C55",
      textMuted: "#53737C",
      primary: "#146C7E",
      primaryMuted: "#4D9EB0",
      primaryStrong: "#0C4956",
      accent: "#F2A541",
      accentStrong: "#C17F1D",
      success: "#2E9A6F",
      warning: "#FFB347",
      danger: "#D05C60",
      chartPositive: "#146C7E",
      chartNegative: "#5C3D99",
      chartBaseline: "#94BAC4",
    },
    dark: {
      surface: "#07171C",
      surfaceRaised: "#10262C",
      surfaceSunken: "#041014",
      border: "#1F3C45",
      textPrimary: "#E6F4F7",
      textSecondary: "#B3D7DF",
      textMuted: "#7EA0A9",
      primary: "#3DAAC0",
      primaryMuted: "#2A7D8E",
      primaryStrong: "#6ED5E7",
      accent: "#F2A541",
      accentStrong: "#FFCB6B",
      success: "#58CFA1",
      warning: "#FFBE63",
      danger: "#F28488",
      chartPositive: "#6ED5E7",
      chartNegative: "#BB9BF3",
      chartBaseline: "#345F69",
    },
  },
  typography: {
    heading: "'Inter', 'Helvetica Neue', system-ui, -apple-system, sans-serif",
    body: "'Inter', 'Helvetica Neue', system-ui, -apple-system, sans-serif",
    mono: "'Source Code Pro', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace",
    lineHeightTight: 1.2,
    lineHeightCozy: 1.5,
  },
  layout: {
    radii: {
      sm: "8px",
      md: "12px",
      lg: "20px",
    },
    shadow: {
      focus: "0 0 0 3px rgba(20, 108, 126, 0.35)",
      raised: "0 16px 40px rgba(12, 31, 37, 0.15)",
    },
    breakpoints: {
      sm: 600,
      md: 1024,
      lg: 1440,
    },
    spacing: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
  },
  density: {
    compact: 8,
    comfortable: 12,
  },
  motion: {
    durationShort: "120ms",
    durationMedium: "220ms",
    easings: {
      standard: "cubic-bezier(0.2, 0.0, 0.2, 1)",
      emphasized: "cubic-bezier(0.32, 0.72, 0, 1)",
    },
  },
};

export const civicCategories = [
  { id: 0, label: "Transportation" },
  { id: 1, label: "Utilities" },
  { id: 2, label: "Safety" },
  { id: 3, label: "Sanitation" },
  { id: 4, label: "Custom" },
] as const;

export type CivicCategory = (typeof civicCategories)[number];


