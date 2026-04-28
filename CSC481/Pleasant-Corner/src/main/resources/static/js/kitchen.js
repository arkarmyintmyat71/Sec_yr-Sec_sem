/* ============================================================
   PLEASANT CORNER KITCHEN – KDS  |  kitchen.js
   Data is server-injected via initialTickets (th:inline),
   then kept live by polling /kitchen/api/tickets every 10 s.
   Status actions call PATCH /kitchen/api/tickets/{id}/status.
   ============================================================ */

/* ── State ──────────────────────────────────────────────────── */
// Seed from server-injected data (same pattern as staff.js)
var tickets = (typeof initialTickets !== 'undefined' && Array.isArray(initialTickets))
  ? initialTickets
  : [];

/* ── Helpers ─────────────────────────────────────────────────── */
function pad(n) { return String(n).padStart(2, '0'); }

function formatElapsed(sec) {
  var m = Math.floor(sec / 60);
  var s = sec % 60;
  return m + ':' + pad(s) + ' ago';
}

function elapsedClass(ticket) {
  if (ticket.urgent || ticket.elapsedSec > 600) return 'urgent';
  return ticket.status;
}

function statusLabel(ticket) {
  if (ticket.urgent) return '⚡ URGENT';
  var map = { pending: 'PENDING', preparing: 'PREPARING', ready: '✓ READY' };
  return map[ticket.status] || ticket.status;
}

function actionButton(ticket) {
  if (ticket.status === 'pending')
    return '<button class="btn btn-start" data-id="' + ticket.id + '" data-action="start">Start Prep</button>';
  if (ticket.status === 'preparing')
    return '<button class="btn btn-ready" data-id="' + ticket.id + '" data-action="ready">Mark Ready</button>';
  if (ticket.status === 'ready')
    return '<button class="btn btn-complete" data-id="' + ticket.id + '" data-action="complete">Complete</button>';
  return '';
}

/* ── Render ──────────────────────────────────────────────────── */
function renderTicket(ticket) {
  var statusClass = elapsedClass(ticket);

  var itemsHTML = (ticket.items || []).map(function(item) {
    return '<div class="order-item">'
      + '<span class="item-qty">' + item.qty + '×</span>'
      + '<div class="item-info">'
      +   '<div class="item-name">' + item.name + '</div>'
      +   (item.mods ? '<div class="item-mods">' + item.mods + '</div>' : '')
      + '</div>'
      + '</div>';
  }).join('');

  return '<div class="ticket ' + statusClass + '" id="ticket-' + ticket.id + '">'
    + '<div class="ticket-header">'
    +   '<div class="table-info">'
    +     '<div class="table-name">' + ticket.table + '</div>'
    +   '</div>'
    +   '<div class="ticket-meta">'
    +     '<div class="queue-number">' + ticket.queue + '</div>'
    +     '<div class="status-badge">' + statusLabel(ticket) + '</div>'
    +   '</div>'
    + '</div>'
    + '<div class="order-items">' + itemsHTML + '</div>'
    + '<hr class="ticket-divider"/>'
    + '<div class="ticket-footer">'
    +   '<span class="elapsed-time" data-id="' + ticket.id + '">' + formatElapsed(ticket.elapsedSec) + '</span>'
    +   actionButton(ticket)
    + '</div>'
    + '</div>';
}

function renderAll() {
  var grid = document.getElementById('ticket-grid');
  if (!tickets.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px 0;color:#555;font-family:\'Space Mono\',monospace;font-size:14px;">No active orders right now.<br><span style="font-size:11px;color:#333;margin-top:8px;display:block;">Waiting for new tickets…</span></div>';
    return;
  }
  grid.innerHTML = tickets.map(renderTicket).join('');
  attachListeners();
}

/* ── Button actions → API call → update local state ─────────── */
function attachListeners() {
  document.querySelectorAll('[data-action]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id     = btn.dataset.id;
      var action = btn.dataset.action;

      var statusMap = { start: 'preparing', ready: 'ready', complete: 'completed' };
      var newStatus = statusMap[action];
      if (!newStatus) return;

      // Optimistic UI update
      if (action === 'complete') {
        tickets = tickets.filter(function(t) { return String(t.id) !== String(id); });
        renderAll();
      } else {
        var ticket = tickets.find(function(t) { return String(t.id) === String(id); });
        if (ticket) {
          ticket.status = newStatus;
          ticket.urgent = false;
          renderAll();
        }
      }

      // Persist to backend
      fetch('/kitchen/api/tickets/' + id + '/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      }).catch(function(err) {
        console.error('Failed to update ticket status:', err);
      });
    });
  });
}

/* ── Poll backend every 10 s for new orders ──────────────────── */
function pollTickets() {
  fetch('/kitchen/api/tickets')
    .then(function(r) { return r.json(); })
    .then(function(fresh) {
      // Merge: preserve local elapsedSec increments for existing tickets
      // but add new ones and remove completed ones
      var existingIds = tickets.map(function(t) { return String(t.id); });
      var freshIds    = fresh.map(function(t) { return String(t.id); });

      // Add brand-new tickets
      fresh.forEach(function(t) {
        if (!existingIds.includes(String(t.id))) {
          tickets.push(t);
        }
      });

      // Remove tickets no longer active (completed/cancelled server-side)
      tickets = tickets.filter(function(t) {
        return freshIds.includes(String(t.id));
      });

      renderAll();
    })
    .catch(function(err) {
      console.warn('Poll failed:', err);
    });
}

/* ── Live clock ──────────────────────────────────────────────── */
function updateClock() {
  var now = new Date();
  var h = pad(now.getHours());
  var m = pad(now.getMinutes());
  var s = pad(now.getSeconds());
  document.getElementById('clock').textContent = h + ':' + m + ':' + s;

  var opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('date-display').textContent = now.toLocaleDateString('en-US', opts);
}

/* ── Elapsed timer tick ──────────────────────────────────────── */
function tickElapsed() {
  var needsRerender = false;
  tickets.forEach(function(ticket) {
    ticket.elapsedSec++;

    // After 10 min preparing → auto-urgent, full re-render
    if (ticket.status === 'preparing' && ticket.elapsedSec >= 600 && !ticket.urgent) {
      ticket.urgent = true;
      needsRerender = true;
    }
  });

  if (needsRerender) {
    renderAll();
    return;
  }

  // Otherwise just update the elapsed label in-place (no full re-render flicker)
  tickets.forEach(function(ticket) {
    var el = document.querySelector('.elapsed-time[data-id="' + ticket.id + '"]');
    if (el) el.textContent = formatElapsed(ticket.elapsedSec);
  });
}

/* ── Init ────────────────────────────────────────────────────── */
updateClock();
renderAll();
setInterval(updateClock,  1000);   // clock every second
setInterval(tickElapsed,  1000);   // elapsed timer every second
setInterval(pollTickets, 10000);   // poll backend every 10 seconds
