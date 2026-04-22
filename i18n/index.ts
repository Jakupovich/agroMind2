/**
 * i18n setup for AgroMind.
 *
 * - English is the primary / default language and acts as the fallback for
 *   any missing key.
 * - Bosnian ("bs") is the secondary translation.
 * - The active language is persisted in AsyncStorage and restored on boot.
 * - If the stored preference is absent, the device locale is used only
 *   when it starts with "bs" (Bosnian / Croatian / Serbian speakers all
 *   understand Bosnian); otherwise we default to English.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import bs from "./locales/bs.json";
import en from "./locales/en.json";

export type AppLanguage = "en" | "bs";
export const SUPPORTED_LANGUAGES: AppLanguage[] = ["en", "bs"];
export const LANGUAGE_STORAGE_KEY = "app_language";

const DEFAULT_LANGUAGE: AppLanguage = "en";

function detectDeviceLanguage(): AppLanguage {
  try {
    const locales = Localization.getLocales();
    const first = locales[0];
    const code = (first?.languageCode ?? first?.languageTag ?? "").toLowerCase();
    if (code.startsWith("bs") || code.startsWith("hr") || code.startsWith("sr")) {
      return "bs";
    }
  } catch {
    // expo-localization can throw on unsupported platforms — fall through
  }
  return DEFAULT_LANGUAGE;
}

let initialised = false;

export async function initI18n(): Promise<AppLanguage> {
  let stored: string | null = null;
  try {
    stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    // ignore — fall through to detection
  }
  const initial: AppLanguage =
    stored === "en" || stored === "bs"
      ? stored
      : detectDeviceLanguage();

  if (!initialised) {
    await i18n.use(initReactI18next).init({
      resources: {
        en: { translation: en },
        bs: { translation: bs },
      },
      lng: initial,
      fallbackLng: DEFAULT_LANGUAGE,
      compatibilityJSON: "v4",
      interpolation: { escapeValue: false },
      returnNull: false,
    });
    initialised = true;
  } else if (i18n.language !== initial) {
    await i18n.changeLanguage(initial);
  }
  return initial;
}

export async function setAppLanguage(lang: AppLanguage): Promise<void> {
  if (i18n.language !== lang) {
    await i18n.changeLanguage(lang);
  }
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // ignore — language still changes in-memory
  }
}

export default i18n;
