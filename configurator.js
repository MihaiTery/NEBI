/* ===== NEBI Tower Configurator ===== */

(function () {
    'use strict';

    // --- Config state ---
    // Total levels includes 2 base levels + standard levels
    // At 12 levels: 2 base (4 pieces of 60cm) + 10 standard (20 pieces of 40cm) = 1.2m
    let levels = 12;        // total levels (min 12)
    let sisalCount = 0;     // sisal pieces (for scratching)
    let ropeCount = 0;      // rope pieces (for playing)

    const BASE_LEVELS = 2;  // always 2 base levels (4 pieces of 60cm)

    // --- Pricing ---
    const PRICE_BASE = 2490;        // base price for 12 levels
    const PRICE_PER_EXTRA_LEVEL = 150; // per extra level above 12
    const PRICE_PER_SPECIAL = 75;   // per sisal or rope piece

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

    // --- Init ---
    function init() {
        setupSteppers();
        setupBuyButton();
        render();
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
            if (sisalCount + ropeCount < getStandardLevels()) { sisalCount++; render(); }
        });
        document.getElementById('ropeMinus').addEventListener('click', () => {
            if (ropeCount > 0) { ropeCount--; render(); }
        });
        document.getElementById('ropePlus').addEventListener('click', () => {
            if (sisalCount + ropeCount < getStandardLevels()) { ropeCount++; render(); }
        });
    }

    function getStandardLevels() {
        return levels - BASE_LEVELS;
    }

    function clampSpecials() {
        const maxSpecial = getStandardLevels();
        const total = sisalCount + ropeCount;
        if (total > maxSpecial) {
            const excess = total - maxSpecial;
            ropeCount = Math.max(0, ropeCount - excess);
            if (sisalCount + ropeCount > maxSpecial) {
                sisalCount = maxSpecial - ropeCount;
            }
        }
    }

    // --- Buy button ---
    function setupBuyButton() {
        document.getElementById('buyBtn').addEventListener('click', () => {
            alert('🐱 Mulțumim pentru interes!\n\nSistemul de plată va fi disponibil în curând.\nFiecare achiziție contribuie la salvarea animalelor fără adăpost!');
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

        // Base levels (always 2)
        for (let i = 0; i < BASE_LEVELS; i++) {
            const level = createLevel('horizontal', 'base');
            towerPreview.appendChild(level);
        }

        // Standard levels
        const stdLevels = getStandardLevels();
        // Distribute specials: sisal at bottom, rope above
        const specialMap = {};
        let idx = 0;
        for (let s = 0; s < sisalCount && idx < stdLevels; s++, idx++) {
            specialMap[idx] = 'sisal';
        }
        for (let r = 0; r < ropeCount && idx < stdLevels; r++, idx++) {
            specialMap[idx] = 'rope';
        }

        for (let i = 0; i < stdLevels; i++) {
            const direction = i % 2 === 0 ? 'horizontal' : 'vertical';
            const pieceType = specialMap[i] || 'standard';
            const level = createLevel(direction, pieceType);
            towerPreview.appendChild(level);
        }

        // Animate
        const allLevels = towerPreview.querySelectorAll('.tower-level');
        allLevels.forEach((lvl, i) => {
            lvl.style.opacity = '0';
            lvl.style.transform = 'scale(0.8)';
            setTimeout(() => {
                lvl.style.opacity = '1';
                lvl.style.transform = 'scale(1)';
            }, i * 40);
        });
    }

    function createLevel(direction, pieceType) {
        const level = document.createElement('div');
        level.className = `tower-level ${direction}`;
        level.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        for (let p = 0; p < 2; p++) {
            const piece = document.createElement('div');
            let className = 'tower-piece';

            switch (pieceType) {
                case 'base':
                    className += ' base-piece wood-brad';
                    break;
                case 'sisal':
                    className += ' sisal-piece';
                    break;
                case 'rope':
                    className += ' rope-piece';
                    break;
                default:
                    className += ' wood-brad';
            }

            piece.className = className;

            if (pieceType === 'standard' || pieceType === 'base') {
                const grain = Math.floor(Math.random() * 3);
                piece.style.filter = `brightness(${0.95 + grain * 0.03})`;
            }

            level.appendChild(piece);
        }

        return level;
    }

    function updateLabels() {
        levelCountEl.textContent = levels;
        document.getElementById('sisalCount').textContent = sisalCount;
        document.getElementById('ropeCount').textContent = ropeCount;

        // Height: each level = 10cm
        const heightCm = levels * 10;
        towerHeightLabel.textContent = `Înălțime: ${(heightCm / 100).toFixed(1)}m`;
    }

    function updateSummary() {
        const stdLevels = getStandardLevels();
        const plainStandard = stdLevels - sisalCount - ropeCount;
        const standardPieces = plainStandard * 2;
        const sisalPieces = sisalCount * 2;
        const ropePieces = ropeCount * 2;

        summaryStandard.textContent = `${standardPieces} buc`;
        summarySisal.textContent = `${sisalPieces} buc`;
        summaryRope.textContent = `${ropePieces} buc`;

        const heightCm = levels * 10;
        summaryHeight.textContent = `${(heightCm / 100).toFixed(1)}m`;

        // Price
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
