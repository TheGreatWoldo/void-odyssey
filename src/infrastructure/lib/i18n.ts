import i18next from 'i18next'

export async function initI18n(): Promise<void> {
  if (i18next.isInitialized) return

  await i18next.init({
    lng: navigator.language,
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {},
      },
    },
    interpolation: {
      escapeValue: false,
    },
  })
}

export { i18next as i18n }

