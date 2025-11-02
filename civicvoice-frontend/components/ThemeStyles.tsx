import { designTokens } from "@/design/design-tokens";

const toCssVariables = () => {
  const { palette, layout, typography, density, motion } = designTokens;

  const lightVariables = {
    "--cv-color-surface": palette.light.surface,
    "--cv-color-surface-raised": palette.light.surfaceRaised,
    "--cv-color-surface-sunken": palette.light.surfaceSunken,
    "--cv-color-border": palette.light.border,
    "--cv-color-text": palette.light.textPrimary,
    "--cv-color-text-secondary": palette.light.textSecondary,
    "--cv-color-text-muted": palette.light.textMuted,
    "--cv-color-primary": palette.light.primary,
    "--cv-color-primary-muted": palette.light.primaryMuted,
    "--cv-color-primary-strong": palette.light.primaryStrong,
    "--cv-color-accent": palette.light.accent,
    "--cv-color-accent-strong": palette.light.accentStrong,
    "--cv-color-success": palette.light.success,
    "--cv-color-warning": palette.light.warning,
    "--cv-color-danger": palette.light.danger,
    "--cv-color-chart-positive": palette.light.chartPositive,
    "--cv-color-chart-negative": palette.light.chartNegative,
    "--cv-color-chart-baseline": palette.light.chartBaseline,
  } satisfies Record<string, string>;

  const darkVariables = {
    "--cv-color-surface": palette.dark.surface,
    "--cv-color-surface-raised": palette.dark.surfaceRaised,
    "--cv-color-surface-sunken": palette.dark.surfaceSunken,
    "--cv-color-border": palette.dark.border,
    "--cv-color-text": palette.dark.textPrimary,
    "--cv-color-text-secondary": palette.dark.textSecondary,
    "--cv-color-text-muted": palette.dark.textMuted,
    "--cv-color-primary": palette.dark.primary,
    "--cv-color-primary-muted": palette.dark.primaryMuted,
    "--cv-color-primary-strong": palette.dark.primaryStrong,
    "--cv-color-accent": palette.dark.accent,
    "--cv-color-accent-strong": palette.dark.accentStrong,
    "--cv-color-success": palette.dark.success,
    "--cv-color-warning": palette.dark.warning,
    "--cv-color-danger": palette.dark.danger,
    "--cv-color-chart-positive": palette.dark.chartPositive,
    "--cv-color-chart-negative": palette.dark.chartNegative,
    "--cv-color-chart-baseline": palette.dark.chartBaseline,
  } satisfies Record<string, string>;

  const spacingEntries = layout.spacing.map((value, index) => [`--cv-space-${index}`, `${value}px`] as const);

  const cssParts = [
    `:root{
      --cv-font-sans:var(--cv-font-sans-family, ${typography.body});
      --cv-font-heading:var(--cv-font-sans-family, ${typography.heading});
      --cv-font-mono:var(--cv-font-mono-family, ${typography.mono});
      --cv-line-height-tight:${typography.lineHeightTight};
      --cv-line-height-cozy:${typography.lineHeightCozy};
      --cv-radius-sm:${layout.radii.sm};
      --cv-radius-md:${layout.radii.md};
      --cv-radius-lg:${layout.radii.lg};
      --cv-shadow-focus:${layout.shadow.focus};
      --cv-shadow-raised:${layout.shadow.raised};
      --cv-density-compact:${density.compact}px;
      --cv-density-comfortable:${density.comfortable}px;
      --cv-motion-duration-short:${motion.durationShort};
      --cv-motion-duration-medium:${motion.durationMedium};
      --cv-motion-easing-standard:${motion.easings.standard};
      --cv-motion-easing-emphasized:${motion.easings.emphasized};
      --cv-breakpoint-sm:${layout.breakpoints.sm}px;
      --cv-breakpoint-md:${layout.breakpoints.md}px;
      --cv-breakpoint-lg:${layout.breakpoints.lg}px;
      ${Object.entries(lightVariables)
        .map(([key, value]) => `${key}:${value};`)
        .join("")}
      ${spacingEntries.map(([key, value]) => `${key}:${value};`).join("")}
    }`,
    `@media (prefers-color-scheme: dark){
      :root{
        ${Object.entries(darkVariables)
          .map(([key, value]) => `${key}:${value};`)
          .join("")}
      }
    }`,
  ];

  return cssParts.join("\n");
};

export function ThemeStyles() {
  const css = toCssVariables();
  return <style id="civicvoice-theme" dangerouslySetInnerHTML={{ __html: css }} />;
}

