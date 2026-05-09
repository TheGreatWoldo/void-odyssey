import i18next from 'i18next'
import en from './locales/en.json'

export async function initI18n(): Promise<void> {
  if (i18next.isInitialized) return

  await i18next.init({
    lng: navigator.language,
    fallbackLng: 'en',
    resources: {
      en: {
        translation: en,
      },
    },
    interpolation: {
      escapeValue: false,
    },
  })
}

/** Translate a key. Use this instead of importing the raw i18next instance. */
export const t = i18next.t.bind(i18next)

