/* ================================================================
   Pleasant Corner — customer/app.js
   Navigation · Menu · Cart · Checkout · Order tracking
   Wired to real backend via /customer/api/orders
   ================================================================ */

'use strict';

/* ── State ────────────────────────────────────────────────────── */
const TABLE    = (typeof BACKEND_TABLE !== 'undefined') ? BACKEND_TABLE : { tableNumber: 0 };
const TABLE_NO = TABLE.tableNumber;

let placedOrderId    = null;  // set after successful order placement
let trackingInterval = null;
let activeCategory   = 'ALL';

/* ── Navigation ───────────────────────────────────────────────── */
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(screenId);
  if (el) el.classList.add('active');
}

/** Routes back to the correct home screen based on table occupancy */
function goHome() {
  const returning = document.getElementById('screen-returning');
  // If the returning screen exists and the table was occupied when page loaded,
  // go back to returning screen; otherwise go to welcome screen.
  const isOccupied = returning && returning.classList.contains('_was_active');
  goTo(isOccupied ? 'screen-returning' : 'screen-welcome');
}

/* ── Sidebar ──────────────────────────────────────────────────── */
function toggleSidebar() { document.getElementById('sidebar-overlay').classList.toggle('open'); }
function closeSidebar()  { document.getElementById('sidebar-overlay').classList.remove('open'); }

/* ── Menu Grid ────────────────────────────────────────────────── */
function renderMenuGrid() {
  const grid = document.getElementById('menuGrid');
  const q    = (document.getElementById('menu-search').value || '').toLowerCase().trim();

  const visible = MENU_ITEMS.filter(m => {
    const matchCat  = activeCategory === 'ALL' || m.category === activeCategory;
    const matchName = !q || m.name.toLowerCase().includes(q);
    return matchCat && matchName;
  });

  if (!visible.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:#9e8c6a;font-style:italic;">No items found.</div>';
    return;
  }

  grid.innerHTML = visible.map(m => {
    const imgContent = m.imageUrl
      ? `<img src="${m.imageUrl}" alt="${m.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;"/>`
      : m.emoji;
    return `
    <button class="menu-card" data-name="${m.name.toLowerCase()}"
            onclick="openItemDetail('${m.id}')">
      <div class="menu-card-img">${imgContent}</div>
      <div class="menu-card-name">${m.name}</div>
    </button>`;
  }).join('');
}

function filterByCategory(cat) {
  activeCategory = cat;
  renderMenuGrid();
}

/* ── Item Detail ──────────────────────────────────────────────── */
let detailItem      = null;
let detailQty       = 1;
let selectedToppings = new Set(); // supports up to 2 for food, 1 for drinks

function openItemDetail(itemId) {
  detailItem       = MENU_ITEMS.find(m => m.id === itemId || m.id === String(itemId));
  detailQty        = 1;
  selectedToppings = new Set();
  if (!detailItem) return;
  renderDetailScreen();
  goTo('screen-detail');
}

function renderDetailScreen() {
  if (!detailItem) return;
  document.getElementById('detail-title').textContent =
    `${detailItem.name} \u2013 \u0e3f${detailItem.price}`;
  // Show real photo if available, else emoji
  const heroCircle = document.getElementById('detail-img-circle');
  if (heroCircle) {
    if (detailItem.imageUrl) {
      heroCircle.innerHTML = `<img src="${detailItem.imageUrl}" alt="${detailItem.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;"/>`;
    } else {
      heroCircle.innerHTML = `<span id="detail-emoji">${detailItem.emoji}</span>`;
    }
  }
  document.getElementById('detail-qty').textContent = detailQty;
  document.getElementById('detail-note').value      = '';

  const list = document.getElementById('toppings-list');
  list.innerHTML = '';

  const isDrink = detailItem.itemType === 'DRINK';
  const options = isDrink
    ? (detailItem.drinkStates || [])
    : (detailItem.toppings    || []);

  const toppingBadge = document.querySelector('.topping-badge');
  const toppingHint  = document.querySelector('.topping-hint');
  if (toppingBadge) toppingBadge.textContent = isDrink ? 'Temperature' : 'Topping';
  if (toppingHint)  toppingHint.textContent  = isDrink ? '(Select one option.)' : '(Select up to two options.)';

  options.forEach(function(opt) {
    const price = Number(opt.priceAdjustment || opt.price || 0);
    const row   = document.createElement('div');
    row.className = 'topping-option';
    row.innerHTML =
      '<div class="topping-radio" id="radio-' + opt.id + '"></div>' +
      '<span class="topping-name">' + (opt.emoji ? opt.emoji + ' ' : '') + opt.name + '</span>' +
      '<span class="topping-price">' + (price > 0 ? '+\u0e3f' + price : 'Free') + '</span>';
    row.addEventListener('click', function() { selectTopping(opt.id, isDrink); });
    list.appendChild(row);
  });

  if (!options.length) {
    list.innerHTML = '<div style="color:#9e8c6a;font-style:italic;padding:8px 0;font-size:.9rem;">No options available for this item.</div>';
  }
}

