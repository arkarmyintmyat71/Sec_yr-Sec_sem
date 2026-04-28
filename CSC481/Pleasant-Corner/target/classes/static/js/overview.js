/* ══════════════════════════════════════════
   PLEASANT CORNER  –  overview.js  (shared)
   Works on: dashboard.html, current_orders.html, order_history.html
   All order data is loaded from the REST API.
══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async function () {
  'use strict';

  /* ══ HAMBURGER – toggle sidebar collapse ══ */
  var sidebar      = document.getElementById('sidebar');
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  if (hamburgerBtn && sidebar) {
    hamburgerBtn.addEventListener('click', function () {
      sidebar.classList.toggle('collapsed');
    });
  }

  var PROGRESS = { pending:1, preparing:2, ready:3, served:4, completed:4, cancelled:1 };
  var TIMELINE_STEPS = ['Order Placed','Accepted by Kitchen','Preparation Started','Ready for Serving'];

  /* ══ API HELPERS ══ */
  async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  }
  async function apiPatch(url, body) {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  }

  /* ══ MODAL OPEN ══ */
  async function openOrderModal(orderId, status) {
    var overlay = document.getElementById('odOverlay');
    if (!overlay) return;

    // Show loading state
    document.getElementById('odQueueLabel').textContent = 'Loading…';
    document.getElementById('odItems').innerHTML = '<div style="padding:20px;text-align:center;color:#a8975e;">Loading order details…</div>';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    try {
      var data = await apiGet('/api/orders/' + orderId);
      var progress = PROGRESS[data.status] || 1;
      var qNum = String(data.queueNumber).padStart(3, '0');

      document.getElementById('odQueueLabel').textContent = 'Queue #' + qNum;
      document.getElementById('odMeta').innerHTML =
        'Table ' + (data.tableNumber || '–') +
        ' <span class="od-meta-dot">\u00b7</span> ' +
        (data.paymentMethod || 'Cash');

      var badge = document.getElementById('odStatusBadge');
      badge.className = 'od-status-badge ' + data.status;
      document.getElementById('odStatusText').textContent =
        data.status.charAt(0).toUpperCase() + data.status.slice(1);

      // Items
      var itemsArr = data.items || [];
      document.getElementById('odItems').innerHTML = itemsArr.length
        ? itemsArr.map(function (item) {
            var ds = (item.drinkState || '').toLowerCase();
            var tagHTML = ds === 'hot'
              ? '<span class="od-tag hot"><i class="bi bi-fire"></i> Hot</span>'
              : (ds === 'iced' || ds === 'cold')
                ? '<span class="od-tag iced"><i class="bi bi-droplet-fill"></i> Iced</span>'
                : ds
                  ? '<span class="od-tag"><i class="bi bi-cup-straw"></i> ' + item.drinkState + '</span>'
                  : '';
            var toppingHTML = item.toppings
              ? '<div class="od-item-toppings">Toppings: ' + item.toppings + '</div>'
              : '';
            var unitPrice = item.qty > 0 ? (Number(item.price) / item.qty).toFixed(0) : item.price;
            return '<div class="od-item">'
              + '<div class="od-item-left">'
              +   '<div class="od-item-name">' + item.name + '</div>'
              +   (tagHTML ? '<div class="od-item-tags">' + tagHTML + '</div>' : '')
              +   toppingHTML
              + '</div>'
              + '<div class="od-item-right">'
              +   '<div class="od-item-qty">\u00d7' + item.qty + '</div>'
              +   '<div class="od-item-price">\u0e3f' + Number(item.price) + '</div>'
              + '</div>'
              + '</div>';
          }).join('')
        : '<div style="padding:16px;color:#a8975e;font-size:.88rem;">No item details available.</div>';

      var total = Number(data.total || 0);
      document.getElementById('odTotals').innerHTML =
        '<div class="od-total-row"><span>Subtotal</span><span>\u0e3f' + total + '</span></div>' +
        '<div class="od-total-row grand"><span>Total</span><span>\u0e3f' + total + '</span></div>';

      document.getElementById('odPayment').innerHTML =
        '<div class="od-payment-icon"><i class="bi bi-' + (data.paymentMethod === 'QR' ? 'qr-code' : 'cash-coin') + '"></i></div>' +
        '<div><div class="od-payment-label">Payment: ' + (data.paymentMethod || 'Cash') + '</div>' +
        '<div class="od-payment-note">' + (data.paymentMethod === 'QR' ? 'QR payment' : 'Customer will pay at counter') + '</div></div>';

      document.getElementById('odTimeline').innerHTML = TIMELINE_STEPS.map(function (step, i) {
        var dotClass, labelClass;
        if (data.status === 'cancelled') {
          dotClass   = i === 0 ? 'done' : 'pending';
          labelClass = i === 0 ? ''     : 'pending-label';
        } else {
          dotClass   = i < progress     ? 'done'   : i === progress - 1 ? 'active'  : 'pending';
          labelClass = i < progress - 1 ? ''       : i === progress - 1 ? ''        : 'pending-label';
        }
        return '<div class="od-tl-item"><div class="od-tl-dot ' + dotClass + '"></div><div class="od-tl-label ' + labelClass + '">' + step + '</div></div>';
      }).join('');

      var actionsEl = document.getElementById('odActions');
      var btnCancel = document.getElementById('odBtnCancel');
      var btnReady  = document.getElementById('odBtnReady');
      var hideButtons = (data.status === 'served' || data.status === 'completed' || data.status === 'cancelled' || data.status === 'ready');
      if (actionsEl) actionsEl.classList.toggle('hidden', hideButtons);
      if (btnCancel) btnCancel.dataset.orderId = orderId;
      if (btnReady)  btnReady.dataset.orderId  = orderId;

    } catch (err) {
      console.error('Failed to load order detail:', err);
      document.getElementById('odItems').innerHTML = '<div style="padding:20px;text-align:center;color:#c0392b;">Could not load order details.</div>';
    }
  }

  /* ══ MODAL CLOSE ══ */
  function closeOrderModal() {
    var overlay = document.getElementById('odOverlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  var odOverlay = document.getElementById('odOverlay');
  var odClose   = document.getElementById('odClose');
  if (odClose)   odClose.addEventListener('click', closeOrderModal);
  if (odOverlay) odOverlay.addEventListener('click', function (e) {
    if (e.target === odOverlay) closeOrderModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeOrderModal();
  });

  /* ══ MODAL ACTION BUTTONS ══ */
  var odBtnCancel = document.getElementById('odBtnCancel');
  var odBtnReady  = document.getElementById('odBtnReady');

  if (odBtnCancel) {
    odBtnCancel.addEventListener('click', async function () {
      var id = this.dataset.orderId;
      if (!id || !confirm('Cancel this order?')) return;
      try {
        var updated = await apiPatch('/api/orders/' + id + '/status', { status: 'cancelled' });
        updateRowStatus(updated.id, 'cancelled');
        closeOrderModal();
      } catch (e) { alert('Could not cancel order.'); }
    });
  }

  if (odBtnReady) {
    odBtnReady.addEventListener('click', async function () {
      var id = this.dataset.orderId;
      if (!id) return;
      try {
        var updated = await apiPatch('/api/orders/' + id + '/status', { status: 'ready' });
        updateRowStatus(updated.id, 'ready');
        closeOrderModal();
      } catch (e) { alert('Could not update order status.'); }
    });
  }

  function updateRowStatus(orderId, newStatus) {
    var row = document.querySelector('tr[data-order-id="' + orderId + '"]');
    if (!row) return;
    row.dataset.status = newStatus;
    var b = row.querySelector('.badge-status');
    if (b) { b.className = 'badge-status ' + newStatus; b.textContent = newStatus; }
    if (newStatus === 'cancelled' || newStatus === 'ready') {
      var cancelBtn = row.querySelector('.action-btn.cancel');
      if (cancelBtn) cancelBtn.remove();
    }
  }

  /* ══════════════════════════════════
     CURRENT ORDERS PAGE
  ══════════════════════════════════ */
  if (document.getElementById('coBody')) {
    var coBody     = document.getElementById('coBody');
    var coTable    = document.getElementById('coTable');
    var coEmpty    = document.getElementById('coEmpty');
    var searchInput= document.getElementById('coSearchInput');

    // Load from server-injected data or fall back to API
    try {
      var activeOrders = (typeof initialOrders !== 'undefined' && initialOrders.length)
        ? initialOrders
        : await apiGet('/api/orders/active');
      renderOrderRows(coBody, activeOrders, 'current');
    } catch (e) {
      coBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#c0392b;">Could not load orders.</td></tr>';
    }

    // Search filter
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var q = this.value.toLowerCase().trim();
        var visible = 0;
        coBody.querySelectorAll('tr').forEach(function (row) {
          var text = (row.dataset.queue || '') + ' table ' + (row.dataset.table || '') + ' ' +
                     ((row.querySelector('.co-items') || {}).textContent || '');
          var match = !q || text.toLowerCase().includes(q);
          row.style.display = match ? '' : 'none';
          if (match) visible++;
        });
        if (coTable) coTable.style.display = visible ? '' : 'none';
        if (coEmpty) coEmpty.style.display  = visible ? 'none' : 'flex';
      });
    }

    // Action button delegation
    coBody.addEventListener('click', async function (e) {
      var btn = e.target.closest('.action-btn');
      if (!btn) return;
      var row     = btn.closest('tr');
      var orderId = row ? row.dataset.orderId : '';
      var status  = row ? (row.dataset.status || 'pending') : 'pending';

      if (btn.classList.contains('view')) {
        openOrderModal(orderId, status);
      }
      if (btn.classList.contains('serve')) {
        try {
          var updated = await apiPatch('/api/orders/' + orderId + '/status', { status: 'ready' });
          updateRowStatus(updated.id, 'ready');
        } catch (e) { alert('Could not update order.'); }
      }
      if (btn.classList.contains('cancel')) {
        if (!confirm('Cancel this order?')) return;
        try {
          var updated = await apiPatch('/api/orders/' + orderId + '/status', { status: 'cancelled' });
          updateRowStatus(updated.id, 'cancelled');
        } catch (e) { alert('Could not cancel order.'); }
      }
    });
  }

  /* ══════════════════════════════════
     ORDER HISTORY PAGE
  ══════════════════════════════════ */
  if (document.getElementById('ohBody')) {
    var ohBody      = document.getElementById('ohBody');
    var ohTable     = document.getElementById('ohTable');
    var ohEmpty     = document.getElementById('ohEmpty');
    var ohSearch    = document.getElementById('ohSearchInput');

    try {
      var historyOrders = (typeof initialOrders !== 'undefined' && initialOrders.length)
        ? initialOrders
        : await apiGet('/api/orders/history');
      renderOrderRows(ohBody, historyOrders, 'history');
    } catch (e) {
      ohBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#c0392b;">Could not load order history.</td></tr>';
    }

    if (ohSearch) {
      ohSearch.addEventListener('input', function () {
        var q = this.value.toLowerCase().trim();
        var visible = 0;
        ohBody.querySelectorAll('tr').forEach(function (row) {
          var text = (row.dataset.queue || '') + ' table ' + (row.dataset.table || '') + ' ' +
                     ((row.querySelector('.oh-items') || {}).textContent || '');
          var match = !q || text.toLowerCase().includes(q);
          row.style.display = match ? '' : 'none';
          if (match) visible++;
        });
        if (ohTable) ohTable.style.display = visible ? '' : 'none';
        if (ohEmpty) ohEmpty.style.display  = visible ? 'none' : 'flex';
      });
    }

    ohBody.addEventListener('click', function (e) {
      var btn = e.target.closest('.act-btn');
      if (!btn || !btn.classList.contains('view')) return;
      var row     = btn.closest('tr');
      var orderId = row ? row.dataset.orderId : '';
      var status  = row ? (row.dataset.status || 'completed') : 'completed';
      openOrderModal(orderId, status);
    });
  }

  /* ══════════════════════════════════
     DASHBOARD PAGE
  ══════════════════════════════════ */
  if (document.getElementById('page-dashboard')) {
    var scrollDownBtn = document.getElementById('scrollDownBtn');
    var lastOrder     = document.getElementById('lastOrder');
    var pageContent   = document.getElementById('page-dashboard');

    if (scrollDownBtn && lastOrder && pageContent) {
      scrollDownBtn.addEventListener('click', function () {
        lastOrder.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      pageContent.addEventListener('scroll', function () {
        var atBottom = pageContent.scrollTop + pageContent.clientHeight >= pageContent.scrollHeight - 40;
        scrollDownBtn.classList.toggle('hidden', atBottom);
      });
    }

    // Wire "Details" buttons on dashboard order cards -> open modal using order id
    document.querySelectorAll('.btn-details').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card    = this.closest('.order-card');
        var orderId = card ? card.dataset.orderId : null;
        if (orderId) openOrderModal(orderId, 'preparing');
      });
    });
  }

  /* ══ SHARED ROW BUILDER ══ */
  function renderOrderRows(tbody, orders, mode) {
    if (!orders || !orders.length) {
      var cols = mode === 'history' ? 6 : 6;
      tbody.innerHTML = '<tr><td colspan="' + cols + '" style="text-align:center;padding:30px;color:#a8975e;">No orders found.</td></tr>';
      return;
    }
    tbody.innerHTML = orders.map(function (o) {
      var qNum   = String(o.queueNumber).padStart(3, '0');
      var table  = 'Table ' + (o.tableNumber || '–');
      var items  = o.itemsLabel || '—';
      var total  = '฿' + (o.total || 0);
      var status = o.status || 'pending';

      if (mode === 'current') {
        var cancelBtn = (status === 'pending')
          ? '<button class="action-btn cancel" title="Cancel"><i class="bi bi-x-circle-fill"></i></button>'
          : '<span class="action-btn-placeholder"></span>';
        return '<tr data-order-id="' + o.id + '" data-queue="' + qNum + '" data-table="' + (o.tableNumber||'') + '" data-status="' + status + '">'
          + '<td class="co-queue">#' + qNum + '</td>'
          + '<td class="co-table-cell">' + table + '</td>'
          + '<td class="co-items">' + items + '</td>'
          + '<td class="co-total">' + total + '</td>'
          + '<td><span class="badge-status ' + status + '">' + status + '</span></td>'
          + '<td class="co-actions">'
          +   '<button class="action-btn view" title="View"><i class="bi bi-eye-fill"></i></button>'
          +   '<button class="action-btn serve" title="Advance Status"><i class="bi bi-fire"></i></button>'
          +   cancelBtn
          + '</td>'
          + '</tr>';
      } else {
        return '<tr data-order-id="' + o.id + '" data-queue="' + qNum + '" data-table="' + (o.tableNumber||'') + '" data-status="' + status + '">'
          + '<td class="oh-queue">#' + qNum + '</td>'
          + '<td class="oh-tbl">' + table + '</td>'
          + '<td class="oh-items">' + items + '</td>'
          + '<td class="oh-total">' + total + '</td>'
          + '<td class="oh-status"><span class="badge-status ' + status + '">' + status + '</span></td>'
          + '<td class="oh-action"><button class="act-btn view" title="View"><i class="bi bi-eye-fill"></i></button></td>'
          + '</tr>';
      }
    }).join('');
  }

}); /* end DOMContentLoaded */
