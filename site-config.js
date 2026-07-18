/* ===== NEBI Site Config — single source of truth for merchant identity & contact placeholders =====
 * contact.email / contact.phone are the ONLY commercial placeholders left in this project (per spec);
 * change them here once and every page picks them up via contact-apply.js — never hardcode them elsewhere.
 * Used by: contact-apply.js (browser DOM injection), structured data, server/ (Node require()).
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.NebiConfig = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    return {
        contact: {
            // PLACEHOLDER — to be replaced with NEBI's official support e-mail before launch.
            email: 'bforge478@gmail.com',
            // PLACEHOLDER — to be replaced with NEBI's official support phone number before launch.
            phone: '+40722882473',
            phoneDisplay: '0722 882 473'
        },
        merchant: {
            legalName: 'WORLDWIDE CONSULTING LINE SRL',
            brand: 'NEBI',
            brandStatement: 'NEBI este denumirea comercială sub care WORLDWIDE CONSULTING LINE SRL operează magazinul online nebi.ro.',
            cui: '44398383',
            regCom: 'J29/1422/2021',
            euid: 'ROONRC.J29/1422/2021',
            foundedDate: '2021-06-08',
            address: {
                street: 'Str. Mircea cel Bătrân nr. 85',
                city: 'Ploiești',
                county: 'Prahova',
                postalCode: '100426',
                country: 'România',
                countryCode: 'RO'
            }
        },
        shipping: {
            carrier: 'GLS',
            deliveryCountry: 'România',
            productionDays: 7,
            carrierEstimateHours: '24–48 de ore lucrătoare',
            maxDeliveryDays: 30,
            includedInPrice: true
        },
        payment: {
            provider: 'NETOPIA Payments',
            methods: ['card']
        }
    };
}));
