// Simple i18n implementation for DidalaSoft website
class I18n {
    constructor() {
        const urlLang = this.getLanguageFromUrl();
        const savedLang = this.getSavedLanguage();
        const rawBrowserLang = navigator.language || navigator.userLanguage;
        const browserLang = this.getBrowserLanguage();

        this.currentLang = urlLang || savedLang || browserLang || 'en';
        console.log('Language detected - URL:', urlLang, '| stored:', savedLang, '| browser:', rawBrowserLang, '->', browserLang, '| applied:', this.currentLang);

        this.translations = {};
        this.init();
    }

    init() {
        this.loadTranslations(this.currentLang);
        this.setupLanguageSelector();
        this.setupDynamicMetaTags();
        this.updateInternalLinks();
        this.setupHrefLang();
    }

    getBrowserLanguage() {
        try {
            const lang = (navigator.language || navigator.userLanguage || '').toLowerCase();
            return lang.startsWith('es') ? 'es' : 'en';
        } catch (error) {
            console.warn('Could not detect browser language:', error);
            return 'en';
        }
    }

    getLanguageFromUrl() {
        try {
            const path = window.location.pathname;
            const pathSegments = path.split('/').filter(segment => segment.length > 0);

            // Find language segment anywhere in the path
            const langIdx = pathSegments.findIndex(s => s.toLowerCase() === 'en' || s.toLowerCase() === 'es');
            if (langIdx !== -1) {
                return pathSegments[langIdx].toLowerCase();
            }

            return null;
        } catch (error) {
            console.warn('Could not parse URL for language:', error);
            return null;
        }
    }

    getSavedLanguage() {
        try {
            return localStorage.getItem('didalaSoft-language');
        } catch (error) {
            console.warn('Could not access localStorage:', error);
            return null;
        }
    }

    saveLanguage(lang) {
        try {
            localStorage.setItem('didalaSoft-language', lang);
            this.currentLang = lang;
        } catch (error) {
            console.warn('Could not save language to localStorage:', error);
        }
    }

