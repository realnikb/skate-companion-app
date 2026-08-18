import type { CSSProperties } from "react";

import type { TrickCategory } from "@/types/trick";

type StoredPalette = {
  accentColor: string;
  gradientStartColor: string;
  gradientMiddleColor: string;
  gradientEndColor: string;
};

const defaultPalette: StoredPalette = {
  accentColor: "#9B7CFF",
  gradientStartColor: "#6648D6",
  gradientMiddleColor: "#9B7CFF",
  gradientEndColor: "#2A173F",
};

const fallbackPalettes: Record<string, StoredPalette> = {
  riding: {
    accentColor: "#54B8FF",
    gradientStartColor: "#1974D2",
    gradientMiddleColor: "#54B8FF",
    gradientEndColor: "#0B1E36",
  },
  "flip-tricks": {
    accentColor: "#ED5CAB",
    gradientStartColor: "#C32A7F",
    gradientMiddleColor: "#ED5CAB",
    gradientEndColor: "#30112B",
  },
  "dark-tricks": {
    accentColor: "#A870FF",
    gradientStartColor: "#6830B5",
    gradientMiddleColor: "#A870FF",
    gradientEndColor: "#1C0F2F",
  },
  grinds: {
    accentColor: "#FF9F50",
    gradientStartColor: "#CD6720",
    gradientMiddleColor: "#FF9F50",
    gradientEndColor: "#311B0D",
  },
  grabs: {
    accentColor: "#54D88B",
    gradientStartColor: "#20975B",
    gradientMiddleColor: "#54D88B",
    gradientEndColor: "#0C2A1C",
  },
  plants: {
    accentColor: "#C6DF55",
    gradientStartColor: "#7D9A23",
    gradientMiddleColor: "#C6DF55",
    gradientEndColor: "#222B0D",
  },
  "off-board": {
    accentColor: "#FF6F68",
    gradientStartColor: "#CD3E3B",
    gradientMiddleColor: "#FF6F68",
    gradientEndColor: "#331212",
  },
  terminology: {
    accentColor: "#F0C957",
    gradientStartColor: "#B4891D",
    gradientMiddleColor: "#F0C957",
    gradientEndColor: "#2F250C",
  },
  "finger-flips": {
    accentColor: "#C184FF",
    gradientStartColor: "#7540C8",
    gradientMiddleColor: "#C184FF",
    gradientEndColor: "#251038",
  },
};

export type CategoryThemeStyle = CSSProperties & {
  "--category-accent": string;
  "--category-soft": string;
  "--category-gradient": string;
  "--category-card-gradient": string;
};

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return `${Number.parseInt(value.slice(0, 2), 16)}, ${Number.parseInt(value.slice(2, 4), 16)}, ${Number.parseInt(value.slice(4, 6), 16)}`;
}

function rgba(hex: string, alpha: number) {
  return `rgba(${hexToRgb(hex)}, ${alpha})`;
}

export function getCategoryTheme(
  source: string | TrickCategory,
): CategoryThemeStyle {
  const palette =
    typeof source === "string"
      ? (fallbackPalettes[source] ?? defaultPalette)
      : source;
  return {
    "--category-accent": palette.accentColor,
    "--category-soft": `rgba(${hexToRgb(palette.accentColor)}, .16)`,
    "--category-gradient": `linear-gradient(135deg, ${palette.gradientStartColor} 0%, ${palette.gradientMiddleColor} 52%, ${palette.gradientEndColor} 100%)`,
    "--category-card-gradient": `linear-gradient(145deg, ${rgba(palette.gradientStartColor, 0.82)} 0%, ${rgba(palette.gradientMiddleColor, 0.16)} 36%, transparent 55%, ${rgba(palette.gradientEndColor, 0.42)} 100%)`,
  };
}
