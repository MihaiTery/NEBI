/* ===== NEBI Tower Configurator ===== */

(function () {
    'use strict';

    // --- Config state ---
    let levels = 12;        // number of tower levels (2 pieces each)
    let baseLevels = 2;     // number of base levels (wider pieces)
    let platformCount = 0;  // special platform pieces
    let sisalCount = 0;     // sisal pieces (for scratching)
    let ropeCount = 0;      // rope pieces (for playing)

    // --- Pricing ---
    const PRICE_BASE = 249;         // base price for default config (12 levels, 2 base)
    const PRICE_PER_LEVEL = 15;     // per additional level
    const PRICE_PER_BASE = 20;      // per additional base level
    const PRICE_PER_PLATFORM = 35;  // per platform piece
    const PRICE_PER_SISAL = 25;     // per sisal piece
    const PRICE_PER_ROPE = 20;      // per rope piece

    const DEFAULT_LEVELS = 12;
    const DEFAULT_BASE = 2;

    // --- DOM ---
    const towerPreview = document.getElementById('towerPreview');
    const towerHeightLabel = document.getElementById('towerHeight');

    const levelCount = document.getElementById('levelCount');
    const baseCount = document.getElementById('baseCount');
    const platformCountEl = document.getElementById('platformCount');

    const summaryStandard = document.getElementById('summaryStandard');
    const summaryBase = document.getElementById('summaryBase');
    const summaryPlatform = document.getElementById('summaryPlatform');
    const summarySisal = document.getElementById('summarySisal');
    const summaryRope = document.getElementById('summaryRope');
    const summaryHeight = document.getElementById('summaryHeight');
    const summaryTotal = document.getElementById('summaryTotal');

    if (!towerPreview) return; // not on configurator page

    // --- Init ---
    function init() {
        setupSteppers();
        setupBuyButton();
        render();
    }

    // --- Stepper controls ---
    function setupSteppers() {
        document.getElementById('levelMinus').addEventListener('click', () => {
            if (levels > 4) { levels--; render(); }
        });
        document.getElementById('levelPlus').addEventListener('click', () => {
            if (levels < 20) { levels++; render(); }
        });
        document.getElementById('baseMinus').addEventListener('click', () => {
            if (baseLevels > 1) { baseLevels--; render(); }
        });
        document.getElementById('basePlus').addEventListener('click', () => {
            if (baseLevels < 4) { baseLevels++; render(); }
        });
        document.getElementById('platformMinus').addEventListener('click', () => {
            if (platformCount > 0) { platformCount--; render(); }
        });
        document.getElementById('platformPlus').addEventListener('click', () => {
            if (platformCount < 4) { platformCount++; render(); }
        });
        document.getElementById('sisalMinus').addEventListener('click', () => {
            if (sisalCount > 0) { sisalCount--; render(); }
        });
        document.getElementById('sisalPlus').addEventListener('click', () => {
            if (sisalCount < 6) { sisalCount++; render(); }
        });
        document.getElementById('ropeMinus').addEventListener('click', () => {
            if (ropeCount > 0) { ropeCount--; render(); }
        });
        document.getElementById('ropePlus').addEventListener('click', () => {
            if (ropeCount < 6) { ropeCount++; render(); }
        });
    }

    // --- Buy button ---
    function setupBuyButton() {
        document.getElementById('buyBtn').addEventListener('click', () => {
            alert('🐱 Mulțumim pentru interes!\n\nSistemul de plată va fi disponibil în curând.\nFiecare achiziție contribuie la salvarea animalelor fără adăpost!');
        });
    }

    // --- Render tower ---
    function render() {
        renderTower();
        updateLabels();
        updateSummary();
    }

    function renderTower() {
        towerPreview.innerHTML = '';

        // Base levels
        for (let i = 0; i < baseLevels; i++) {
            const level = createLevel('horizontal', 'base', i);
            towerPreview.appendChild(level);
        }

        // Standard levels (alternating horizontal/vertical)
        // Distribute special pieces: sisal at bottom, rope in middle, platform at top
        const specialMap = {};
        let idx = 0;
        for (let s = 0; s < sisalCount && idx < levels; s++, idx++) {
            specialMap[idx] = 'sisal';
        }
        for (let r = 0; r < ropeCount && idx < levels; r++, idx++) {
            specialMap[idx] = 'rope';
        }
        for (let p = 0; p < platformCount && idx < levels; p++, idx++) {
            specialMap[idx] = 'platform';
        }

        for (let i = 0; i < levels; i++) {
            const direction = i % 2 === 0 ? 'horizontal' : 'vertical';
            const pieceType = specialMap[i] || 'standard';
            const level = createLevel(direction, pieceType, baseLevels + i);
            towerPreview.appendChild(level);
        }

        // Animate new levels in
        const allLevels = towerPreview.querySelectorAll('.tower-level');
        allLevels.forEach((lvl, idx) => {
            lvl.style.opacity = '0';
            lvl.style.transform = 'scale(0.8)';
            setTimeout(() => {
                lvl.style.opacity = '1';
                lvl.style.transform = 'scale(1)';
            }, idx * 40);
        });
    }

    function createLevel(direction, pieceType, index) {
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
                case 'platform':
                    className += ' special';
                    break;
                default:
                    className += ' wood-brad';
            }

            piece.className = className;

            // Add pixel grain texture for standard wood
            if (pieceType === 'standard' || pieceType === 'base') {
                const grain = Math.floor(Math.random() * 3);
                piece.style.filter = `brightness(${0.95 + grain * 0.03})`;
            }

            level.appendChild(piece);
        }

        return level;
    }

    function updateLabels() {
        levelCount.textContent = levels;
        baseCount.textContent = baseLevels;
        platformCountEl.textContent = platformCount;
        document.getElementById('sisalCount').textContent = sisalCount;
        document.getElementById('ropeCount').textContent = ropeCount;

        // Height calculation: each level = 10cm, base = 10cm
        const heightCm = (levels * 10) + (baseLevels * 10);
        const heightM = (heightCm / 100).toFixed(1);
        towerHeightLabel.textContent = `Inălțime: ${heightM}m`;
    }

    function updateSummary() {
        const specialTotal = platformCount + sisalCount + ropeCount;
        const standardPieces = Math.max(0, levels - specialTotal) * 2;
        const basePieces = baseLevels * 2;
        const platformPieces = platformCount * 2;
        const sisalPieces = sisalCount * 2;
        const ropePieces = ropeCount * 2;

        summaryStandard.textContent = `${standardPieces} buc`;
        summaryBase.textContent = `${basePieces} buc`;
        summaryPlatform.textContent = `${platformPieces} buc`;
        summarySisal.textContent = `${sisalPieces} buc`;
        summaryRope.textContent = `${ropePieces} buc`;

        const heightCm = (levels * 10) + (baseLevels * 10);
        summaryHeight.textContent = `${(heightCm / 100).toFixed(1)}m`;

        // Price calculation
        const extraLevels = Math.max(0, levels - DEFAULT_LEVELS);
        const extraBase = Math.max(0, baseLevels - DEFAULT_BASE);
        const total = PRICE_BASE
            + (extraLevels * PRICE_PER_LEVEL)
            + (extraBase * PRICE_PER_BASE)
            + (platformCount * PRICE_PER_PLATFORM)
            + (sisalCount * PRICE_PER_SISAL)
            + (ropeCount * PRICE_PER_ROPE);

        summaryTotal.textContent = `${total} RON`;
    }

    // --- Start ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
