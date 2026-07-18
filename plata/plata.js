(function () {
    'use strict';

    function getOrderNumber() {
        var params = new URLSearchParams(window.location.search);
        return params.get('order');
    }

    function fetchStatus(publicNumber) {
        return fetch('/api/orders/' + encodeURIComponent(publicNumber) + '/payment-status')
            .then(function (res) {
                if (!res.ok) throw new Error('status-fetch-failed');
                return res.json();
            });
    }

    function retryPayment(publicNumber) {
        return fetch('/api/payments/netopia/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicNumber: publicNumber })
        }).then(function (res) { return res.json(); });
    }

    window.NebiPlata = { getOrderNumber: getOrderNumber, fetchStatus: fetchStatus, retryPayment: retryPayment };
})();
