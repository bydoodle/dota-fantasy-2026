import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import en from './locales/en/translation.json'
import ua from './locales/ua/translation.json'
import cn from './locales/cn/translation.json'
import es from './locales/es/translation.json'
import pt from './locales/pt/translation.json'
import vn from './locales/vn/translation.json'
import pl from './locales/pl/translation.json'
import de from './locales/de/translation.json'

i18next.use(initReactI18next).init({
    resources: {
        en: {translation: en},
        ua: {translation: ua},
        cn: {translation: cn},
        es: {translation: es},
        pt: {translation: pt},
        vn: {translation: vn},
        de: {translation: de},
        pl: {translation: pl}
    },
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false
    }
})

export default i18next;