function selectTopping(toppingId, isDrink) {
  const MAX = isDrink ? 1 : 2;  // drinks: 1 temperature; food: up to 2 toppings

  if (selectedToppings.has(toppingId)) {
    selectedToppings.delete(toppingId);
  } else {
    if (selectedToppings.size >= MAX) {
      // Replace oldest selection
      const first = selectedToppings.values().next().value;
      selectedToppings.delete(first);
      const oldRadio = document.getElementById('radio-' + first);
      if (oldRadio) oldRadio.classList.remove('selected');
    }
    selectedToppings.add(toppingId);
  }

  // Sync all radio visuals
  document.querySelectorAll('.topping-radio').forEach(el => el.classList.remove('selected'));
  selectedToppings.forEach(function(id) {
    const radio = document.getElementById('radio-' + id);
    if (radio) radio.classList.add('selected');
  });
}

function changeDetailQty(delta) {
  detailQty = Math.max(1, detailQty + delta);
  document.getElementById('detail-qty').textContent = detailQty;
}

function addItemToCart() {
  const note    = document.getElementById('detail-note').value.trim();
  const isDrink = detailItem.itemType === 'DRINK';
  const optionsList = isDrink ? (detailItem.drinkStates || []) : (detailItem.toppings || []);

  // Collect all selected options
  const selectedOpts = optionsList.filter(o => selectedToppings.has(o.id));

  // Sum all selected option price adjustments
  const optionPrice  = selectedOpts.reduce((sum, o) => sum + Number(o.priceAdjustment || 0), 0);
  const unitPrice    = detailItem.price + optionPrice;

  const toppingNames   = (!isDrink) ? selectedOpts.map(o => o.name) : [];
  const drinkStateName = (isDrink && selectedOpts.length) ? selectedOpts[0].name : '';

  cart.add({
    itemId:      detailItem.id,
    backendId:   detailItem.backendId,
    name:        detailItem.name,
    emoji:       detailItem.emoji,
    basePrice:   detailItem.price,
    price:       unitPrice,
    toppings:    toppingNames,
    drinkState:  drinkStateName,
    optionLabel: selectedOpts.map(o => o.name).join(', '),
    optionPrice,
    note,
    qty:         detailQty,
  });


  renderCartScreen();
  goTo('screen-cart');
}

