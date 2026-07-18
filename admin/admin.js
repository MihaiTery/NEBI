(function () {
    'use strict';

    var loginView = document.getElementById('loginView');
    var dashboardView = document.getElementById('dashboardView');
    var logoutBtn = document.getElementById('logoutBtn');

    function api(path, options) {
        options = options || {};
        options.credentials = 'same-origin';
        options.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
        return fetch('/api/admin' + path, options).then(function (res) {
            if (res.status === 401) {
                showLogin();
                throw new Error('unauthenticated');
            }
            return res.json().then(function (body) {
                if (!res.ok) throw Object.assign(new Error(body.error || 'request-failed'), { body: body });
                return body;
            });
        });
    }

    function showLogin() {
        loginView.style.display = 'block';
        dashboardView.style.display = 'none';
        logoutBtn.style.display = 'none';
    }

    function showDashboard() {
        loginView.style.display = 'none';
        dashboardView.style.display = 'block';
        logoutBtn.style.display = 'inline-flex';
        loadOrders();
    }

    // --- Boot: check session ---
    api('/me').then(showDashboard).catch(function () { showLogin(); });

    // --- Login ---
    var loginForm = document.getElementById('loginForm');
    var loginError = document.getElementById('loginError');
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        loginError.classList.remove('visible');

        api('/login', {
            method: 'POST',
            body: JSON.stringify({
                username: document.getElementById('loginUsername').value,
                password: document.getElementById('loginPassword').value
            })
        }).then(showDashboard).catch(function (err) {
            loginError.textContent = (err.body && err.body.error) || 'Autentificare eșuată.';
            loginError.classList.add('visible');
        });
    });

    logoutBtn.addEventListener('click', function () {
        api('/logout', { method: 'POST' }).finally(showLogin);
    });

    // --- Orders list ---
    var tbody = document.getElementById('ordersTableBody');
    var emptyState = document.getElementById('ordersEmptyState');
    var orderDetail = document.getElementById('orderDetail');
    var dashboardListParts = ['dashboardView']; // just for readability

    function currentFilters() {
        var params = new URLSearchParams();
        var search = document.getElementById('filterSearch').value.trim();
        var paymentStatus = document.getElementById('filterPaymentStatus').value;
        var orderStatus = document.getElementById('filterOrderStatus').value;
        var shippingStatus = document.getElementById('filterShippingStatus').value;
        var sortDir = document.getElementById('filterSort').value;
        if (search) params.set('search', search);
        if (paymentStatus) params.set('paymentStatus', paymentStatus);
        if (orderStatus) params.set('orderStatus', orderStatus);
        if (shippingStatus) params.set('shippingStatus', shippingStatus);
        params.set('sortDir', sortDir);
        return params;
    }

    function formatMoney(bani, currency) {
        return (bani / 100).toLocaleString('ro-RO') + ' ' + (currency || 'RON');
    }

    function badge(status) {
        return '<span class="admin-badge status-' + status + '">' + status + '</span>';
    }

    function loadOrders() {
        var params = currentFilters();
        api('/orders?' + params.toString()).then(function (data) {
            tbody.innerHTML = '';
            emptyState.style.display = data.orders.length === 0 ? 'block' : 'none';
            data.orders.forEach(function (o) {
                var tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.innerHTML =
                    '<td>' + o.publicNumber + '</td>' +
                    '<td>' + new Date(o.createdAt).toLocaleString('ro-RO') + '</td>' +
                    '<td>' + escapeHtml(o.customerName || o.customerEmail) + '</td>' +
                    '<td>' + formatMoney(o.totalBani, o.currency) + '</td>' +
                    '<td>' + badge(o.paymentStatus) + '</td>' +
                    '<td>' + badge(o.orderStatus) + '</td>' +
                    '<td>' + badge(o.shippingStatus) + '</td>';
                tr.addEventListener('click', function () { openOrder(o.publicNumber); });
                tbody.appendChild(tr);
            });
        }).catch(function () { /* handled by api() (redirect to login) or transient error */ });
    }

    document.getElementById('applyFiltersBtn').addEventListener('click', loadOrders);
    document.getElementById('exportCsvLink').addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = '/api/admin/orders/export.csv?' + currentFilters().toString();
    });

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str == null ? '' : String(str);
        return div.innerHTML;
    }

    // --- Order detail ---
    var currentOrderNumber = null;

    function openOrder(publicNumber) {
        currentOrderNumber = publicNumber;
        api('/orders/' + encodeURIComponent(publicNumber)).then(function (data) {
            renderDetail(data);
            orderDetail.style.display = 'block';
            orderDetail.scrollIntoView({ behavior: 'smooth' });
        });
    }

    document.getElementById('closeDetailBtn').addEventListener('click', function () {
        orderDetail.style.display = 'none';
        currentOrderNumber = null;
    });

    function renderDetail(data) {
        var o = data.order;
        document.getElementById('detailTitle').textContent = 'Comanda ' + o.public_number;

        var customerName = o.customer_type === 'company'
            ? o.customer_company_name
            : (o.customer_first_name || '') + ' ' + (o.customer_last_name || '');

        var itemsHtml = data.items.map(function (i) {
            return i.quantity + '× ' + escapeHtml(i.name_snapshot) + ' (' + formatMoney(i.line_total_bani, o.currency) + ')';
        }).join('<br>');

        var infoRows = [
            ['Tip client', o.customer_type], ['Nume/Firmă', customerName],
            ['Email', o.customer_email], ['Telefon', o.customer_phone],
            ['Adresă livrare', [o.shipping_address, o.shipping_city, o.shipping_county, o.shipping_postal_code].filter(Boolean).join(', ')],
            ['Facturare = livrare', o.billing_same_as_shipping ? 'da' : 'nu'],
            ['Date facturare', o.billing_same_as_shipping ? '—' : [o.billing_company_name, o.billing_cui, o.billing_address, o.billing_city, o.billing_county, o.billing_postal_code].filter(Boolean).join(', ')],
            ['Configurație', itemsHtml],
            ['Total', formatMoney(o.total_bani, o.currency)],
            ['Status plată', badge(o.payment_status)], ['Status comandă', badge(o.order_status)], ['Status livrare', badge(o.shipping_status)],
            ['Curier', o.carrier], ['AWB', o.awb || '—'], ['Tracking', o.tracking_url ? ('<a href="' + o.tracking_url + '" target="_blank" rel="noopener">' + o.tracking_url + '</a>') : '—'],
            ['Note', escapeHtml(o.notes || '—')],
            ['Termeni acceptați', 'v' + o.terms_version + ' / v' + o.refund_policy_version + ' la ' + new Date(o.consent_accepted_at).toLocaleString('ro-RO')],
            ['Creat', new Date(o.created_at).toLocaleString('ro-RO')],
            ['Plătit', o.paid_at ? new Date(o.paid_at).toLocaleString('ro-RO') : '—']
        ];
        document.getElementById('detailInfo').innerHTML = infoRows.map(function (r) {
            return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>';
        }).join('');

        document.getElementById('editOrderStatus').value = o.order_status;
        document.getElementById('editShippingStatus').value = o.shipping_status;
        document.getElementById('editAwb').value = o.awb || '';
        document.getElementById('editTrackingUrl').value = o.tracking_url || '';
        document.getElementById('editNotes').value = o.notes || '';

        document.getElementById('paymentsTableBody').innerHTML = data.payments.map(function (p) {
            return '<tr><td>' + p.provider + '</td><td>' + (p.external_transaction_id || '—') + '</td><td>' + badge(p.status) + '</td><td>' + formatMoney(p.amount_bani, p.currency) + '</td><td>' + new Date(p.initiated_at).toLocaleString('ro-RO') + '</td></tr>';
        }).join('') || '<tr><td colspan="5">Nicio plată înregistrată.</td></tr>';

        document.getElementById('auditTableBody').innerHTML = data.auditEntries.map(function (a) {
            return '<tr><td>' + new Date(a.created_at).toLocaleString('ro-RO') + '</td><td>' + escapeHtml(a.admin_username) + '</td><td>' + a.action + '</td><td>' + escapeHtml((a.new_value_json || '').slice(0, 200)) + '</td></tr>';
        }).join('') || '<tr><td colspan="4">Niciun eveniment.</td></tr>';
    }

    document.getElementById('updateForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var statusEl = document.getElementById('updateStatus');
        statusEl.textContent = 'Se salvează…';

        api('/orders/' + encodeURIComponent(currentOrderNumber), {
            method: 'PATCH',
            body: JSON.stringify({
                orderStatus: document.getElementById('editOrderStatus').value,
                shippingStatus: document.getElementById('editShippingStatus').value,
                awb: document.getElementById('editAwb').value,
                trackingUrl: document.getElementById('editTrackingUrl').value,
                notes: document.getElementById('editNotes').value
            })
        }).then(function () {
            statusEl.textContent = 'Salvat.';
            openOrder(currentOrderNumber);
            loadOrders();
        }).catch(function (err) {
            statusEl.textContent = (err.body && err.body.error) || 'Eroare la salvare.';
        });
    });

    document.getElementById('markPaidForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var statusEl = document.getElementById('markPaidStatus');
        var reason = document.getElementById('markPaidReason').value;
        statusEl.textContent = 'Se procesează…';

        api('/orders/' + encodeURIComponent(currentOrderNumber) + '/mark-paid-manually', {
            method: 'POST',
            body: JSON.stringify({ reason: reason })
        }).then(function () {
            statusEl.textContent = 'Marcată ca plătită.';
            document.getElementById('markPaidReason').value = '';
            openOrder(currentOrderNumber);
            loadOrders();
        }).catch(function (err) {
            statusEl.textContent = (err.body && err.body.error) || 'Eroare.';
        });
    });
})();
