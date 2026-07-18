/* ===== NEBI — Cookie Consent Banner =====
   Stochează alegerea local, în browser (localStorage), nu pe un server —
   site-ul NEBI este în prezent 100% static, fără backend. Vezi
   LEGAL_IMPLEMENTATION.md pentru detalii și pentru planul de migrare
   către o evidență server-side atunci când va exista un backend real.

   Orice script de analiză sau marketing adăugat ulterior (Google Analytics,
   Meta Pixel, TikTok Pixel etc.) TREBUIE să verifice consimțământul curent
   (window.NebiCookieConsent.getConsent()) sau să asculte evenimentul
   "nebi:consent-updated" înainte de a se inițializa. Nu porni niciun
   asemenea script necondiționat. */

(function () {
    'use strict';

    var STORAGE_KEY = 'nebi_cookie_consent';
    var CONSENT_VERSION = 1; // crește manual la orice schimbare de substanță a categoriilor/textului

    var banner = document.getElementById('cookieBanner');
    if (!banner) return;

    var panel = document.getElementById('cookiePanel');
    var acceptAllBtn = document.getElementById('cookieAcceptAll');
    var rejectAllBtn = document.getElementById('cookieRejectAll');
    var customizeBtn = document.getElementById('cookieCustomize');
    var saveCustomBtn = document.getElementById('cookieSaveCustom');
    var analyticsToggle = document.getElementById('cookieToggleAnalytics');
    var marketingToggle = document.getElementById('cookieToggleMarketing');
    var closeSettingsBtn = document.getElementById('cookieCloseSettings');
    var settingsTriggers = document.querySelectorAll('[data-cookie-settings]');

    // --- Google Consent Mode v2 stub -----------------------------------
    // Inert dacă nu există niciun tag Google pe pagină; devine corect automat
    // în clipa în care se adaugă gtag.js, pentru că "default" e setat ÎNAINTE.
    window.dataLayer = window.dataLayer || [];
    function gtagStub() { window.dataLayer.push(arguments); }
    if (typeof window.gtag !== 'function') {
        window.gtag = gtagStub;
    }
    window.gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
    });

    function updateConsentMode(consent) {
        window.gtag('consent', 'update', {
            analytics_storage: consent.analiza ? 'granted' : 'denied',
            ad_storage: consent.marketing ? 'granted' : 'denied',
            ad_user_data: consent.marketing ? 'granted' : 'denied',
            ad_personalization: consent.marketing ? 'granted' : 'denied'
        });
    }

    // --- Persistență locală ---------------------------------------------
    function getStoredConsent() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            if (typeof parsed !== 'object' || parsed === null) return null;
            return parsed;
        } catch (e) {
            return null;
        }
    }

    function saveConsent(partial) {
        var consent = {
            version: CONSENT_VERSION,
            timestamp: new Date().toISOString(),
            necesare: true, // strict necesare — mereu active, nu pot fi dezactivate
            analiza: !!partial.analiza,
            marketing: !!partial.marketing
        };
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
        } catch (e) {
            // localStorage indisponibil (mod privat strict etc.) — banner-ul va reapărea
            // la următoarea vizită; nu blocăm funcționalitatea site-ului din acest motiv.
        }
        updateConsentMode(consent);
        document.dispatchEvent(new CustomEvent('nebi:consent-updated', { detail: consent }));
        return consent;
    }

    // --- Focus trap simplu -----------------------------------------------
    function getFocusable(container) {
        return Array.prototype.slice.call(
            container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')
        ).filter(function (el) { return el.offsetParent !== null; });
    }

    function trapFocus(e) {
        if (e.key !== 'Tab' || !banner.classList.contains('visible')) return;
        var focusable = getFocusable(banner);
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function showBanner(withPanelOpen, existingConsent) {
        banner.classList.add('visible');
        banner.setAttribute('aria-hidden', 'false');

        if (existingConsent) {
            analyticsToggle.checked = !!existingConsent.analiza;
            marketingToggle.checked = !!existingConsent.marketing;
        } else {
            analyticsToggle.checked = false;
            marketingToggle.checked = false;
        }

        if (withPanelOpen) {
            panel.classList.add('open');
            panel.hidden = false;
        }

        // Dacă utilizatorul a ales deja o dată, poate închide fereastra de
        // setări fără să reia alegerea (Escape). La prima vizită, alegerea
        // este obligatorie și Escape nu închide banner-ul.
        banner.dataset.dismissible = existingConsent ? 'true' : 'false';

        var focusable = getFocusable(banner);
        if (focusable.length) focusable[0].focus();

        document.addEventListener('keydown', trapFocus);
        document.addEventListener('keydown', handleEscape);
    }

    function hideBanner() {
        banner.classList.remove('visible');
        banner.setAttribute('aria-hidden', 'true');
        panel.classList.remove('open');
        panel.hidden = true;
        document.removeEventListener('keydown', trapFocus);
        document.removeEventListener('keydown', handleEscape);
    }

    function handleEscape(e) {
        if (e.key === 'Escape' && banner.dataset.dismissible === 'true') {
            hideBanner();
        }
    }

    // --- Evenimente UI -----------------------------------------------------
    acceptAllBtn.addEventListener('click', function () {
        saveConsent({ analiza: true, marketing: true });
        hideBanner();
    });

    rejectAllBtn.addEventListener('click', function () {
        saveConsent({ analiza: false, marketing: false });
        hideBanner();
    });

    customizeBtn.addEventListener('click', function () {
        var isOpen = panel.classList.toggle('open');
        panel.hidden = !isOpen;
        customizeBtn.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) {
            var focusable = getFocusable(panel);
            if (focusable.length) focusable[0].focus();
        }
    });

    saveCustomBtn.addEventListener('click', function () {
        saveConsent({
            analiza: analyticsToggle.checked,
            marketing: marketingToggle.checked
        });
        hideBanner();
    });

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', function () {
            if (banner.dataset.dismissible === 'true') hideBanner();
        });
    }

    Array.prototype.forEach.call(settingsTriggers, function (trigger) {
        trigger.addEventListener('click', function (e) {
            e.preventDefault();
            showBanner(true, getStoredConsent());
        });
    });

    // --- Inițializare la încărcarea paginii ---------------------------------
    var stored = getStoredConsent();
    if (stored && stored.version === CONSENT_VERSION) {
        updateConsentMode(stored);
    } else {
        showBanner(false, null);
    }

    // API public minimal pentru alte scripturi (analytics/marketing viitoare)
    window.NebiCookieConsent = {
        getConsent: getStoredConsent,
        openSettings: function () { showBanner(true, getStoredConsent()); }
    };
})();