/* ── Cart Screen ──────────────────────────────────────────────── */
function renderCartScreen() {
  const listEl = document.getElementById('cart-items-list');
  listEl.innerHTML = '';

  if (cart.items.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center;padding:40px 0;color:#a08060;font-style:italic;">
        Your cart is empty.<br>Browse the menu to add items!
      </div>`;
  } else {
    cart.items.forEach((item, index) => {
      // Build sub-label: drinkState or toppings
      const subLabel = item.drinkState
        ? item.drinkState
        : (item.toppings && item.toppings.length ? item.toppings.join(', ') : '');
      const optExtra = item.optionPrice > 0
        ? ` <span style="font-size:.78rem;color:#b8923a;">(+฿${item.optionPrice})</span>` : '';
      const sub = subLabel
        ? `<div class="cart-item-sub">${subLabel}${optExtra}</div>` : '';

      const card = document.createElement('div');
      card.className = 'cart-item-card';
      card.innerHTML = `
        <div class="cart-item-top">
          <div>
            <div class="cart-item-name">
              ${item.name}<span class="cart-item-qty-label">x${item.qty}</span>
            </div>
            ${sub}
          </div>
          <div class="cart-item-price">฿${(item.price * item.qty).toFixed(0)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="cart-qty-btn" onclick="cartChangeQty(${index}, 1)">+</button>
          <span   class="cart-qty-num">${item.qty}</span>
          <button class="cart-qty-btn" onclick="cartChangeQty(${index}, -1)">−</button>
          <button class="cart-delete-btn" onclick="cartRemove(${index})" title="Remove">
            <svg viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>`;
      listEl.appendChild(card);
    });
  }

  // Show subtotal, discount, and grand total
  const subtotal    = cart.subtotal;
  const discAmt     = cart.discountAmount;
  const grandTotal  = cart.total;

  let totalHtml = '';
  if (discAmt > 0) {
    totalHtml = `
      <div class="cart-total-row" style="font-size:.85rem;color:#7a6535;">
        <span>Subtotal</span><span>฿${subtotal.toFixed(0)}</span>
      </div>
      <div class="cart-total-row" style="font-size:.85rem;color:#16a34a;">
        <span>Discount (${cart.discountCode})</span><span>−฿${discAmt.toFixed(0)}</span>
      </div>
      <div class="cart-total-row">
        <span class="cart-total-label">Total</span>
        <span class="cart-total-price" id="cart-total-price">฿${grandTotal.toFixed(0)}</span>
      </div>`;
  } else {
    totalHtml = `
      <div class="cart-total-row">
        <span class="cart-total-label">Total</span>
        <span class="cart-total-price" id="cart-total-price">฿${grandTotal.toFixed(0)}</span>
      </div>`;
  }

  // Discount code — dropdown of active codes + manual entry
  const activeCodes = (window._activeDiscounts || []).filter(d => !d.autoApply);
  const dropdownOptions = activeCodes.map(d => {
    const valStr = d.discountType === 'percent' ? d.value + '% off'
                 : d.discountType === 'fixed'   ? '฿' + d.value + ' off'
                 : 'Free item';
    const label = `${d.code} — ${d.name || d.code} (${valStr})`;
    const sel   = cart.discountCode === d.code ? 'selected' : '';
    return `<option value="${d.code}" ${sel}>${label}</option>`;
  }).join('');

  const discountHtml = `
    <div class="cart-discount-row" style="margin-top:10px;">
      <div style="font-size:.82rem;color:#7a6535;margin-bottom:6px;font-weight:600;">Discount Code</div>
      ${activeCodes.length ? `
      <select id="discountDropdown" onchange="pickDiscountFromDropdown(this.value)"
        style="width:100%;padding:9px 12px;border:1.5px solid #d6c499;border-radius:8px;
               font-size:.85rem;background:#fdf9f2;color:#2c2009;margin-bottom:8px;
               appearance:none;-webkit-appearance:none;cursor:pointer;">
        <option value="">— Select a promo code —</option>
        ${dropdownOptions}
      </select>` : ''}
      <div style="display:flex;gap:8px;">
        <input id="discountCodeInput" type="text" placeholder="Or type a code manually"
          value="${cart.discountCode || ''}"
          style="flex:1;padding:9px 12px;border:1.5px solid #d6c499;border-radius:8px;
                 font-size:.88rem;background:#fdf9f2;color:#2c2009;"/>
        <button onclick="applyDiscount()"
          style="padding:9px 16px;background:#2c2009;color:#e8c96a;border:none;border-radius:8px;
                 font-size:.84rem;font-weight:600;cursor:pointer;">
          Apply
        </button>
      </div>
      <div id="discountMsg" style="font-size:.78rem;margin-top:5px;${cart.discountCode ? 'color:#16a34a;' : 'color:#c0392b;display:none;'}">
        ${cart.discountCode ? '✓ Discount applied!' : ''}
      </div>
    </div>`;

  const totalCard = document.querySelector('#screen-cart .cart-total-card');
  if (totalCard) {
    totalCard.innerHTML = totalHtml + discountHtml +
      `<div class="cart-note-label">Order note (Optional)</div>
       <textarea class="cart-note-input" id="cart-note" placeholder="e.g. No ice, extra sauce..."></textarea>`;
  }

  updateCartBadge();
}

function cartChangeQty(index, delta) { cart.updateQty(index, delta); renderCartScreen(); }
function cartRemove(index)           { cart.remove(index);            renderCartScreen(); }

/* ── Cart Badge ───────────────────────────────────────────────── */
function updateCartBadge() {
  document.querySelectorAll('.cart-badge').forEach(badge => {
    badge.textContent = cart.count;
    badge.classList.toggle('visible', cart.count > 0);
  });
}

/* ── Checkout Screen ──────────────────────────────────────────── */
let selectedPaymentMethod = 'Cash';

function openCheckout() {
  selectedPaymentMethod = 'Cash';
  renderCheckoutScreen();
  goTo('screen-checkout');
}

function renderCheckoutScreen() {
  const summaryList = document.getElementById('checkout-summary-rows');
  summaryList.innerHTML = '';
  cart.items.forEach(item => {
    const subLabel = item.drinkState
      ? item.drinkState
      : (item.toppings && item.toppings.length ? item.toppings.join(', ') : '');
    const sub = subLabel ? `<div class="summary-item-sub">${subLabel}</div>` : '';
    const row = document.createElement('div');
    row.className = 'summary-row';
    row.innerHTML = `
      <div class="summary-item-info">
        <div class="summary-item-name">${item.name}</div>${sub}
      </div>
      <span class="summary-qty">x${item.qty}</span>
      <span class="summary-price">฿${(item.price * item.qty).toFixed(0)}</span>`;
    summaryList.appendChild(row);
  });

  // Show subtotal + discount + total
  const subtotal   = cart.subtotal;
  const discAmt    = cart.discountAmount;
  const grandTotal = cart.total;
  const totalEl    = document.getElementById('checkout-total-price');

  // Remove old breakdown rows if any
  document.querySelectorAll('.checkout-breakdown-row').forEach(el => el.remove());
  const summaryCard = summaryList.closest('.summary-card');
  const divider     = summaryCard ? summaryCard.querySelector('.summary-divider') : null;

  if (discAmt > 0 && divider) {
    const subtotalRow = document.createElement('div');
    subtotalRow.className = 'summary-total-row checkout-breakdown-row';
    subtotalRow.style.cssText = 'font-size:.82rem;color:#7a6535;padding:4px 0;';
    subtotalRow.innerHTML = `<span>Subtotal</span><span>฿${subtotal.toFixed(0)}</span>`;
    divider.parentNode.insertBefore(subtotalRow, divider.nextSibling);

    const discRow = document.createElement('div');
    discRow.className = 'summary-total-row checkout-breakdown-row';
    discRow.style.cssText = 'font-size:.82rem;color:#16a34a;padding:4px 0;';
    discRow.innerHTML = `<span>Discount (${cart.discountCode})</span><span>−฿${discAmt.toFixed(0)}</span>`;
    subtotalRow.after(discRow);
  }

  if (totalEl) totalEl.textContent = `฿${grandTotal.toFixed(0)}`;
  document.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.method === selectedPaymentMethod);
  });
}

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  document.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.method === method);
  });
}

/* ── Confirm Order → POST to backend ─────────────────────────── */
async function confirmOrder() {
  const btn = document.getElementById('confirmOrderBtn');
  btn.disabled = true;
  btn.textContent = 'Placing order…';

  // Build order items — send drinkState and toppingsNote from cart
  const items = cart.items.map(i => ({
    menuItemId:   i.backendId,
    quantity:     i.qty,
    drinkState:   i.drinkState  || '',
    toppingsNote: (i.toppings && i.toppings.length) ? i.toppings.join(', ') : ''
  }));

  try {
    const res = await fetch('/customer/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableNumber:   TABLE_NO,
        paymentMethod: selectedPaymentMethod,
        discountCode:  cart.discountCode || null,
        items
      })
    });

    if (!res.ok) {
      const err = await res.json();
      alert('Could not place order: ' + (err.error || res.status));
      btn.disabled = false;
      btn.textContent = 'Confirm order';
      return;
    }

    const data = await res.json();
    placedOrderId = data.orderId;

    // Reset button for next time
    btn.disabled = false;
    btn.textContent = 'Confirm order';

    if (selectedPaymentMethod === 'QR') {
      renderPaymentScreen(data);
      goTo('screen-payment');
    } else {
      renderOrderDetailScreen(data);
      startTracking(data.orderId);
      goTo('screen-order-detail');
    }
  } catch (err) {
    alert('Network error. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Confirm order';
  }
}

/* ── QR Payment Screen ────────────────────────────────────────── */
let qrTimerInterval = null;
let placedOrderData  = null;  // store full server response for paymentDone

function renderPaymentScreen(orderData) {
  placedOrderData = orderData;
  const queueNum  = String(orderData.queueNumber).padStart(3, '0');
  const itemCount = cart.count;
  const total     = Number(orderData.total || cart.total);

  document.getElementById('payment-queue-number').textContent = '#' + queueNum;
  document.getElementById('payment-queue-meta').textContent =
    'Table ' + TABLE_NO + ' · ' + itemCount + ' item' + (itemCount !== 1 ? 's' : '') + ' · ฿' + total.toFixed(0);
  document.getElementById('payment-qr-amount').textContent = '฿' + total.toFixed(0);

  // Show the payment QR image from backend (uploaded by admin in Payments page)
  const qrBox = document.getElementById('paymentQrBox');
  if (PAYMENT_QR_DATA_URL && PAYMENT_QR_DATA_URL.startsWith('data:')) {
    qrBox.innerHTML = `<img src="${PAYMENT_QR_DATA_URL}" alt="PromptPay QR"
      style="width:100%;max-width:200px;border-radius:8px;display:block;margin:0 auto;"/>`;
  } else {
    qrBox.innerHTML = `<div style="padding:20px;color:#9e8c6a;font-size:.85rem;text-align:center;">
      No payment QR uploaded yet.<br>Please pay at the counter.
    </div>`;
  }

  startQrTimer();
}

function startQrTimer() {
  if (qrTimerInterval) clearInterval(qrTimerInterval);
  let remaining = 5 * 60;
  function tick() {
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    const el = document.getElementById('qr-timer');
    if (el) el.textContent = `${m}:${s}`;
    if (--remaining < 0) clearInterval(qrTimerInterval);
  }
  tick();
  qrTimerInterval = setInterval(tick, 1000);
}

async function paymentDone() {
  if (qrTimerInterval) { clearInterval(qrTimerInterval); qrTimerInterval = null; }

  if (placedOrderId) {
    // Confirm QR payment → backend marks payment record as completed
    try {
      await fetch('/customer/api/payments/' + placedOrderId + '/confirm', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({})
      });
    } catch (e) { /* non-blocking */ }

    const serverTotal = placedOrderData ? Number(placedOrderData.total) : cart.total;
    renderOrderDetailScreen({
      queueNumber: placedOrderData ? placedOrderData.queueNumber : 0,
      total:       serverTotal
    });
    startTracking(placedOrderId);
  }
  goTo('screen-order-detail');
}

/* ── Order Detail / Tracking Screen ──────────────────────────── */
function renderOrderDetailScreen(orderData) {
  const queueNum = String(orderData.queueNumber || 0).padStart(3, '0');
  document.getElementById('trackTableName').textContent = 'Table ' + TABLE_NO;
  document.getElementById('trackQueueTag').textContent  = '#' + queueNum;

  const list = document.getElementById('order-detail-lines');
  list.innerHTML = '';

  // Use server items if available, else fall back to cart
  const sourceItems = (orderData.items && orderData.items.length)
    ? orderData.items.map(i => ({
        name:      i.name,
        qty:       i.qty || i.quantity || 1,
        lineTotal: Number(i.lineTotal || 0),
        drinkState: i.drinkState || '',
        toppings:  i.toppings || ''
      }))
    : cart.items.map(i => ({
        name:      i.name,
        qty:       i.qty,
        lineTotal: i.price * i.qty,
        drinkState: i.drinkState || '',
        toppings:  (i.toppings || []).join(', ')
      }));

  sourceItems.forEach(item => {
    const sub = (item.drinkState || item.toppings)
      ? `<div style="font-size:.75rem;color:#9e8c6a;margin-top:2px;">${item.drinkState || item.toppings}</div>` : '';
    const row = document.createElement('div');
    row.className = 'order-line-item';
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#fff;border-radius:12px;margin-bottom:8px;';
    row.innerHTML = `
      <div style="flex:1;">
        <span class="order-line-name">${item.name}</span>${sub}
      </div>
      <span class="order-line-qty-badge">${item.qty}</span>
      <span class="order-line-price">
        ฿${Number(item.lineTotal).toFixed(0)}
        <sup class="order-line-multi">x${item.qty}</sup>
      </span>`;
    list.appendChild(row);
  });

  // Show discount row if applied
  const discCode = orderData.discountCode;
  const discAmt  = Number(orderData.discountAmount || 0);
  const discRow  = document.getElementById('order-detail-discount-row');
  if (discRow) {
    if (discCode && discAmt > 0) {
      discRow.style.display = '';
      const codeEl = document.getElementById('order-detail-discount-code');
      const amtEl  = document.getElementById('order-detail-discount-amt');
      if (codeEl) codeEl.textContent = '🏷 ' + discCode;
      if (amtEl)  amtEl.textContent  = '−฿' + discAmt.toFixed(0);
    } else {
      discRow.style.display = 'none';
    }
  }

  const total = Number(orderData.total || cart.total);
  document.getElementById('order-detail-total').textContent = '฿' + total.toFixed(0);
  updateProgressDots(orderData.status || 'pending');
}

/* ── Order History (this table) ───────────────────────────────── */
async function loadTableHistory() {
  const histEl = document.getElementById('historyList');
  const nameEl = document.getElementById('historyTableName');
  if (nameEl) nameEl.textContent = 'Table ' + TABLE_NO;
  if (histEl) histEl.innerHTML = '<div style="text-align:center;padding:40px 0;color:#9e8c6a;font-style:italic;">Loading…</div>';

  try {
    const res  = await fetch('/customer/api/orders/table/' + TABLE_NO);
    const data = await res.json();

    if (!histEl) return;
    if (!data.length) {
      histEl.innerHTML = '<div style="text-align:center;padding:40px 0;color:#9e8c6a;font-style:italic;">No orders yet for this table.</div>';
      return;
    }

    const statusColor = { pending:'#b8923a', preparing:'#2563eb', ready:'#16a34a', completed:'#6b7280', cancelled:'#c0392b' };
    const statusLabel = { pending:'Placed', preparing:'Preparing', ready:'Ready!', completed:'Done', cancelled:'Cancelled' };

    histEl.innerHTML = data.map((o, idx) => {
      const time    = o.createdAt ? new Date(o.createdAt).toLocaleTimeString('th-TH', {hour:'2-digit',minute:'2-digit'}) : '';
      const date    = o.createdAt ? new Date(o.createdAt).toLocaleDateString('th-TH', {day:'2-digit',month:'short'}) : '';
      const sColor  = statusColor[o.status] || '#9e8c6a';
      const sLabel  = statusLabel[o.status] || o.status;
      const itemStr = (o.items || []).map(i => i.name + (i.qty > 1 ? ' ×' + i.qty : '')).join(', ');
      return `
        <div onclick="openHistoryDetail(${idx})" style="
          background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:12px;
          box-shadow:0 1px 6px rgba(0,0,0,.07);cursor:pointer;border:1.5px solid #f0e8d8;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-family:var(--font-display);font-weight:700;font-size:1rem;color:#2c1a08;">
              #${String(o.queueNumber).padStart(3,'0')}
            </span>
            <span style="font-size:.72rem;font-weight:700;padding:3px 10px;border-radius:20px;
              background:${sColor}22;color:${sColor};">${sLabel}</span>
          </div>
          <div style="font-size:.82rem;color:#7a6535;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px;">${itemStr || '—'}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:.75rem;color:#b8a070;">${date} ${time}</span>
            <span style="font-family:var(--font-display);font-weight:700;color:#2c1a08;">฿${Number(o.total||0).toFixed(0)}</span>
          </div>
        </div>`;
    }).join('');

    // Store for detail view
    window._tableHistory = data;
  } catch (e) {
    if (histEl) histEl.innerHTML = '<div style="text-align:center;padding:40px 0;color:#c0392b;">Could not load history.</div>';
  }
}

function openHistoryDetail(idx) {
  const o = (window._tableHistory || [])[idx];
  if (!o) return;

  document.getElementById('histDetailTableName').textContent = 'Table ' + TABLE_NO;
  document.getElementById('histDetailQueue').textContent     = '#' + String(o.queueNumber).padStart(3,'0');

  // Status message — matches live order screen
  const STATUS_MSG_MAP = {
    pending:   'Your order has been placed.',
    preparing: 'Your order is being prepared.',
    ready:     '✦ Your order is ready! Come pick it up.',
    completed: '✓ Order delivered. Enjoy!',
    cancelled: '✕ Order was cancelled.'
  };
  const sEl = document.getElementById('histDetailStatus');
  if (sEl) {
    sEl.textContent = STATUS_MSG_MAP[o.status] || o.status;
    sEl.style.color = o.status === 'completed' ? '#16a34a'
                    : o.status === 'ready'     ? '#2563eb'
                    : o.status === 'cancelled' ? '#c0392b' : '#b8923a';
  }

  // Progress tracker dots
  const STATUS_ORDER_MAP = ['pending','preparing','ready','completed'];
  const dotIdx = STATUS_ORDER_MAP.indexOf(o.status);
  STATUS_ORDER_MAP.forEach((s, i) => {
    const dot = document.getElementById('histDot-' + s);
    if (!dot) return;
    dot.classList.remove('done','active');
    if (i < dotIdx)        dot.classList.add('done');
    else if (i === dotIdx) dot.classList.add('active');
  });

  // Items — white card rows with green qty badge (matches screenshot)
  const linesEl = document.getElementById('histDetailLines');
  if (linesEl) {
    linesEl.innerHTML = (o.items || []).map(i => {
      const sub = (i.drinkState || i.toppings)
        ? `<div style="font-size:.78rem;color:#9e8c6a;margin-top:2px;">${i.drinkState || i.toppings}</div>` : '';
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;
          padding:12px 16px;background:#fff;border-radius:14px;margin-bottom:10px;
          box-shadow:0 1px 4px rgba(0,0,0,.06);">
          <div style="flex:1;">
            <div style="font-weight:600;color:#2c1a08;font-size:.95rem;">${i.name}</div>
            ${sub}
          </div>
          <span style="background:#2c1a08;color:#e8c96a;border-radius:50%;
            width:26px;height:26px;display:flex;align-items:center;justify-content:center;
            font-size:.78rem;font-weight:700;margin:0 12px;flex-shrink:0;">${i.qty}</span>
          <span style="font-family:var(--font-display);font-weight:700;color:#2c1a08;white-space:nowrap;">
            ฿${Number(i.lineTotal||0).toFixed(0)}<sup style="font-size:.65rem;font-weight:400;color:#9e8c6a;"> x${i.qty}</sup>
          </span>
        </div>`;
    }).join('');
  }

  // Discount row
  const discRow = document.getElementById('histDetailDiscountRow');
  if (discRow) {
    if (o.discountCode && Number(o.discountAmount||0) > 0) {
      discRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;' +
        'padding:10px 16px;background:#f0faf0;border-radius:12px;margin-bottom:10px;';
      document.getElementById('histDetailDiscountCode').textContent = '🏷 ' + o.discountCode;
      document.getElementById('histDetailDiscountAmt').textContent  = '−฿' + Number(o.discountAmount).toFixed(0);
    } else {
      discRow.style.display = 'none';
    }
  }

  // Total
  const totalEl = document.getElementById('histDetailTotal');
  if (totalEl) totalEl.textContent = '฿' + Number(o.total||0).toFixed(0);

  // Payment method
  const methodEl = document.getElementById('histDetailMethod');
  if (methodEl) methodEl.textContent = o.paymentMethod ? 'Paid via ' + o.paymentMethod : '';

  goTo('screen-history-detail');
}


