(function () {
    'use strict';

    var orderNumber = window.NebiPlata.getOrderNumber();
    var orderBox = document.getElementById('orderNumberBox');
    var retryBtn = document.getElementById('retryBtn');

    if (!orderNumber) {
        retryBtn.style.display = 'none';
        return;
    }

    orderBox.textContent = orderNumber;
    orderBox.style.display = 'inline-block';

    retryBtn.addEventListener('click', function () {
        retryBtn.disabled = true;
        retryBtn.textContent = 'Se reia plata…';

        window.NebiPlata.retryPayment(orderNumber).then(function (result) {
            if (result.paymentUrl) {
                window.location.href = result.paymentUrl;
                return;
            }
            window.location.href = '../esuata/?order=' + encodeURIComponent(orderNumber);
        }).catch(function () {
            window.location.href = '../esuata/?order=' + encodeURIComponent(orderNumber);
        });
    });
})();
