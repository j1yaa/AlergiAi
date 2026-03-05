import { I18n } from 'i18n-js';
import en from './en';
import es from './es';

const i18n = new I18n({ en, es });

i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.enableFallback = true;

export default i18n;
