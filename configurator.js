/* ===== NEBI Tower Configurator =====
 * Business rules (levels, pieces, prices) live in pricing-config.js (window.NebiPricing) —
 * this file only renders the UI and reads/writes that single source of truth.
 * The frontend total is feedback only; the server recalculates before saving an order
 * and again before initiating payment.
 */
(function () {
    'use strict';

    var P = window.NebiPricing;

    // --- Config state ---
    var extraLevels = 0;    // 0..P.MAX_EXTRA_LEVELS, on top of the fixed 12-level base
    var sisalCount = 0;     // individual sisal pieces (additive, no artificial cap)
    var ropeCount = 0;      // individual rope pieces (additive, no artificial cap)

    // --- Tower images ---
    var IMG_BAZA = 'baza.png';
    var IMG_PAR = 'nivel_par.png';
    var IMG_IMPAR = 'nivel_impar.png';
    var IMG_PAT = 'patpisica.png';

    // --- DOM ---
    var towerPreview = document.getElementById('towerPreview');
    var towerHeightLabel = document.getElementById('towerHeight');
    var levelCountEl = document.getElementById('levelCount');
    var summaryStandard = document.getElementById('summaryStandard');
    var summarySisal = document.getElementById('summarySisal');
    var summaryRope = document.getElementById('summaryRope');
    var summaryHeight = document.getElementById('summaryHeight');
    var summaryExtraLevels = document.getElementById('summaryExtraLevels');
    var summaryBasePrice = document.getElementById('summaryBasePrice');
    var summaryExtraLevelsPrice = document.getElementById('summaryExtraLevelsPrice');
    var summarySpecialsPrice = document.getElementById('summarySpecialsPrice');
    var summaryTotal = document.getElementById('summaryTotal');
    var buyBtn = document.getElementById('buyBtn');

    if (!towerPreview) return;

    // Preload images
    [IMG_BAZA, IMG_PAR, IMG_IMPAR, IMG_PAT].forEach(function (src) {
        var img = new Image();
        img.src = src;
    });

    function init() {
        setupSteppers();
        setupBuyButton();
        render();
    }

    // --- Stepper controls ---
    function setupSteppers() {
        document.getElementById('levelMinus').addEventListener('click', function () {
            if (extraLevels > 0) { extraLevels--; render(); }
        });
        document.getElementById('levelPlus').addEventListener('click', function () {
            if (extraLevels < P.MAX_EXTRA_LEVELS) { extraLevels++; render(); }
        });
        document.getElementById('sisalMinus').addEventListener('click', function () {
            if (sisalCount > 0) { sisalCount--; render(); }
        });
        document.getElementById('sisalPlus').addEventListener('click', function () {
            sisalCount++; render();
        });
        document.getElementById('ropeMinus').addEventListener('click', function () {
            if (ropeCount > 0) { ropeCount--; render(); }
        });
        document.getElementById('ropePlus').addEventListener('click', function () {
            ropeCount++; render();
        });
    }

    // --- Buy button ---
    function setupBuyButton() {
        var termsCheckbox = document.getElementById('acceptTermsCheckbox');
        var termsGroup = document.getElementById('termsCheckboxGroup');
        var termsError = document.getElementById('termsCheckboxError');

        if (termsCheckbox) {
            termsCheckbox.addEventListener('change', function () {
                if (termsCheckbox.checked) {
                    termsError.classList.remove('visible');
                    termsGroup.classList.remove('has-error');
                }
            });
        }

        buyBtn.addEventListener('click', function () {
            // Comanda nu poate continua fără acceptarea explicită a Termenilor
            // și a Politicii de anulare/retragere/rambursare — bifă nebifată implicit.
            if (termsCheckbox && !termsCheckbox.checked) {
                termsError.classList.add('visible');
                termsGroup.classList.add('has-error');
                termsCheckbox.focus();
                return;
            }

            try {
                sessionStorage.setItem('nebi_config', JSON.stringify({
                    extraLevels: extraLevels,
                    sisalCount: sisalCount,
                    ropeCount: ropeCount
                }));
            } catch (e) {
                // sessionStorage indisponibil (mod privat strict etc.) — checkout-ul va cere reconfigurarea.
            }

            window.location.href = 'checkout/';
        });
    }

    // --- Render ---
    function render() {
        var totals = P.computeTotals({ extraLevels: extraLevels, sisalCount: sisalCount, ropeCount: ropeCount });
        renderTower(totals);
        updateLabels(totals);
        updateSummary(totals);
    }

    function renderTower(totals) {
        towerPreview.innerHTML = '';

        var stdLevels = P.BASE_STANDARD_LEVELS + totals.levels.extra;
        var pieceTypes = [];
        var i;
        for (i = 0; i < sisalCount; i++) pieceTypes.push('sisal');
        for (i = 0; i < ropeCount; i++) pieceTypes.push('rope');

        // Specials are visually overlaid onto standard-level slots for illustration purposes only;
        // the count purchased (pieceTypes.length) is not limited by how many slots exist to show it on.
        var specialIdx = 0;

        // === BASE (always first, at the bottom) ===
        var baseEl = document.createElement('div');
        baseEl.className = 'tower-level-img tower-base';
        var baseImg = document.createElement('img');
        baseImg.src = IMG_BAZA;
        baseImg.alt = 'Baza turn NEBI';
        baseImg.width = 367;
        baseImg.height = 130;
        baseEl.appendChild(baseImg);
        towerPreview.appendChild(baseEl);

        // === STANDARD LEVELS (alternating par / impar) ===
        for (i = 0; i < stdLevels; i++) {
            var isPar = i % 2 === 0;
            var levelEl = document.createElement('div');

            if (isPar) {
                levelEl.className = 'tower-level-img tower-par';
                if (specialIdx < pieceTypes.length) {
                    levelEl.classList.add('special-' + pieceTypes[specialIdx]);
                    specialIdx++;
                }
                var imgPar = document.createElement('img');
                imgPar.src = IMG_PAR;
                imgPar.alt = 'Nivel par';
                imgPar.width = 232;
                imgPar.height = 63;
                levelEl.appendChild(imgPar);
            } else {
                levelEl.className = 'tower-level-img tower-impar';
                var imgImpar = document.createElement('img');
                imgImpar.src = IMG_IMPAR;
                imgImpar.alt = 'Nivel impar';
                imgImpar.width = 168;
                imgImpar.height = 46;
                levelEl.appendChild(imgImpar);

                if (specialIdx < pieceTypes.length) {
                    levelEl.classList.add('special-left-' + pieceTypes[specialIdx]);
                    specialIdx++;
                }
                if (specialIdx < pieceTypes.length) {
                    levelEl.classList.add('special-right-' + pieceTypes[specialIdx]);
                    specialIdx++;
                }
            }

            towerPreview.appendChild(levelEl);
        }

        // === PAT PISICA (always on top, decorative, not a level) ===
        var patEl = document.createElement('div');
        patEl.className = 'tower-level-img tower-pat';
        var patImg = document.createElement('img');
        patImg.src = IMG_PAT;
        patImg.alt = 'Patuc pisica';
        patImg.width = 232;
        patImg.height = 49;
        patEl.appendChild(patImg);
        towerPreview.appendChild(patEl);

        var allLevels = towerPreview.querySelectorAll('.tower-level-img');
        allLevels.forEach(function (lvl, idx) {
            lvl.style.opacity = '0';
            lvl.style.transform = 'translateY(10px)';
            setTimeout(function () {
                lvl.style.opacity = '1';
                lvl.style.transform = 'translateY(0)';
            }, idx * 40);
        });
    }

    function updateLabels(totals) {
        levelCountEl.textContent = totals.levels.total;
        document.getElementById('sisalCount').textContent = sisalCount;
        document.getElementById('ropeCount').textContent = ropeCount;
        towerHeightLabel.textContent = 'Înălțime: ' + totals.heightM.toFixed(1) + 'm';
    }

    function updateSummary(totals) {
        summaryStandard.textContent = totals.pieces.standard + ' buc';
        summarySisal.textContent = totals.pieces.sisal + ' buc';
        summaryRope.textContent = totals.pieces.rope + ' buc';
        summaryHeight.textContent = totals.heightM.toFixed(1) + 'm';
        if (summaryExtraLevels) {
            summaryExtraLevels.textContent = totals.levels.extra + ' (din maximum ' + P.MAX_EXTRA_LEVELS + ')';
        }
        if (summaryBasePrice) {
            summaryBasePrice.textContent = P.formatRON(totals.priceBani.base);
        }
        if (summaryExtraLevelsPrice) {
            summaryExtraLevelsPrice.textContent = P.formatRON(totals.priceBani.extraLevels);
        }
        if (summarySpecialsPrice) {
            summarySpecialsPrice.textContent = P.formatRON(totals.priceBani.sisal + totals.priceBani.rope);
        }
        summaryTotal.textContent = P.formatRON(totals.priceBani.total);

        if (buyBtn) {
            buyBtn.textContent = 'Comandă și plătește — ' + P.formatRON(totals.priceBani.total);
        }
    }

    // --- Start ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