const STATUS_ORDER = ['pending', 'preparing', 'ready', 'completed'];
const STATUS_MSG   = {
  pending:   'Your order has been placed.',
  preparing: 'Your order is being prepared.',
  ready:     '✦ Your order is ready! Come pick it up.',
  completed: '✓ Order delivered. Enjoy!',
  cancelled: '✕ Order was cancelled.'
};

function updateProgressDots(status) {
  const idx = STATUS_ORDER.indexOf(status);
  STATUS_ORDER.forEach((s, i) => {
    const dot = document.getElementById('dot-' + s);
    if (!dot) return;
    dot.classList.remove('done', 'active');
    if (i < idx)       dot.classList.add('done');
    else if (i === idx) dot.classList.add('active');
  });
  const msg = document.getElementById('orderStatusMsg');
  if (msg) msg.textContent = STATUS_MSG[status] || '';

  // Also update legacy track screen
  ['pending','preparing','ready','completed'].forEach((s, i) => {
    const dot = document.getElementById('track-dot-' + s);
    const lbl = document.getElementById('track-lbl-' + s);
    if (dot) { dot.classList.toggle('done', i <= idx); }
    if (lbl) { lbl.classList.toggle('active', i <= idx); }
  });
  const tv = document.getElementById('trackStatusValue');
  if (tv) tv.textContent = STATUS_MSG[status] || status;
}

