(function () {
    'use strict';

    var orderNumber = window.NebiPlata.getOrderNumber();
    var orderBox = document.getElementById('orderNumberBox');
    var retryBtn = document.getElementById('retryBtn');
    var textEl = document.getElementById('statusText');

    if (!orderNumber) {
        retryBtn.disabled = true;
        textEl.textContent = 'Nu am găsit numărul comenzii. Contactează-ne pentru a relua plata.';
        return;
    }

    orderBox.textContent = orderNumber;
    orderBox.style.display = 'inline-block';

    retryBtn.addEventListener('click', function () {
        retryBtn.disabled = true;
        textEl.textContent = 'Se reia plata…';

        window.NebiPlata.retryPayment(orderNumber).then(function (result) {
            if (result.disabled) {
                textEl.textContent = result.message || 'Plata online nu este încă activă.';
                retryBtn.disabled = false;
                return;
            }
            if (result.paymentUrl) {
                window.location.href = result.paymentUrl;
                return;
            }
            textEl.textContent = 'Reluarea plății nu a reușit. Te rugăm să încerci din nou sau să ne contactezi.';
            retryBtn.disabled = false;
        }).catch(function () {
            textEl.textContent = 'A apărut o problemă de rețea. Încearcă din nou.';
            retryBtn.disabled = false;
        });
    });
})();
