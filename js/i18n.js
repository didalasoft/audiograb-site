// Simple i18n implementation for DidalaSoft website
class I18n {
    constructor() {
        const savedLang = this.getSavedLanguage();
        const rawBrowserLang = navigator.language || navigator.userLanguage;
        const browserLang = this.getBrowserLanguage();

        this.currentLang = savedLang || browserLang || 'en';
        console.log('Language detected:', rawBrowserLang, '->', browserLang, '| stored:', savedLang, '| applied:', this.currentLang);

        this.translations = {};
        this.init();
    }

    init() {
        this.loadTranslations(this.currentLang);
        this.setupLanguageSelector();
    }

    getBrowserLanguage() {
        const lang = navigator.language || navigator.userLanguage;
        return lang.startsWith('es') ? 'es' : 'en';
    }

    getSavedLanguage() {
        return localStorage.getItem('didalaSoft-language');
    }

    saveLanguage(lang) {
        localStorage.setItem('didalaSoft-language', lang);
        this.currentLang = lang;
    }

    async loadTranslations(lang) {
        try {
            const response = await fetch(`translations/${lang}.json`);
            this.translations = await response.json();
            this.applyTranslations();
            this.updateLanguageSelector();
        } catch (error) {
            console.error('Failed to load translations:', error);
            // Fallback to English if translation file doesn't exist
            if (lang !== 'en') {
                this.loadTranslations('en');
            }
        }
    }

    applyTranslations() {
        // Apply translations to elements with data-i18n attributes
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'placeholder') {
                    element.placeholder = translation;
                } else {
                    element.innerHTML = translation;
                }
            }
        });

        // Apply translations to elements with data-i18n-title attributes
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const translation = this.getTranslation(key);
            if (translation) {
                element.title = translation;
            }
        });
    }

    getTranslation(key) {
        return key.split('.').reduce((obj, k) => obj && obj[k], this.translations);
    }

    changeLanguage(lang) {
        if (lang !== this.currentLang) {
            this.saveLanguage(lang);
            this.loadTranslations(lang);
        }
    }

    setupLanguageSelector() {
        // This will be called after DOM is ready
        const selector = document.getElementById('language-selector');
        if (selector) {
            selector.value = this.currentLang;
            selector.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }
    }

    updateLanguageSelector() {
        const selector = document.getElementById('language-selector');
        if (selector) {
            selector.value = this.currentLang;
        }
    }
}

// Initialize i18n when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18n();
});

// Helper function for getting translations in JavaScript code
function t(key) {
    return window.i18n ? window.i18n.getTranslation(key) : key;
}
