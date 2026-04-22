import i18n, {
  AppLanguage,
  SUPPORTED_LANGUAGES,
  setAppLanguage,
} from "@/i18n";
import { useCallback, useEffect, useState } from "react";

/**
 * Tracks the currently active UI language and exposes a setter that persists
 * to AsyncStorage. Re-renders whenever i18next emits a `languageChanged`
 * event so every consumer of the hook stays in sync.
 */
export function useAppLanguage() {
  const [language, setLanguage] = useState<AppLanguage>(
    (SUPPORTED_LANGUAGES.includes(i18n.language as AppLanguage)
      ? (i18n.language as AppLanguage)
      : "en"),
  );

  useEffect(() => {
    const onChanged = (lng: string) => {
      if (SUPPORTED_LANGUAGES.includes(lng as AppLanguage)) {
        setLanguage(lng as AppLanguage);
      }
    };
    i18n.on("languageChanged", onChanged);
    return () => {
      i18n.off("languageChanged", onChanged);
    };
  }, []);

  const change = useCallback(async (lang: AppLanguage) => {
    await setAppLanguage(lang);
  }, []);

  const toggle = useCallback(async () => {
    await setAppLanguage(language === "en" ? "bs" : "en");
  }, [language]);

  return { language, setLanguage: change, toggleLanguage: toggle };
}
