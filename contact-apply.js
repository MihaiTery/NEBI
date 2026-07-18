/* ===== NEBI Contact Injector =====
 * Fills every [data-nebi-contact-email] / [data-nebi-contact-phone] element from site-config.js.
 * The HTML already ships the same value as a static fallback (no-JS, SEO), so this only needs
 * to keep them in sync when site-config.js changes — edit the value in exactly one place.
 */
(function () {
    'use strict';

    function apply() {
        var cfg = (typeof window !== 'undefined' && window.NebiConfig) || null;
        if (!cfg) return;

        var emailEls = document.querySelectorAll('[data-nebi-contact-email]');
        for (var i = 0; i < emailEls.length; i++) {
            emailEls[i].setAttribute('href', 'mailto:' + cfg.contact.email);
            emailEls[i].textContent = cfg.contact.email;
        }

        var phoneEls = document.querySelectorAll('[data-nebi-contact-phone]');
        for (var j = 0; j < phoneEls.length; j++) {
            phoneEls[j].setAttribute('href', 'tel:' + cfg.contact.phone);
            phoneEls[j].textContent = cfg.contact.phoneDisplay;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply);
    } else {
        apply();
    }
})();
