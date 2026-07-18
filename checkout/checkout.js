(function () {
    'use strict';

    var P = window.NebiPricing;
    var config = null;

    try {
        var raw = sessionStorage.getItem('nebi_config');
        if (raw) config = JSON.parse(raw);
    } catch (e) {
        config = null;
    }

    var noConfigNotice = document.getElementById('noConfigNotice');
    var checkoutContent = document.getElementById('checkoutContent');

    if (!config || typeof config.extraLevels !== 'number') {
        noConfigNotice.classList.add('visible');
        return;
    }

    var totals;
    try {
        totals = P.computeTotals(config);
    } catch (e) {
        noConfigNotice.textContent = 'Configurația salvată nu mai este validă. Te rugăm să reconfigurezi turnul.';
        noConfigNotice.classList.add('visible');
        return;
    }

    noConfigNotice.classList.remove('visible');
    checkoutContent.style.display = 'block';

    document.getElementById('cfgLevels').textContent = totals.levels.total + ' (înălțime ' + totals.heightM.toFixed(1) + 'm)';
    document.getElementById('cfgExtraLevels').textContent = totals.levels.extra + ' (din maximum ' + P.MAX_EXTRA_LEVELS + ')';
    document.getElementById('cfgPieces').textContent = totals.pieces.total + ' buc';
    document.getElementById('cfgSisal').textContent = totals.pieces.sisal + ' buc';
    document.getElementById('cfgRope').textContent = totals.pieces.rope + ' buc';
    document.getElementById('cfgBasePrice').textContent = P.formatRON(totals.priceBani.base);
    document.getElementById('cfgExtraPrice').textContent = P.formatRON(totals.priceBani.extraLevels);
    document.getElementById('cfgSpecialsPrice').textContent = P.formatRON(totals.priceBani.sisal + totals.priceBani.rope);
    document.getElementById('cfgTotal').textContent = P.formatRON(totals.priceBani.total);
    document.getElementById('submitTotal').textContent = P.formatRON(totals.priceBani.total);

    // NETOPIA logo slot: only shown once the official asset exists at ../netopia-logo.png —
    // otherwise the neutral fallback text stays visible. No structural change needed later.
    var logoImg = document.getElementById('netopiaLogoImg');
    var logoFallback = document.getElementById('netopiaFallbackText');
    var probe = new Image();
    probe.onload = function () {
        logoImg.src = probe.src;
        logoImg.style.display = 'inline-block';
        logoFallback.style.display = 'none';
    };
    probe.onerror = function () { /* keep fallback text — expected until the official asset is added */ };
    probe.src = '../netopia-logo.png';

    // --- Customer type toggle ---
    var individualFields = document.getElementById('individualFields');
    var companyFields = document.getElementById('companyFields');
    var typeRadios = document.querySelectorAll('input[name="customerType"]');
    function syncCustomerType() {
        var type = document.querySelector('input[name="customerType"]:checked').value;
        individualFields.style.display = type === 'individual' ? 'block' : 'none';
        companyFields.style.display = type === 'company' ? 'block' : 'none';
        document.getElementById('firstName').required = type === 'individual';
        document.getElementById('lastName').required = type === 'individual';
        document.getElementById('companyName').required = type === 'company';
        document.getElementById('cui').required = type === 'company';
        if (type === 'company') {
            document.getElementById('billingSameAsShipping').checked = false;
            syncBilling();
        }
    }
    typeRadios.forEach(function (r) { r.addEventListener('change', syncCustomerType); });

    // --- Billing address toggle ---
    var billingSameAsShipping = document.getElementById('billingSameAsShipping');
    var billingFields = document.getElementById('billingFields');
    function syncBilling() {
        var isCompany = document.querySelector('input[name="customerType"]:checked').value === 'company';
        var same = billingSameAsShipping.checked && !isCompany;
        billingFields.style.display = same ? 'none' : 'block';
    }
    billingSameAsShipping.addEventListener('change', syncBilling);
    syncCustomerType();
    syncBilling();

    // --- Submit ---
    var form = document.getElementById('checkoutForm');
    var submitBtn = document.getElementById('submitBtn');
    var submitStatus = document.getElementById('submitStatus');
    var errorSummary = document.getElementById('formErrorSummary');
    var netopiaDisabledNotice = document.getElementById('netopiaDisabledNotice');

    function val(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }

    function showErrors(messages) {
        errorSummary.innerHTML = '<strong>Verifică formularul:</strong><ul>' +
            messages.map(function (m) { return '<li>' + m + '</li>'; }).join('') + '</ul>';
        errorSummary.classList.add('visible');
        errorSummary.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        errorSummary.classList.remove('visible');

        var customerType = document.querySelector('input[name="customerType"]:checked').value;

        if (!document.getElementById('confirmedConfig').checked ||
            !document.getElementById('acceptedTerms').checked ||
            !document.getElementById('acceptedRefundPolicy').checked) {
            showErrors(['Trebuie să bifezi toate confirmările obligatorii înainte de a continua.']);
            return;
        }

        var payload = {
            config: config,
            customerType: customerType,
            email: val('email'),
            phone: val('phone'),
            shipping: {
                county: val('shipCounty'),
                city: val('shipCity'),
                address: val('shipAddress'),
                postalCode: val('shipPostalCode')
            },
            billingSameAsShipping: billingSameAsShipping.checked && customerType === 'individual',
            notes: val('notes') || undefined,
            acceptedTerms: true,
            acceptedRefundPolicy: true,
            confirmedConfig: true
        };

        if (customerType === 'individual') {
            payload.firstName = val('firstName');
            payload.lastName = val('lastName');
        } else {
            payload.companyName = val('companyName');
            payload.cui = val('cui');
            payload.regCom = val('regCom') || undefined;
        }

        if (!payload.billingSameAsShipping) {
            payload.billing = {
                companyName: customerType === 'company' ? val('companyName') : (val('billingCompanyName') || undefined),
                cui: customerType === 'company' ? val('cui') : undefined,
                regCom: customerType === 'company' ? (val('regCom') || undefined) : undefined,
                county: val('billingCounty') || payload.shipping.county,
                city: val('billingCity') || payload.shipping.city,
                address: val('billingAddress') || payload.shipping.address,
                postalCode: val('billingPostalCode') || payload.shipping.postalCode,
                contactName: val('billingContactName') || undefined,
                contactEmail: val('billingContactEmail') || undefined
            };
        }

        submitBtn.disabled = true;
        submitStatus.textContent = 'Se creează comanda…';

        fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (res) {
                return res.json().then(function (body) { return { ok: res.ok, body: body }; });
            })
            .then(function (result) {
                if (!result.ok) {
                    var messages = (result.body.details || []).map(function (d) { return d.message || String(d); });
                    if (messages.length === 0) messages = [result.body.error || 'Comanda nu a putut fi creată.'];
                    showErrors(messages);
                    submitBtn.disabled = false;
                    submitStatus.textContent = '';
                    return null;
                }
                return result.body.publicNumber;
            })
            .then(function (publicNumber) {
                if (!publicNumber) return;

                submitStatus.textContent = 'Comandă înregistrată. Se inițiază plata…';

                return fetch('/api/payments/netopia/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ publicNumber: publicNumber })
                })
                    .then(function (res) { return res.json(); })
                    .then(function (payRes) {
                        try { sessionStorage.removeItem('nebi_config'); } catch (e) { /* ignore */ }

                        if (payRes.disabled) {
                            netopiaDisabledNotice.textContent = payRes.message || 'Plata online nu este încă activă.';
                            netopiaDisabledNotice.style.display = 'block';
                            submitStatus.textContent = 'Comandă înregistrată — numărul comenzii: ' + publicNumber;
                            window.location.href = '../plata/procesare/?order=' + encodeURIComponent(publicNumber);
                            return;
                        }

                        if (payRes.paymentUrl) {
                            window.location.href = payRes.paymentUrl;
                            return;
                        }

                        window.location.href = '../plata/esuata/?order=' + encodeURIComponent(publicNumber);
                    });
            })
            .catch(function () {
                showErrors(['A apărut o problemă de rețea. Verifică conexiunea și încearcă din nou.']);
                submitBtn.disabled = false;
                submitStatus.textContent = '';
            });
    });
})();