    async loadTranslations(lang) {
        try {
            const response = await fetch(`translations/${lang}.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            this.translations = await response.json();
            this.applyTranslations();
            this.updateLanguageSelector();
            this.setupDynamicMetaTags();
            this.updateInternalLinks();
            this.setupHrefLang();
        } catch (error) {
            console.error('Failed to load translations for', lang, ':', error);
            // Fallback to English if translation file doesn't exist or fetch fails
            if (lang !== 'en') {
                console.log('Falling back to English translations');
                this.loadTranslations('en');
            } else {
                console.error('Could not load English translations. Using fallback text.');
                // Set minimal fallback translations
                this.translations = {
                    'nav.home': 'Home',
                    'nav.audiograb': 'AudioGrab',
                    'nav.privacy': 'Privacy'
                };
                this.applyTranslations();
                this.setupDynamicMetaTags();
                this.updateInternalLinks();
                this.setupHrefLang();
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
                } else if (element.tagName === 'TITLE') {
                    element.textContent = translation;
                } else if (element.tagName === 'META') {
                    element.setAttribute('content', translation);
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

    setupHrefLang() {
        // Inject rel="alternate" hreflang links for SEO
        try {
            const origin = 'https://didalasoft.github.io/audiograb-site';
            const path = window.location.pathname.replace(/^\/+/, '');
            const segs = path.split('/').filter(Boolean);
            const langIdx = segs.findIndex(s => s === 'en' || s === 'es');
            const pageSegs = segs.slice();
            if (langIdx !== -1) pageSegs.splice(langIdx, 1);
            const pagePath = pageSegs.join('/') || 'index.html';

            // Remove existing alternates to avoid duplicates
            Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).forEach(n => n.parentNode.removeChild(n));

            const links = [
                { hreflang: 'en', href: `${origin}/en/${pagePath}` },
                { hreflang: 'es', href: `${origin}/es/${pagePath}` },
                { hreflang: 'x-default', href: `${origin}/en/${pagePath}` }
            ];
            links.forEach(({ hreflang, href }) => {
                const el = document.createElement('link');
                el.rel = 'alternate';
                el.hreflang = hreflang;
                el.href = href;
                document.head.appendChild(el);
            });
        } catch (e) {
            console.warn('Could not setup hreflang alternates:', e);
        }
    }

    updateInternalLinks() {
        // Ensure internal links keep the current language without using absolute paths
        try {
            const lang = this.currentLang || this.getLanguageFromUrl() || 'en';
            const files = ['index.html', 'audiograb.html', 'privacy.html'];
            const selector = files.map(f => `a[href="${f}"]`).join(', ');
            const links = document.querySelectorAll(selector);

            const path = window.location.pathname;
            const segments = path.split('/').filter(s => s.length > 0);
            const hasLang = segments.includes('en') || segments.includes('es');

            links.forEach(link => {
                const href = link.getAttribute('href');
                if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('/')) return;
                if (hasLang) return; // already inside /{lang}/
                const clean = href.replace(/^\/+/, '');
                // Use relative path from root pages so GitHub Pages subpath is preserved
                link.setAttribute('href', lang + '/' + clean);
            });
        } catch (error) {
            console.warn('Could not update internal links:', error);
        }
    }

    getTranslation(key) {
        return key.split('.').reduce((obj, k) => obj && obj[k], this.translations);
    }

    changeLanguage(lang) {
        if (lang !== this.currentLang) {
            this.saveLanguage(lang);
            this.loadTranslations(lang);

            // Navigate to the appropriate language path
            this.navigateToLanguage(lang);
        }
    }

    navigateToLanguage(lang) {
        try {
            const currentPath = window.location.pathname;
            const segments = currentPath.split('/').filter(segment => segment.length > 0);

            // Replace existing language segment anywhere in the path, else insert after repo folder if present
            const langIdx = segments.findIndex(s => s === 'en' || s === 'es');
            if (langIdx !== -1) {
                segments[langIdx] = lang;
            } else {
                const repoIdx = segments.indexOf('audiograb-site');
                const insertAt = repoIdx !== -1 ? repoIdx + 1 : 0;
                segments.splice(insertAt, 0, lang);
            }

            const newPath = '/' + segments.join('/') + (window.location.search || '') + (window.location.hash || '');
            window.location.href = newPath;
        } catch (error) {
            console.warn('Could not navigate to language path:', error);
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

    setupDynamicMetaTags() {
        // Dynamically update meta tags based on current URL and language
        try {
            const currentPath = window.location.pathname;
            const baseUrl = 'https://didalasoft.github.io/audiograb-site';
            const fullUrl = baseUrl + currentPath + (window.location.search || '');

            // Update canonical URL - replace DYNAMIC_URL placeholder
            const canonicalLink = document.querySelector('link[rel="canonical"]');
            if (canonicalLink && canonicalLink.href.includes('DYNAMIC_URL')) {
                canonicalLink.href = fullUrl;
            }

            // Update Open Graph URL - replace DYNAMIC_URL placeholder
            const ogUrl = document.querySelector('meta[property="og:url"]');
            if (ogUrl && ogUrl.content.includes('DYNAMIC_URL')) {
                ogUrl.content = fullUrl;
            }

            // Update Twitter URL - replace DYNAMIC_URL placeholder
            const twitterUrl = document.querySelector('meta[property="twitter:url"]');
            if (twitterUrl && twitterUrl.content.includes('DYNAMIC_URL')) {
                twitterUrl.content = fullUrl;
            }

            // Update JSON-LD structured data - replace DYNAMIC_URL placeholder
            const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
            if (jsonLdScript) {
                let jsonLdText = jsonLdScript.textContent;
                if (jsonLdText.includes('DYNAMIC_URL')) {
                    jsonLdText = jsonLdText.replace(/DYNAMIC_URL/g, currentPath + (window.location.search || ''));
                    jsonLdScript.textContent = jsonLdText;
                }
            }

            console.log('Meta tags updated for URL:', fullUrl);
        } catch (error) {
            console.warn('Could not update meta tags:', error);
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