/* ── Poll order status every 8 seconds ───────────────────────── */
function startTracking(orderId) {
  if (trackingInterval) clearInterval(trackingInterval);
  trackingInterval = setInterval(async () => {
    try {
      const res = await fetch('/customer/api/orders/' + orderId + '/status');
      if (!res.ok) return;
      const data = await res.json();
      updateProgressDots(data.status);
      if (data.status === 'completed' || data.status === 'cancelled') {
        clearInterval(trackingInterval);
        trackingInterval = null;
      }
    } catch (e) { /* ignore network errors during polling */ }
  }, 8000);
}

/* ── Discount Dropdown picker ─────────────────────────────────── */
function pickDiscountFromDropdown(code) {
  const input = document.getElementById('discountCodeInput');
  if (input) input.value = code;
  if (code) applyDiscount();
}

/* ── Discount Code ────────────────────────────────────────────── */
async function applyDiscount() {
  const input   = document.getElementById('discountCodeInput');
  const msgEl   = document.getElementById('discountMsg');
  const code    = (input ? input.value.trim() : '').toUpperCase();

  if (!code) {
    // Clear discount
    cart.discountCode  = '';
    cart.discountType  = '';
    cart.discountValue = 0;
    if (msgEl) { msgEl.style.display = 'none'; msgEl.textContent = ''; }
    renderCartScreen();
    return;
  }

  try {
    const res  = await fetch('/customer/api/discount?code=' + encodeURIComponent(code));
    const data = await res.json();

    if (!res.ok || data.error) {
      cart.discountCode  = '';
      cart.discountType  = '';
      cart.discountValue = 0;
      if (msgEl) {
        msgEl.style.display  = '';
        msgEl.style.color    = '#c0392b';
        msgEl.textContent    = '✕ ' + (data.error || 'Invalid code');
      }
    } else {
      cart.discountCode  = data.code;
      cart.discountType  = data.discountType;   // percent | fixed | bogo
      cart.discountValue = Number(data.value || 0);
      if (msgEl) {
        msgEl.style.display  = '';
        msgEl.style.color    = '#16a34a';
        msgEl.textContent    = '✓ ' + data.name + ' applied!';
      }
    }
  } catch (e) {
    if (msgEl) {
      msgEl.style.display = '';
      msgEl.style.color   = '#c0392b';
      msgEl.textContent   = '✕ Could not validate code.';
    }
  }
  renderCartScreen();
}

