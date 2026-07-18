/* ===== NEBI Commerce Config — single source of truth for product/pricing rules =====
 * Used by: configurator.js (browser), checkout page (browser), server/ (Node require()).
 * Do not duplicate 2490/200/300/12/20 or piece dimensions anywhere else — import this file.
 * Money is always represented in integer bani (1 RON = 100 bani) to avoid floating-point drift.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.NebiPricing = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var BASE_LEVELS = 12;
    var MAX_LEVELS = 20;
    var MAX_EXTRA_LEVELS = MAX_LEVELS - BASE_LEVELS; // 8

    // First 2 levels are the fixed foundation: 4 pieces of 60x10x10cm, never removable, never counted as "extra".
    var FOUNDATION_LEVELS = 2;
    var FOUNDATION_PIECES = FOUNDATION_LEVELS * 2; // 4
    // Remaining 10 levels of the base (12-level) configuration: 20 pieces of 40x10x10cm.
    var BASE_STANDARD_LEVELS = BASE_LEVELS - FOUNDATION_LEVELS; // 10
    var BASE_STANDARD_PIECES = BASE_STANDARD_LEVELS * 2; // 20

    var PIECE_DIMENSIONS_CM = {
        foundation: { length: 60, width: 10, height: 10 },
        standard: { length: 40, width: 10, height: 10 }
    };
    var LEVEL_HEIGHT_M = 0.1;

    var PRICE_BASE_BANI = 249000;             // 2.490 lei — base 12-level, 24-piece configuration
    var PRICE_PER_EXTRA_LEVEL_BANI = 20000;   // 200 lei per extra level (2 pieces of 40cm)
    var PRICE_PER_SPECIAL_BANI = 30000;       // 300 lei per special piece (sisal or rope)

    var CURRENCY = 'RON';

    function isNonNegativeInteger(n) {
        return typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n) && n >= 0;
    }

    /**
     * Validates a raw configurator payload. Never trusts values beyond type/range —
     * this same function runs client-side (instant feedback) and server-side (source of truth).
     */
    function validateConfig(input) {
        var errors = [];
        var extraLevels = input && input.extraLevels;
        var sisalCount = input && input.sisalCount;
        var ropeCount = input && input.ropeCount;

        if (!isNonNegativeInteger(extraLevels)) {
            errors.push('extraLevels trebuie să fie un număr întreg, nenegativ.');
        } else if (extraLevels > MAX_EXTRA_LEVELS) {
            errors.push('Numărul maxim de niveluri suplimentare este ' + MAX_EXTRA_LEVELS + '.');
        }

        if (!isNonNegativeInteger(sisalCount)) {
            errors.push('sisalCount trebuie să fie un număr întreg, nenegativ.');
        }
        if (!isNonNegativeInteger(ropeCount)) {
            errors.push('ropeCount trebuie să fie un număr întreg, nenegativ.');
        }

        return { valid: errors.length === 0, errors: errors };
    }

    /**
     * Computes the canonical totals for a configuration. Throws on invalid input —
     * callers (client render loop, server order creation) must validate/catch explicitly.
     */
    function computeTotals(input) {
        var validation = validateConfig(input);
        if (!validation.valid) {
            var err = new Error('Configurație invalidă: ' + validation.errors.join(' '));
            err.code = 'INVALID_CONFIG';
            err.details = validation.errors;
            throw err;
        }

        var extraLevels = input.extraLevels;
        var sisalCount = input.sisalCount;
        var ropeCount = input.ropeCount;

        var totalLevels = BASE_LEVELS + extraLevels;
        var extraPieces = extraLevels * 2;
        var totalStandardPieces = BASE_STANDARD_PIECES + extraPieces;
        var specialPieces = sisalCount + ropeCount;
        var totalPieces = FOUNDATION_PIECES + totalStandardPieces + specialPieces;

        var extraLevelsPriceBani = extraLevels * PRICE_PER_EXTRA_LEVEL_BANI;
        var sisalPriceBani = sisalCount * PRICE_PER_SPECIAL_BANI;
        var ropePriceBani = ropeCount * PRICE_PER_SPECIAL_BANI;
        var totalBani = PRICE_BASE_BANI + extraLevelsPriceBani + sisalPriceBani + ropePriceBani;

        return {
            levels: { base: BASE_LEVELS, extra: extraLevels, total: totalLevels },
            heightM: Math.round(totalLevels * LEVEL_HEIGHT_M * 10) / 10,
            pieces: {
                foundation: FOUNDATION_PIECES,
                standard: totalStandardPieces,
                sisal: sisalCount,
                rope: ropeCount,
                total: totalPieces
            },
            priceBani: {
                base: PRICE_BASE_BANI,
                extraLevels: extraLevelsPriceBani,
                sisal: sisalPriceBani,
                rope: ropePriceBani,
                total: totalBani
            },
            currency: CURRENCY
        };
    }

    /** Formats an integer bani amount as Romanian-locale RON text, e.g. 249000 -> "2.490 lei". */
    function formatRON(bani) {
        var lei = bani / 100;
        var formatted;
        try {
            formatted = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 }).format(lei);
        } catch (e) {
            formatted = String(lei);
        }
        return formatted + ' lei';
    }

    return {
        BASE_LEVELS: BASE_LEVELS,
        MAX_LEVELS: MAX_LEVELS,
        MAX_EXTRA_LEVELS: MAX_EXTRA_LEVELS,
        FOUNDATION_LEVELS: FOUNDATION_LEVELS,
        FOUNDATION_PIECES: FOUNDATION_PIECES,
        BASE_STANDARD_LEVELS: BASE_STANDARD_LEVELS,
        BASE_STANDARD_PIECES: BASE_STANDARD_PIECES,
        PIECE_DIMENSIONS_CM: PIECE_DIMENSIONS_CM,
        PRICE_BASE_BANI: PRICE_BASE_BANI,
        PRICE_PER_EXTRA_LEVEL_BANI: PRICE_PER_EXTRA_LEVEL_BANI,
        PRICE_PER_SPECIAL_BANI: PRICE_PER_SPECIAL_BANI,
        CURRENCY: CURRENCY,
        validateConfig: validateConfig,
        computeTotals: computeTotals,
        formatRON: formatRON
    };
}));
