(function () {
    'use strict';

    var orderNumber = window.NebiPlata.getOrderNumber();
    var textEl = document.getElementById('statusText');
    var orderBox = document.getElementById('orderNumberBox');
    var checkNowBtn = document.getElementById('checkNowBtn');

    var POLL_INTERVAL_MS = 3000;
    var MAX_ATTEMPTS = 20; // ~60 seconds of polling before asking the user to check back later
    var attempts = 0;
    var timer = null;

    if (!orderNumber) {
        textEl.textContent = 'Nu am găsit numărul comenzii. Contactează-ne dacă ai finalizat o plată.';
        return;
    }

    orderBox.textContent = orderNumber;
    orderBox.style.display = 'inline-block';

    function isFinal(status) {
        return ['paid', 'failed', 'cancelled', 'expired', 'refunded'].indexOf(status) !== -1;
    }

    function redirectFor(status) {
        if (status === 'paid') {
            window.location.href = '../succes/?order=' + encodeURIComponent(orderNumber);
        } else if (status === 'cancelled') {
            window.location.href = '../anulata/?order=' + encodeURIComponent(orderNumber);
        } else {
            window.location.href = '../esuata/?order=' + encodeURIComponent(orderNumber);
        }
    }

    function check() {
        attempts++;
        window.NebiPlata.fetchStatus(orderNumber).then(function (status) {
            if (isFinal(status.paymentStatus)) {
                stopPolling();
                redirectFor(status.paymentStatus);
                return;
            }
            if (attempts >= MAX_ATTEMPTS) {
                stopPolling();
                textEl.textContent = 'Confirmarea durează mai mult decât de obicei. Poți reveni în siguranță mai târziu — vei găsi statusul actualizat.';
            }
        }).catch(function () {
            // Transient network error — keep polling silently up to MAX_ATTEMPTS.
        });
    }

    function startPolling() {
        timer = setInterval(check, POLL_INTERVAL_MS);
    }

    function stopPolling() {
        if (timer) { clearInterval(timer); timer = null; }
    }

    checkNowBtn.addEventListener('click', check);

    check();
    startPolling();
})();
