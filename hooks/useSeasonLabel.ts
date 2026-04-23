import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/**
 * Human label for the current meteorological season + year (Northern Hemisphere).
 * Example: "Spring 2026", "Proljeće 2026".
 */
export function useSeasonLabel(): string {
  const { t } = useTranslation();
  return useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const seasonKey =
      m >= 2 && m <= 4
        ? "season.spring"
        : m >= 5 && m <= 7
          ? "season.summer"
          : m >= 8 && m <= 10
            ? "season.autumn"
            : "season.winter";
    // For winter spanning Dec–Feb, attach the year where January falls.
    const year = m === 11 ? y + 1 : y;
    return `${t(seasonKey)} ${year}`;
  }, [t]);
}
