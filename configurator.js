/* ===== NEBI Tower Configurator ===== */

(function () {
    'use strict';

    // --- Config state ---
    let levels = 12;        // total levels (min 12)
    let sisalCount = 0;     // individual sisal pieces
    let ropeCount = 0;      // individual rope pieces

    const BASE_LEVELS = 2;  // always 2 base levels (4 pieces of 60cm)

    // --- Tower images ---
    const IMG_BAZA = 'baza.png';
    const IMG_PAR = 'nivel_par.png';
    const IMG_IMPAR = 'nivel_impar.png';
    const IMG_PAT = 'patpisica.png';

    // --- Pricing ---
    const PRICE_BASE = 2490;
    const PRICE_PER_EXTRA_LEVEL = 150;
    const PRICE_PER_SPECIAL = 75;

    const MIN_LEVELS = 12;
    const MAX_LEVELS = 20;

    // --- DOM ---
    const towerPreview = document.getElementById('towerPreview');
    const towerHeightLabel = document.getElementById('towerHeight');
    const levelCountEl = document.getElementById('levelCount');
    const summaryStandard = document.getElementById('summaryStandard');
    const summarySisal = document.getElementById('summarySisal');
    const summaryRope = document.getElementById('summaryRope');
    const summaryHeight = document.getElementById('summaryHeight');
    const summaryTotal = document.getElementById('summaryTotal');

    if (!towerPreview) return;

    // Preload images
    [IMG_BAZA, IMG_PAR, IMG_IMPAR, IMG_PAT].forEach(src => {
        const img = new Image();
        img.src = src;
    });

    // --- Init ---
    function init() {
        setupSteppers();
        setupBuyButton();
        render();
    }

    // --- Helpers ---
    function getStandardLevels() {
        return levels - BASE_LEVELS;
    }

    function getTotalStandardPieces() {
        return getStandardLevels() * 2;
    }

    function getMaxSpecials() {
        return getTotalStandardPieces();
    }

    function clampSpecials() {
        const max = getMaxSpecials();
        const total = sisalCount + ropeCount;
        if (total > max) {
            const excess = total - max;
            ropeCount = Math.max(0, ropeCount - excess);
            if (sisalCount + ropeCount > max) {
                sisalCount = max - ropeCount;
            }
        }
    }

    // --- Stepper controls ---
    function setupSteppers() {
        document.getElementById('levelMinus').addEventListener('click', () => {
            if (levels > MIN_LEVELS) { levels--; clampSpecials(); render(); }
        });
        document.getElementById('levelPlus').addEventListener('click', () => {
            if (levels < MAX_LEVELS) { levels++; render(); }
        });
        document.getElementById('sisalMinus').addEventListener('click', () => {
            if (sisalCount > 0) { sisalCount--; render(); }
        });
        document.getElementById('sisalPlus').addEventListener('click', () => {
            if (sisalCount + ropeCount < getMaxSpecials()) { sisalCount++; render(); }
        });
        document.getElementById('ropeMinus').addEventListener('click', () => {
            if (ropeCount > 0) { ropeCount--; render(); }
        });
        document.getElementById('ropePlus').addEventListener('click', () => {
            if (sisalCount + ropeCount < getMaxSpecials()) { ropeCount++; render(); }
        });
    }

    // --- Buy button ---
    function setupBuyButton() {
        document.getElementById('buyBtn').addEventListener('click', () => {
            alert('🐱 Multumim pentru interes!\n\nSistemul de plata va fi disponibil in curand.\nFiecare achizitie contribuie la salvarea animalelor fara adapost!');
        });
    }

    // --- Render ---
    function render() {
        renderTower();
        updateLabels();
        updateSummary();
    }

    function renderTower() {
        towerPreview.innerHTML = '';

        // Build a flat list of individual piece types for special tracking
        // Each "impar" level has 2 visible piece slots
        const stdLevels = getStandardLevels();
        const pieceTypes = [];
        for (let i = 0; i < sisalCount; i++) pieceTypes.push('sisal');
        for (let i = 0; i < ropeCount; i++) pieceTypes.push('rope');

        // Track which impar-level pieces are special
        // Specials only apply to impar levels (where you see the 2 individual ends)
        let specialIdx = 0;

        // === BASE (always first, at the bottom) ===
        const baseEl = document.createElement('div');
        baseEl.className = 'tower-level-img tower-base';
        const baseImg = document.createElement('img');
        baseImg.src = IMG_BAZA;
        baseImg.alt = 'Baza turn NEBI';
        baseEl.appendChild(baseImg);
        towerPreview.appendChild(baseEl);

        // === STANDARD LEVELS (alternating par / impar) ===
        // Level index 0 = first above base = par (lateral view)
        // Level index 1 = impar (front view, 2 ends)
        // ...alternating
        for (let i = 0; i < stdLevels; i++) {
            const isPar = i % 2 === 0;
            const levelEl = document.createElement('div');

            if (isPar) {
                // Par level: single lateral piece image
                levelEl.className = 'tower-level-img tower-par';

                // Check if this par-level piece has a special overlay
                if (specialIdx < pieceTypes.length) {
                    levelEl.classList.add('special-' + pieceTypes[specialIdx]);
                    specialIdx++;
                }

                const img = document.createElement('img');
                img.src = IMG_PAR;
                img.alt = 'Nivel par';
                levelEl.appendChild(img);
            } else {
                // Impar level: two piece ends
                levelEl.className = 'tower-level-img tower-impar';
                const img = document.createElement('img');
                img.src = IMG_IMPAR;
                img.alt = 'Nivel impar';
                levelEl.appendChild(img);

                // Check specials for left and right piece
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
        const patEl = document.createElement('div');
        patEl.className = 'tower-level-img tower-pat';
        const patImg = document.createElement('img');
        patImg.src = IMG_PAT;
        patImg.alt = 'Patuc pisica';
        patEl.appendChild(patImg);
        towerPreview.appendChild(patEl);

        // Pat does NOT count as a level — it's always present on top

        // Animate in
        const allLevels = towerPreview.querySelectorAll('.tower-level-img');
        allLevels.forEach((lvl, i) => {
            lvl.style.opacity = '0';
            lvl.style.transform = 'translateY(10px)';
            setTimeout(() => {
                lvl.style.opacity = '1';
                lvl.style.transform = 'translateY(0)';
            }, i * 40);
        });
    }

    function updateLabels() {
        levelCountEl.textContent = levels;
        document.getElementById('sisalCount').textContent = sisalCount;
        document.getElementById('ropeCount').textContent = ropeCount;

        const heightCm = levels * 10;
        towerHeightLabel.textContent = `Inaltime: ${(heightCm / 100).toFixed(1)}m`;
    }

    function updateSummary() {
        const totalStdPieces = getTotalStandardPieces();
        const plainStandard = totalStdPieces - sisalCount - ropeCount;

        summaryStandard.textContent = `${plainStandard} buc`;
        summarySisal.textContent = `${sisalCount} buc`;
        summaryRope.textContent = `${ropeCount} buc`;

        const heightCm = levels * 10;
        summaryHeight.textContent = `${(heightCm / 100).toFixed(1)}m`;

        const extraLevels = Math.max(0, levels - MIN_LEVELS);
        const specialCount = sisalCount + ropeCount;
        const total = PRICE_BASE
            + (extraLevels * PRICE_PER_EXTRA_LEVEL)
            + (specialCount * PRICE_PER_SPECIAL);

        summaryTotal.textContent = `${total} RON`;
    }

    // --- Start ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