function makeAnotherOrder() {
  if (qrTimerInterval)   { clearInterval(qrTimerInterval);   qrTimerInterval   = null; }
  if (trackingInterval)  { clearInterval(trackingInterval);  trackingInterval  = null; }
  placedOrderId = null;
  cart.clear();
  updateCartBadge();
  renderMenuGrid();
  goTo('screen-menu');
}

/* ── Session Management ───────────────────────────────────────── */

/**
 * Called when customer clicks "Browse Menu" for the first time.
 * Marks the table as occupied in the DB so admin sees it as taken.
 */
async function startSession() {
  try {
    await fetch('/customer/api/tables/' + TABLE_NO + '/occupy', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) { /* non-blocking */ }
  goTo('screen-menu');
}

/**
 * Called when returning customer clicks "Checkout & Done".
 * Releases the table (marks as free) and clears the customer's
 * order history view so the next customer starts fresh.
 */
async function finalCheckout() {
  if (qrTimerInterval)  { clearInterval(qrTimerInterval);  qrTimerInterval  = null; }
  if (trackingInterval) { clearInterval(trackingInterval); trackingInterval = null; }

  // Release table in DB → admin sees it as Free again
  try {
    await fetch('/customer/api/tables/' + TABLE_NO + '/release', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) { /* non-blocking */ }

  // Clear all client-side session state
  placedOrderId    = null;
  placedOrderData  = null;
  window._tableHistory = [];
  cart.clear();
  updateCartBadge();

  // Show a friendly goodbye message, then go back to first-scan welcome
  const welcomeEl = document.getElementById('screen-welcome');
  if (welcomeEl) {
    const badge = welcomeEl.querySelector('.qr-badge');
    if (badge) badge.textContent = 'Thank you! See you again.';
    const sub = welcomeEl.querySelector('.welcome-sub');
    if (sub) sub.innerHTML = 'Your table is now free.<br>Have a great day!';
  }
  goTo('screen-welcome');
}

/* ── Search ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Set table name on both welcome screens
  const wtn  = document.getElementById('welcomeTableName');
  const rtn  = document.getElementById('returningTableName');
  if (wtn)  wtn.textContent  = 'Table ' + TABLE_NO;
  if (rtn)  rtn.textContent  = 'Table ' + TABLE_NO;

  // Render menu and update badge
  renderMenuGrid();
  updateCartBadge();

  // Search input
  const si = document.getElementById('menu-search');
  if (si) si.addEventListener('input', () => renderMenuGrid());

  // Cart badge reactive
  cart.subscribe(updateCartBadge);

  // Fetch active discounts — apply any auto-apply ones immediately
  fetch('/customer/api/discounts/active')
    .then(r => r.json())
    .then(discounts => {
      const auto = discounts.find(d => d.autoApply);
      if (auto && !cart.discountCode) {
        cart.discountCode  = auto.code;
        cart.discountType  = auto.discountType;
        cart.discountValue = Number(auto.value || 0);
        window._autoDiscount = auto;
      }
      window._activeDiscounts = discounts;
    })
    .catch(() => {});

  // Check if table is already occupied (returning customer scenario)
  fetch('/customer/api/tables/' + TABLE_NO + '/status')
    .then(r => r.json())
    .then(data => {
      if (data.occupied) {
        const ret = document.getElementById('screen-returning');
        if (ret) ret.classList.add('_was_active');
        goTo('screen-returning');
      }
    })
    .catch(() => {});
});
