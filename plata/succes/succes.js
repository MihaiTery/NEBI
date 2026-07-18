(function () {
    'use strict';

    var orderNumber = window.NebiPlata.getOrderNumber();
    var titleEl = document.getElementById('statusTitle');
    var textEl = document.getElementById('statusText');
    var iconEl = document.getElementById('statusIcon');
    var orderBox = document.getElementById('orderNumberBox');
    var panel = document.getElementById('statusPanel');

    if (!orderNumber) {
        titleEl.textContent = 'Nu am găsit numărul comenzii';
        textEl.textContent = 'Verifică link-ul folosit sau contactează-ne dacă ai finalizat o plată.';
        return;
    }

    orderBox.textContent = orderNumber;
    orderBox.style.display = 'inline-block';

    window.NebiPlata.fetchStatus(orderNumber).then(function (status) {
        if (status.paymentStatus === 'paid') {
            panel.classList.add('status-success');
            iconEl.textContent = '✅';
            titleEl.textContent = 'Plată confirmată';
            textEl.textContent = 'Mulțumim! Comanda ta a fost confirmată. Fiecare achiziție contribuie la salvarea animalelor fără adăpost.';
        } else if (status.paymentStatus === 'failed' || status.paymentStatus === 'cancelled' || status.paymentStatus === 'expired') {
            iconEl.textContent = '⚠️';
            titleEl.textContent = 'Plata nu a fost confirmată încă';
            textEl.textContent = 'Poți relua plata din pagina de comandă neconfirmată.';
        } else {
            iconEl.textContent = '⏳';
            titleEl.textContent = 'Plată în curs de confirmare';
            textEl.textContent = 'Nu este nevoie să plătești din nou — confirmarea finală vine direct de la NETOPIA și poate dura câteva minute.';
        }
    }).catch(function () {
        textEl.textContent = 'Nu am putut verifica statusul acum. Reîncarcă pagina în câteva momente.';
    });
})();
