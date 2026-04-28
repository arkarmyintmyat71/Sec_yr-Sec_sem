/* ══════════════════════════════════════════════════════════════
   PLEASANT CORNER  –  pages.js
   Handles: Toppings · Drink States · Tables & QR · Payments
            Discounts & Promos · Add Staff Member
   Each section only activates when its anchor element exists.
══════════════════════════════════════════════════════════════ */

/* ── Shared sidebar toggle (safe to call from any page) ── */
function initSidebarToggle() {
  const hamburger = document.getElementById('hamburgerBtn');
  const sidebar   = document.getElementById('sidebar');
  const main      = document.getElementById('mainPanel');
  const overlay   = document.getElementById('sidebarOverlay');
  if (hamburger) {
    hamburger.addEventListener('click', function () {
      const col = sidebar.classList.toggle('collapsed');
      if (main) main.classList.toggle('expanded', col);
    });
  }
  if (overlay) {
    overlay.addEventListener('click', function () {
      if (sidebar) sidebar.classList.remove('collapsed');
      if (main)    main.classList.remove('expanded');
      overlay.classList.remove('active');
    });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  initSidebarToggle();

  /* ══════════════════════════════════════════════════════
     1.  TOPPINGS
  ══════════════════════════════════════════════════════ */
  if (document.getElementById('toppingsList')) {
    // ── Toppings: loaded from /api/toppings ──
    let toppings  = [];
    let tEditId   = null;
    let tSearch   = '';
    let tModal;

    const APPLIES_OPTS = ['Cakes & Pastries', 'Desserts', 'Waffles & Pancakes', 'Ice Cream'];
    let appliesTo  = ['Cakes & Pastries', 'Desserts'];
    let maxToppings = 3;

    // ── API helpers ──
    async function tpLoad() {
      const raw = (typeof initialToppings !== 'undefined' && initialToppings.length)
        ? initialToppings
        : await fetch('/api/toppings').then(r => r.json());
      const data = raw;
      toppings = data.map(t => ({
        id:         t.id,
        name:       t.name,
        price:      Number(t.priceAdjustment || 0),
        emoji:      t.emoji || '🍓',
        desc:       t.description || '',
        avail:      t.status === 'available',
        categories: t.categories || APPLIES_OPTS, // default: applies to all categories
      }));
      initialToppings = []; // clear so refresh always fetches fresh
    }
    async function tpApiSave(payload, id) {
      const url = id ? `/api/toppings/${id}` : '/api/toppings';
      const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          priceAdjustment: payload.price,
          status: payload.avail ? 'available' : 'unavailable',
          emoji: payload.emoji,
          description: payload.desc,
        }),
      });
      if (!res.ok) throw new Error('Save failed: ' + res.status);
      const saved = await res.json();
      return { id: saved.id, name: saved.name, price: Number(saved.priceAdjustment || 0),
               emoji: saved.emoji || '🍓', desc: saved.description || '',
               avail: saved.status === 'available' };
    }

    function renderToppings() {
      const list = document.getElementById('toppingsList');
      const filtered = toppings.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(tSearch.toLowerCase());
        // Apply category filter: show topping if it belongs to at least one checked category
        // If topping has no categories assigned, show it in all filters (default behaviour)
        const tCats = t.categories || APPLIES_OPTS; // default: applies to all
        const matchCat = appliesTo.length === 0 || tCats.some(c => appliesTo.includes(c));
        return matchSearch && matchCat;
      });
      if (!filtered.length) {
        list.innerHTML = '<div style="padding:20px;text-align:center;color:#a8975e;font-size:.9rem;">No toppings found.</div>';
        return;
      }
      list.innerHTML = filtered.map(t => `
        <div class="topping-row" data-id="${t.id}">
          <div class="topping-icon-wrap">${t.emoji || '🍓'}</div>
          <div class="topping-info">
            <div class="topping-name">${t.name}</div>
            <div class="topping-desc">${t.desc || ''}</div>
          </div>
          <span class="topping-price">+฿${t.price}</span>
          <label class="toggle-switch">
            <input type="checkbox" ${t.avail ? 'checked' : ''} onchange="tpToggle(${t.id})"/>
            <span class="toggle-slider"></span>
          </label>
          <div class="topping-actions">
            <button class="btn-edit-sm" onclick="tpOpenEdit(${t.id})">Edit</button>
            <button class="btn-del-sm"  onclick="tpDelete(${t.id})">Del</button>
          </div>
        </div>`).join('');
    }

    function renderApplies() {
      const container = document.getElementById('appliesCheckboxes');
      const label     = document.getElementById('appliesLabel');
      if (container) {
        container.innerHTML = APPLIES_OPTS.map(cat => `
          <label class="applies-checkbox-item">
            <input type="checkbox" value="${cat}" ${appliesTo.includes(cat) ? 'checked' : ''}
              onchange="tpAppliesChange('${cat}', this.checked)"/>
            <span class="custom-checkbox">
              <span class="custom-checkbox-inner">&#10003;</span>
            </span>
            ${cat}
          </label>`).join('');
      }
      if (label) label.textContent = 'Applies to: ' + (appliesTo.join(', ') || 'None');
    }

    window.tpAppliesChange = function (cat, checked) {
      if (checked) { if (!appliesTo.includes(cat)) appliesTo.push(cat); }
      else          { appliesTo = appliesTo.filter(x => x !== cat); }
      const label = document.getElementById('appliesLabel');
      if (label) label.textContent = 'Applies to: ' + (appliesTo.join(', ') || 'None');
      // Re-render the list so the filter takes effect immediately
      renderToppings();
    };

    window.tpToggle = async function (id) {
      const t = toppings.find(x => x.id === id);
      if (!t) return;
      try {
        const newStatus = t.avail ? 'unavailable' : 'available';
        await fetch(`/api/toppings/${id}/status`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        t.avail = !t.avail;
        renderToppings();
      } catch(e) { alert('Could not update topping.'); }
    };

    window.tpDelete = async function (id) {
      if (!confirm('Delete this topping?')) return;
      try {
        await fetch(`/api/toppings/${id}`, { method: 'DELETE' });
        toppings = toppings.filter(x => x.id !== id);
        renderToppings();
      } catch(e) { alert('Could not delete topping.'); }
    };

    window.tpOpenEdit = function (id) {
      const t = toppings.find(x => x.id === id);
      if (!t) return;
      tEditId = id;
      document.getElementById('modalTitle').textContent = 'Edit Topping';
      document.getElementById('tpName').value    = t.name;
      document.getElementById('tpPrice').value   = t.price;
      document.getElementById('tpDesc').value    = t.desc  || '';
      document.getElementById('tpAvail').checked = t.avail;
      if (typeof tpSetEmoji === 'function') tpSetEmoji(t.emoji || '🍓');
      else {
        document.getElementById('tpEmoji').value = t.emoji || '🍓';
        const cur = document.getElementById('tpEmojiCurrent');
        if (cur) cur.textContent = t.emoji || '🍓';
      }
      // Set category checkboxes
      const tCats = t.categories || APPLIES_OPTS;
      document.querySelectorAll('.tp-category-check').forEach(cb => {
        cb.checked = tCats.includes(cb.value);
      });
      tModal.show();
    };

    document.getElementById('addToppingBtn').addEventListener('click', function () {
      tEditId = null;
      document.getElementById('modalTitle').textContent = 'Add Topping';
      document.getElementById('tpName').value    = '';
      document.getElementById('tpPrice').value   = '0';
      document.getElementById('tpDesc').value    = '';
      document.getElementById('tpAvail').checked = true;
      if (typeof tpSetEmoji === 'function') tpSetEmoji('🍓');
      else {
        document.getElementById('tpEmoji').value = '🍓';
        const cur = document.getElementById('tpEmojiCurrent');
        if (cur) cur.textContent = '🍓';
      }
      // Default: all categories checked
      document.querySelectorAll('.tp-category-check').forEach(cb => { cb.checked = true; });
      tModal.show();
    });

    document.getElementById('saveToppingBtn').addEventListener('click', async function () {
      const name  = document.getElementById('tpName').value.trim();
      const price = parseInt(document.getElementById('tpPrice').value) || 0;
      const emoji = document.getElementById('tpEmoji').value.trim() || '🍓';
      const desc  = document.getElementById('tpDesc').value.trim();
      const avail = document.getElementById('tpAvail').checked;
      // Collect checked categories
      const categories = Array.from(document.querySelectorAll('.tp-category-check:checked'))
        .map(cb => cb.value);
      if (!name) { alert('Please enter a topping name.'); return; }
      try {
        const saved = await tpApiSave({ name, price, emoji, desc, avail }, tEditId);
        saved.categories = categories.length ? categories : APPLIES_OPTS;
        if (tEditId) {
          const idx = toppings.findIndex(x => x.id === tEditId);
          if (idx !== -1) toppings[idx] = saved;
        } else {
          toppings.push(saved);
        }
        tModal.hide();
        renderToppings();
      } catch(e) { alert('Could not save topping.'); }
    });

    document.getElementById('searchInput').addEventListener('input', function () {
      tSearch = this.value;
      renderToppings();
    });

    const maxInput = document.getElementById('maxToppingsInput');
    const maxDisp  = document.getElementById('maxDisplay');
    if (maxInput && maxDisp) {
      maxInput.addEventListener('input', function () {
        const v = parseInt(this.value) || 1;
        maxToppings = v;
        maxDisp.textContent = v;
      });
    }

    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', function () {
        this.textContent = 'Saved ✓';
        this.style.background = '#16a34a';
        setTimeout(() => { this.textContent = 'Save Settings'; this.style.background = ''; }, 1800);
      });
    }

    tModal = new bootstrap.Modal(document.getElementById('toppingModal'));
    tpLoad().then(() => { renderToppings(); renderApplies(); });
  }

  /* ══════════════════════════════════════════════════════
     2.  DRINK STATES
  ══════════════════════════════════════════════════════ */
  if (document.getElementById('statesList')) {
    // ── Drink States: loaded from /api/drink-states ──
    let states   = [];
    let dsEditId = null;
    let dsFilter = 'all';   // 'all' | 'active' | 'inactive'
    let dsModal;

    async function dsLoad() {
      const raw = (typeof initialDrinkStates !== 'undefined' && initialDrinkStates.length)
        ? initialDrinkStates
        : await fetch('/api/drink-states').then(r => r.json());
      const data = raw;
      states = data.map(s => ({
        id:       s.id,
        name:     s.name,
        desc:     s.description || '',
        priceAdj: Number(s.priceAdjustment || 0),
        emoji:    s.emoji || '🔥',
        active:   s.defaultState !== undefined ? true : true, // all states shown as active by default
        isDefault: s.defaultState,
      }));
      initialDrinkStates = [];
    }
    async function dsApiSave(payload, id) {
      const url = id ? `/api/drink-states/${id}` : '/api/drink-states';
      const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          priceAdjustment: payload.priceAdj,
          defaultState: payload.active && !id,
          description: payload.desc,
          emoji: payload.emoji,
        }),
      });
      if (!res.ok) throw new Error('Save failed: ' + res.status);
      const saved = await res.json();
      return { id: saved.id, name: saved.name, desc: saved.description || '',
               priceAdj: Number(saved.priceAdjustment || 0),
               emoji: saved.emoji || '🔥', active: true, isDefault: saved.defaultState };
    }

    function renderStates() {
      const list = document.getElementById('statesList');
      const visible = dsFilter === 'all'
        ? states
        : dsFilter === 'active'
          ? states.filter(s => s.active)
          : states.filter(s => !s.active);
      if (!visible.length) {
        list.innerHTML = '<div style="padding:20px;text-align:center;color:#a8975e;font-size:.9rem;">No ' + dsFilter + ' drink states.</div>';
      } else {
      list.innerHTML = visible.map(s => `
        <div class="state-row" data-id="${s.id}">
          <div class="state-icon-wrap">${s.emoji || '🔥'}</div>
          <div class="state-info">
            <div class="state-name">${s.name}</div>
            <div class="state-desc">${s.desc || ''}</div>
          </div>
          <span class="state-price">${s.priceAdj > 0 ? '+฿' + s.priceAdj : 'No charge'}</span>
          <label class="toggle-switch">
            <input type="checkbox" ${s.active ? 'checked' : ''} onchange="dsToggle(${s.id})"/>
            <span class="toggle-slider"></span>
          </label>
          <div class="state-actions">
            <button class="btn-edit-sm" onclick="dsOpenEdit(${s.id})">Edit</button>
            <button class="btn-del-sm"  onclick="dsDelete(${s.id})">Del</button>
          </div>
        </div>`).join('');

      } // end visible.length else

      // Update tab count badges
      const countAll      = document.getElementById('dsCountAll');
      const countActive   = document.getElementById('dsCountActive');
      const countInactive = document.getElementById('dsCountInactive');
      if (countAll)      countAll.textContent      = states.length;
      if (countActive)   countActive.textContent   = states.filter(s => s.active).length;
      if (countInactive) countInactive.textContent = states.filter(s => !s.active).length;

      const sel = document.getElementById('defaultStateSelect');
      if (sel) {
        const currentVal = sel.value;
        sel.innerHTML = states
          .filter(s => s.active)
          .map(s => `<option value="${s.name.toLowerCase()}" ${s.name.toLowerCase() === currentVal ? 'selected' : ''}>${s.name}</option>`)
          .join('');
      }
    }

    window.dsToggle = async function (id) {
      const s = states.find(x => x.id === id);
      if (!s) return;
      s.active = !s.active;
      renderStates();
      // Note: DrinkState model doesn't have an active flag, so this is UI-only toggle
      // You can extend the model if needed
    };

    window.dsDelete = async function (id) {
      if (!confirm('Delete this drink state?')) return;
      try {
        await fetch(`/api/drink-states/${id}`, { method: 'DELETE' });
        states = states.filter(x => x.id !== id);
        renderStates();
      } catch(e) { alert('Could not delete drink state.'); }
    };

    window.dsOpenEdit = function (id) {
      const s = states.find(x => x.id === id);
      if (!s) return;
      dsEditId = id;
      document.getElementById('stateModalTitle').textContent = 'Edit Drink State';
      document.getElementById('stateName').value     = s.name;
      document.getElementById('statePrice').value    = s.priceAdj;
      document.getElementById('stateDesc').value     = s.desc  || '';
      document.getElementById('stateActive').checked = s.active;
      if (typeof dsSetEmoji === 'function') dsSetEmoji(s.emoji || '🔥');
      else {
        document.getElementById('stateEmoji').value = s.emoji || '🔥';
        const cur = document.getElementById('stateEmojiCurrent');
        if (cur) cur.textContent = s.emoji || '🔥';
      }
      dsModal.show();
    };

    document.getElementById('addStateBtn').addEventListener('click', function () {
      dsEditId = null;
      document.getElementById('stateModalTitle').textContent = 'Add Drink State';
      document.getElementById('stateName').value     = '';
      document.getElementById('statePrice').value    = '0';
      document.getElementById('stateDesc').value     = '';
      document.getElementById('stateActive').checked = true;
      if (typeof dsSetEmoji === 'function') dsSetEmoji('🔥');
      else {
        document.getElementById('stateEmoji').value = '🔥';
        const cur = document.getElementById('stateEmojiCurrent');
        if (cur) cur.textContent = '🔥';
      }
      dsModal.show();
    });

    document.getElementById('saveStateBtn').addEventListener('click', async function () {
      const name   = document.getElementById('stateName').value.trim();
      const price  = parseInt(document.getElementById('statePrice').value) || 0;
      const emoji  = document.getElementById('stateEmoji').value.trim() || '🔥';
      const desc   = document.getElementById('stateDesc').value.trim();
      const active = document.getElementById('stateActive').checked;
      if (!name) { alert('Please enter a state name.'); return; }
      try {
        const saved = await dsApiSave({ name, priceAdj: price, emoji, desc, active }, dsEditId);
        if (dsEditId) {
          const idx = states.findIndex(x => x.id === dsEditId);
          if (idx !== -1) states[idx] = saved;
        } else {
          states.push(saved);
        }
        dsModal.hide();
        renderStates();
      } catch(e) { alert('Could not save drink state.'); }
    });

    const saveRulesBtn = document.getElementById('saveRulesBtn');
    if (saveRulesBtn) {
      saveRulesBtn.addEventListener('click', function () {
        this.textContent = 'Saved ✓';
        this.style.background = '#16a34a';
        setTimeout(() => { this.textContent = 'Save Rules'; this.style.background = ''; }, 1800);
      });
    }

    dsModal = new bootstrap.Modal(document.getElementById('stateModal'));

    // Wire filter tabs
    document.querySelectorAll('[data-ds-filter]').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-ds-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        dsFilter = btn.dataset.dsFilter;
        renderStates();
      });
    });

    dsLoad().then(() => renderStates());
  }

  /* ══════════════════════════════════════════════════════
     3.  TABLES & QR
  ══════════════════════════════════════════════════════ */
  if (document.getElementById('tableBody')) {
    // ── Tables: loaded from /api/tables ──
    let tables    = [];
    let tqEditId  = null;
    let tqModal, tqQrModal;

    async function tqLoad() {
      const raw = (typeof initialTables !== 'undefined' && initialTables.length)
        ? initialTables
        : await fetch('/api/tables').then(r => r.json());
      tables = raw.map(t => ({
        id:            t.id,
        number:        t.tableNumber,
        seats:         t.seats,
        note:          t.locationNote || '',
        status:        t.status || 'active',
        customerUrl:   t.customerUrl   || '',
        tableQrDataUrl:t.tableQrDataUrl|| '',
        occupied: t.occupied === true,
        order: null,
      }));
      initialTables = [];
    }

    // Auto-refresh occupancy every 15 seconds while on this page
    async function tqRefreshOccupancy() {
      try {
        const raw = await fetch('/api/tables').then(r => r.json());
        raw.forEach(t => {
          const found = tables.find(tbl => tbl.id === t.id);
          if (found) found.occupied = t.occupied === true;
        });
        renderTables();
      } catch (e) {}
    }
    async function tqApiSave(payload, id) {
      const url = id ? `/api/tables/${id}` : '/api/tables';
      const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: payload.number, seats: payload.seats,
                               locationNote: payload.note, status: payload.status }),
      });
      if (!res.ok) throw new Error('Save failed: ' + res.status);
      const saved = await res.json();
      return {
        id:             saved.id,
        number:         saved.tableNumber,
        seats:          saved.seats,
        note:           saved.locationNote || '',
        status:         saved.status,
        customerUrl:    saved.customerUrl    || '',
        tableQrDataUrl: saved.tableQrDataUrl || '',
        occupied: false,
        order: null,
      };
    }

    function renderTables() {
      const tbody = document.getElementById('tableBody');
      if (!tables.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#a8975e;">No tables yet. Click <strong>+ Add Table</strong>.</td></tr>';
        return;
      }
      tbody.innerHTML = tables.map(t => {
        const statusBadge = t.status === 'inactive'
          ? '<span class="badge-free" style="background:#f5f0e1;color:#a8975e;">Inactive</span>'
          : t.occupied
            ? '<span class="badge-occupied"><span class="dot dot-green"></span>Occupied</span>'
            : '<span class="badge-free">Free</span>';
        const qrCell = t.tableQrDataUrl
          ? `<img src="${t.tableQrDataUrl}" alt="QR T${t.number}"
               style="width:40px;height:40px;border-radius:4px;cursor:pointer;vertical-align:middle;"
               onclick="tqViewQr(${t.id})" title="Click to view"/>`
          : `<span style="color:#c4b08a;font-size:.8rem;">Not generated</span>`;
        const actions = t.status === 'inactive'
          ? `<button class="btn-edit-tq" onclick="tqOpenEdit(${t.id})">Edit</button>
             <button class="btn-del-tq"  onclick="tqDelete(${t.id})">Delete</button>`
          : `<button class="btn-view-qr" onclick="tqViewQr(${t.id})">View QR</button>
             <button class="btn-edit-tq" onclick="tqOpenEdit(${t.id})">Edit</button>
             <button class="btn-del-tq"  onclick="tqDelete(${t.id})">Delete</button>`;
        return `<tr>
          <td class="td-table-no">Table ${t.number}</td>
          <td class="td-seats">${t.seats}</td>
          <td>${t.note || '<span style="color:#c4b08a;">—</span>'}</td>
          <td>${qrCell}</td>
          <td>${statusBadge}</td>
          <td class="td-actions"><div class="td-actions-inner">${actions}</div></td>
        </tr>`;
      }).join('');
    }

    window.tqViewQr = function (id) {
      const t = tables.find(x => x.id === id);
      if (!t) return;
      document.getElementById('qrModalTitle').textContent = 'QR Code – Table ' + t.number;
      const box   = document.getElementById('qrViewBox');
      const urlEl = document.getElementById('qrViewUrl');
      if (box) {
        if (t.tableQrDataUrl) {
          box.innerHTML = `<img src="${t.tableQrDataUrl}" alt="QR Table ${t.number}"
            style="width:180px;height:180px;border-radius:8px;display:block;margin:0 auto;"/>`;
        } else {
          box.innerHTML = '<i class="bi bi-qr-code" style="font-size:6rem;color:#b8923a;opacity:.4;"></i><div style="font-size:.78rem;color:#a8975e;margin-top:8px;">Not generated yet</div>';
        }
      }
      if (urlEl) urlEl.textContent = t.customerUrl || '—';
      tqQrModal.show();
    };

    window.tqOpenEdit = function (id) {
      const t = tables.find(x => x.id === id);
      if (!t) return;
      tqEditId = id;
      document.getElementById('tModalTitle').textContent = 'Edit Table';
      document.getElementById('tNumber').value = t.number;
      document.getElementById('tSeats').value  = t.seats;
      document.getElementById('tNote').value   = t.note || '';
      document.getElementById('tStatus').value = t.status;
      tqModal.show();
      setTimeout(updateModalQr, 100);
    };

    window.tqDelete = async function (id) {
      if (!confirm('Delete this table?')) return;
      try {
        await fetch(`/api/tables/${id}`, { method: 'DELETE' });
        tables = tables.filter(x => x.id !== id);
        renderTables();
      } catch(e) { alert('Could not delete table.'); }
    };

    ['numUp','numDown','seatUp','seatDown'].forEach(function (btnId) {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      btn.addEventListener('click', function () {
        const isNum  = btnId.startsWith('num');
        const isUp   = btnId.endsWith('Up');
        const input  = document.getElementById(isNum ? 'tNumber' : 'tSeats');
        const val    = parseInt(input.value) || 0;
        input.value  = Math.max(1, isUp ? val + 1 : val - 1);
      });
    });

    document.getElementById('addTableBtn').addEventListener('click', function () {
      tqEditId = null;
      document.getElementById('tModalTitle').textContent = 'Add Table';
      document.getElementById('tNumber').value = '1';
      document.getElementById('tSeats').value  = '';
      document.getElementById('tNote').value   = '';
      document.getElementById('tStatus').value = 'active';
      tqModal.show();
      setTimeout(updateModalQr, 100);
    });

    document.getElementById('saveTableBtn').addEventListener('click', async function () {
      const num    = parseInt(document.getElementById('tNumber').value) || 0;
      const seats  = parseInt(document.getElementById('tSeats').value)  || 0;
      const note   = document.getElementById('tNote').value.trim();
      const status = document.getElementById('tStatus').value;
      if (!num)   { alert('Please enter a table number.'); return; }
      if (!seats) { alert('Please enter seat count.');     return; }
      try {
        const saved = await tqApiSave({ number: num, seats, note, status }, tqEditId);
        if (tqEditId) {
          const idx = tables.findIndex(x => x.id === tqEditId);
          if (idx !== -1) tables[idx] = saved;
        } else {
          tables.push(saved);
        }
        tqModal.hide();
        renderTables();
      } catch(e) { alert('Could not save table.'); }
    });

    const dlBtn = document.getElementById('downloadQrBtn');
    if (dlBtn) dlBtn.addEventListener('click', function () {
      // Find which table is currently shown in the modal
      const titleEl = document.getElementById('qrModalTitle');
      const tableNum = titleEl ? titleEl.textContent.replace('QR Code – Table ', '').trim() : '';
      const t = tables.find(x => String(x.number) === String(tableNum));
      if (!t || !t.tableQrDataUrl) { alert('No QR code available to download.'); return; }
      const a = document.createElement('a');
      a.href     = t.tableQrDataUrl;
      a.download = 'QR-Table-' + t.number + '.png';
      a.click();
    });

    tqModal   = new bootstrap.Modal(document.getElementById('tableModal'));
    tqQrModal = new bootstrap.Modal(document.getElementById('qrModal'));

    window.updateModalQr = function () {
      const num = parseInt(document.getElementById('tNumber').value) || 1;
      const box   = document.getElementById('modalQrBox');
      const urlEl = document.getElementById('modalQrUrl');
      if (!box) return;
      // Show existing QR if this table already exists
      const existing = tables.find(x => x.number === num);
      if (existing && existing.tableQrDataUrl) {
        box.innerHTML = `<img src="${existing.tableQrDataUrl}" alt="QR T${num}"
          style="width:140px;height:140px;border-radius:6px;display:block;margin:0 auto;"/>`;
        if (urlEl) urlEl.textContent = existing.customerUrl || '';
      } else {
        box.innerHTML = '<i class="bi bi-qr-code" style="font-size:4rem;color:#b8923a;opacity:.4;"></i><div style="font-size:.7rem;color:#a8975e;margin-top:4px;">QR will be generated on save</div>';
        if (urlEl) urlEl.textContent = window.location.origin + '/customer/table/' + num;
      }
    };

    ['numUp','numDown'].forEach(function (btnId) {
      const btn = document.getElementById(btnId);
      if (btn) btn.addEventListener('click', function () { setTimeout(updateModalQr, 50); });
    });

    tqLoad().then(() => {
      renderTables();
      // Poll occupancy every 15 seconds so admin sees Free/Occupied live
      setInterval(tqRefreshOccupancy, 15000);
    });
  }

  /* ══════════════════════════════════════════════════════
     4.  PAYMENTS
  ══════════════════════════════════════════════════════ */
  if (document.getElementById('saveQrBtn')) {

    // QR image upload via dropzone
    const qrDropzone   = document.getElementById('qrImageDropzone');
    const qrInput      = document.getElementById('qrImageInput');
    const qrPreviewWrap= document.getElementById('qrImagePreviewWrap');
    const qrPreview    = document.getElementById('qrImagePreview');
    const qrRemove     = document.getElementById('qrImageRemove');
    const qrBrowse     = document.getElementById('qrBrowseLink');

    function showQrPreview(dataUrl) {
      if (qrPreview) qrPreview.src = dataUrl;
      if (qrDropzone)    qrDropzone.style.display    = 'none';
      if (qrPreviewWrap) qrPreviewWrap.style.display = '';
    }
    function clearQrPreview() {
      if (qrDropzone)    qrDropzone.style.display    = '';
      if (qrPreviewWrap) qrPreviewWrap.style.display = 'none';
      if (qrPreview)     qrPreview.src = '';
      if (qrInput)       qrInput.value = '';
    }

    if (qrBrowse)  qrBrowse.addEventListener('click',  function(e){ e.stopPropagation(); if(qrInput) qrInput.click(); });
    if (qrDropzone) {
      qrDropzone.addEventListener('click',     function() { if(qrInput) qrInput.click(); });
      qrDropzone.addEventListener('dragover',  function(e){ e.preventDefault(); this.classList.add('drag-over'); });
      qrDropzone.addEventListener('dragleave', function()  { this.classList.remove('drag-over'); });
      qrDropzone.addEventListener('drop',      function(e){
        e.preventDefault(); this.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) loadQrFile(file);
      });
    }
    if (qrInput) {
      qrInput.addEventListener('change', function() {
        if (this.files[0]) loadQrFile(this.files[0]);
      });
    }
    if (qrRemove) qrRemove.addEventListener('click', clearQrPreview);

    function loadQrFile(file) {
      const reader = new FileReader();
      reader.onload = function(e) { showQrPreview(e.target.result); };
      reader.readAsDataURL(file);
    }

    // Save button — also persists payment QR to all cafe tables in DB
    document.getElementById('saveQrBtn').addEventListener('click', async function () {
      const btn      = this;
      const preview  = document.getElementById('qrImagePreview');
      const dataUrl  = (preview && preview.src && preview.src.startsWith('data:'))
        ? preview.src : null;

      btn.disabled   = true;
      btn.textContent = 'Saving…';

      try {
        if (dataUrl) {
          // Persist to all tables so customers see it at checkout
          await fetch('/api/tables/payment-qr', {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ paymentQrDataUrl: dataUrl }),
          });
        }
        btn.textContent  = 'Saved ✓';
        btn.style.background = '#16a34a';
        setTimeout(() => {
          btn.textContent  = 'Save QR Settings';
          btn.style.background = '';
          btn.disabled     = false;
        }, 1800);
      } catch(e) {
        btn.textContent  = 'Save failed';
        btn.style.background = '#c0392b';
        setTimeout(() => {
          btn.textContent  = 'Save QR Settings';
          btn.style.background = '';
          btn.disabled     = false;
        }, 2000);
      }
    });

    // Toggle visual feedback
    ['cashEnabled','qrEnabled','cashPrompt','cashConfirm'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', function () {
        const card = this.closest('.pay-card');
        if (card) card.style.opacity = this.checked ? '1' : '0.55';
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     PAYMENT TRANSACTIONS TABLE
  ══════════════════════════════════════════════════════ */
  if (document.getElementById('txnBody')) {
    // Load from server-injected data (same pattern as staff, orders)
    let txns = (typeof initialTransactions !== 'undefined' && Array.isArray(initialTransactions))
      ? initialTransactions : [];
    let txnFilter = 'all';

    function methodBadge(method) {
      if (!method || method === '—') return '<span class="pay-txn-method other">—</span>';
      const m = method.toLowerCase();
      if (m === 'cash') return '<span class="pay-txn-method cash"><i class="bi bi-cash-stack"></i> Cash</span>';
      if (m === 'qr')   return '<span class="pay-txn-method qr"><i class="bi bi-qr-code"></i> QR</span>';
      return `<span class="pay-txn-method other">${method}</span>`;
    }

    function renderTxns() {
      const body  = document.getElementById('txnBody');
      const empty = document.getElementById('txnEmpty');
      const table = document.getElementById('txnTable');
      const sub   = document.getElementById('txnSub');

      const visible = txnFilter === 'all'
        ? txns
        : txns.filter(t => (t.paymentMethod || '').toLowerCase() === txnFilter.toLowerCase());

      // Update subtitle
      const total = visible.reduce((sum, t) => sum + Number(t.total || 0), 0);
      if (sub) sub.textContent = visible.length + ' transaction' + (visible.length !== 1 ? 's' : '')
        + ' · Total ฿' + total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

      if (!visible.length) {
        if (table) table.style.display = 'none';
        if (empty) empty.style.display = '';
        return;
      }
      if (table) table.style.display = '';
      if (empty) empty.style.display = 'none';

      body.innerHTML = visible.map(t => `
        <tr>
          <td class="pay-txn-queue">${t.queue || '—'}</td>
          <td class="pay-txn-table-cell">${t.tableNo || '—'}</td>
          <td class="pay-txn-items" title="${t.itemsLabel || ''}">${t.itemsLabel || '—'}</td>
          <td>${methodBadge(t.paymentMethod)}</td>
          <td class="pay-txn-amount">฿${Number(t.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
          <td class="pay-txn-time">${t.time || '—'}</td>
        </tr>`).join('');
    }

    // Wire filter tabs
    document.querySelectorAll('[data-method]').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-method]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        txnFilter = btn.dataset.method;
        renderTxns();
      });
    });

    // Initial render
    renderTxns();
  }

  /* ══════════════════════════════════════════════════════
     5.  DISCOUNTS & PROMOS
  ══════════════════════════════════════════════════════ */
  if (document.getElementById('promoCardsGrid')) {
    // ── Discounts: loaded from /api/discounts ──
    let promos    = [];
    let dpEditing = null;
    let dpFilter  = 'all';
    let dpModal;

    function dpFromApi(d) {
      const now = new Date(); now.setHours(0,0,0,0);
      let status = d.status || 'active';
      return {
        id: d.id, code: d.code, name: d.name || d.code,
        type: d.discountType,
        value: Number(d.value || 0),
        bogoB: null, bogoG: null,
        desc: d.description || '',
        minSpend: 0, appliesTo: 'all',
        start: d.startDate || '', end: d.endDate || '',
        timeFrom: '', timeTo: '',
        days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        limit: 0, used: 0,
        autoApply: false,
        active: status === 'active',
        status,
      };
    }
    function dpToApi(data) {
      return {
        code: data.code,
        discountType: data.type,
        value: data.value || 0,
        startDate: data.start || null,
        endDate:   data.end   || null,
        description: data.desc,
        status: data.status,
        name: data.name,
      };
    }

    async function dpLoad() {
      const raw = (typeof initialDiscounts !== 'undefined' && initialDiscounts.length)
        ? initialDiscounts
        : await fetch('/api/discounts').then(r => r.json());
      promos = raw.map(dpFromApi);
      initialDiscounts = [];
    }
    async function dpApiSave(payload, id) {
      const url = id ? `/api/discounts/${id}` : '/api/discounts';
      const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dpToApi(payload)),
      });
      if (!res.ok) throw new Error('Save failed: ' + res.status);
      return dpFromApi(await res.json());
    }

    function dpGetVal(p) {
      if (p.type === 'percent') return { big: p.value + '%',          unit: 'OFF ORDER' };
      if (p.type === 'fixed')   return { big: '฿' + p.value,         unit: 'OFF ORDER' };
      if (p.type === 'bogo')    return { big: 'B' + (p.bogoB||2) + 'G' + (p.bogoG||1), unit: 'FREE ITEM', bogo: true };
      return { big: '—', unit: '' };
    }

    function dpBadge(p) {
      if (p.status === 'active')    return '<span class="dp-status-badge dp-badge-active"><span class="dp-dot"></span>Active</span>';
      if (p.status === 'scheduled') return '<span class="dp-status-badge dp-badge-scheduled"><span class="dp-dot"></span>Scheduled</span>';
      return '<span class="dp-status-badge dp-badge-expired"><span class="dp-dot"></span>Expired</span>';
    }

    function dpTags(p) {
      const tags = [];
      if (p.minSpend > 0) tags.push('<span class="dp-tag">Min ฿' + p.minSpend + '</span>');
      tags.push('<span class="dp-tag">' + (p.days.length === 7 ? 'Every day' : p.days.join(', ')) + '</span>');
      if (p.end) {
        const diff = Math.ceil((new Date(p.end) - new Date()) / 86400000);
        if (p.status !== 'expired' && diff >= 0 && diff <= 7)
          tags.push('<span class="dp-tag dp-tag-warn">⚠ Expires in ' + diff + 'd</span>');
        else if (p.status === 'expired')
          tags.push('<span class="dp-tag dp-tag-expired-info">Ended ' + p.end + '</span>');
        else
          tags.push('<span class="dp-tag">Expires ' + p.end + '</span>');
      } else {
        tags.push('<span class="dp-tag">No expiry</span>');
      }
      tags.push('<span class="dp-tag">' + (p.autoApply ? 'Auto-applied' : 'Code required') + '</span>');
      return tags.join('');
    }

    function dpUsageBar(p) {
      if (!p.limit) {
        return '<div class="dp-usage-row"><div class="dp-usage-header"><span>Usage</span><span>' + (p.used||0) + ' / unlimited</span></div><div class="dp-usage-bar-track"><div class="dp-usage-bar-fill unlimited"></div></div></div>';
      }
      const pct = Math.min(100, Math.round(((p.used||0) / p.limit) * 100));
      return '<div class="dp-usage-row"><div class="dp-usage-header"><span>Usage</span><span>' + (p.used||0) + ' / ' + p.limit + '</span></div><div class="dp-usage-bar-track"><div class="dp-usage-bar-fill" style="width:' + pct + '%"></div></div></div>';
    }

    function dpBuildCard(p) {
      const val = dpGetVal(p);
      const valHtml = val.bogo
        ? '<div class="dp-val-bogo">' + val.big + '</div><span class="dp-val-unit">' + val.unit + '</span>'
        : '<div class="dp-val-big">'  + val.big + '</div><span class="dp-val-unit">' + val.unit + '</span>';
      const isExpired = p.status === 'expired';
      const actionBtns = isExpired
        ? '<div class="dp-card-btns"><button class="dp-btn-dup" onclick="dpDuplicate(' + p.id + ')">Duplicate</button><button class="dp-btn-del" onclick="dpDeletePromo(' + p.id + ')">Delete</button></div>'
        : '<div class="dp-card-btns"><button class="dp-btn-edit" onclick="dpOpenEdit(' + p.id + ')">Edit</button><button class="dp-btn-del" onclick="dpDeletePromo(' + p.id + ')">Delete</button></div>';
      const toggleHtml = !isExpired
        ? '<div class="dp-card-toggle"><label class="dp-toggle-switch"><input type="checkbox" ' + (p.active ? 'checked' : '') + ' onchange="dpToggle(' + p.id + ')"/><span class="dp-toggle-slider"></span></label></div>'
        : '<div></div>';
      return '<div class="dp-card" data-id="' + p.id + '">' +
        '<div class="dp-card-top"><div class="dp-card-left"><span class="dp-card-code">' + p.code + '</span>' + dpBadge(p) + '</div><div class="dp-card-value">' + valHtml + '</div></div>' +
        '<div class="dp-card-name">' + p.name + '</div>' +
        '<div class="dp-card-desc">' + p.desc + '</div>' +
        '<div class="dp-tags">'      + dpTags(p) + '</div>' +
        dpUsageBar(p) +
        '<div class="dp-card-actions">' + toggleHtml + actionBtns + '</div>' +
        '</div>';
    }

    function dpRender() {
      const grid = document.getElementById('promoCardsGrid');
      const fil  = dpFilter === 'all' ? promos : promos.filter(p => p.status === dpFilter);

      document.getElementById('countAll').textContent       = promos.length;
      document.getElementById('countActive').textContent    = promos.filter(p => p.status === 'active').length;
      document.getElementById('countScheduled').textContent = promos.filter(p => p.status === 'scheduled').length;
      document.getElementById('countExpired').textContent   = promos.filter(p => p.status === 'expired').length;
      document.getElementById('statActive').textContent     = promos.filter(p => p.status === 'active').length;

      const expiring = promos.filter(p => {
        if (!p.end || p.status !== 'active') return false;
        const diff = Math.ceil((new Date(p.end) - new Date()) / 86400000);
        return diff >= 0 && diff <= 7;
      }).length;
      document.getElementById('statExpiring').textContent = expiring > 0 ? expiring + ' expiring this week' : 'All clear this week';

      if (!fil.length) { grid.innerHTML = '<div class="dp-empty"><div class="dp-empty-icon">🎟️</div><p>No promotions in this category.</p></div>'; return; }
      grid.innerHTML = fil.map(dpBuildCard).join('');
    }

    window.dpToggle = async function (id) {
      const p = promos.find(x => x.id === id);
      if (!p || p.status === 'expired') return;
      const newStatus = p.active ? 'scheduled' : 'active';
      try {
        await fetch(`/api/discounts/${id}/status`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        p.active = !p.active;
        p.status = newStatus;
        dpRender();
      } catch(e) { alert('Could not update discount.'); }
    };

    window.dpDeletePromo = async function (id) {
      if (!confirm('Delete this promotion?')) return;
      try {
        await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
        promos = promos.filter(x => x.id !== id);
        dpRender();
      } catch(e) { alert('Could not delete promotion.'); }
    };

    window.dpDuplicate = async function (id) {
      const p = promos.find(x => x.id === id);
      if (!p) return;
      try {
        const copy = Object.assign({}, p, { id: null, code: p.code + '_COPY', name: p.name + ' (Copy)', status: 'active', active: true, used: 0 });
        const saved = await dpApiSave(copy, null);
        promos.push(saved);
        dpRender();
      } catch(e) { alert('Could not duplicate promotion.'); }
    };

    window.dpSelectType = function (type) {
      document.getElementById('pmType').value = type;
      document.querySelectorAll('.pm-type-card').forEach(c => c.classList.toggle('selected', c.dataset.value === type));
      const isBogo = type === 'bogo';
      const vf  = document.getElementById('pmValueField');
      const bf  = document.getElementById('pmBogoField');
      const bgf = document.getElementById('pmBogoGetField');
      if (vf)  vf.style.display  = isBogo ? 'none' : '';
      if (bf)  bf.style.display  = isBogo ? '' : 'none';
      if (bgf) bgf.style.display = isBogo ? '' : 'none';
    };

    function dpClearForm() {
      ['pmCode','pmName','pmValue','pmBuyQty','pmGetQty','pmDesc','pmMinSpend','pmStart','pmEnd'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const pt = document.getElementById('pmType'); if (pt) pt.value = '';
      const pa = document.getElementById('pmAppliesTo'); if (pa) pa.value = 'all';
      const paa = document.getElementById('pmAutoApplySelect'); if (paa) paa.value = 'code';
      document.querySelectorAll('.pm-type-card').forEach(c => c.classList.remove('selected'));
      const vf = document.getElementById('pmValueField'); if (vf) vf.style.display = '';
      const bf = document.getElementById('pmBogoField');  if (bf) bf.style.display = 'none';
    }

    window.dpOpenEdit = function (id) {
      const p = promos.find(x => x.id === id);
      if (!p) return;
      dpEditing = id;
      document.getElementById('pmTitle').textContent = 'Edit Promotion';
      dpClearForm();
      document.getElementById('pmCode').value  = p.code;
      document.getElementById('pmName').value  = p.name;
      document.getElementById('pmDesc').value  = p.desc || '';
      document.getElementById('pmStart').value = p.start || '';
      document.getElementById('pmEnd').value   = p.end   || '';
      if (p.minSpend) document.getElementById('pmMinSpend').value = p.minSpend;
      if (p.appliesTo) { const el = document.getElementById('pmAppliesTo'); if (el) el.value = p.appliesTo; }
      if (p.autoApply) { const el = document.getElementById('pmAutoApplySelect'); if (el) el.value = 'auto'; }
      if (p.type) dpSelectType(p.type);
      if (p.type !== 'bogo' && p.value != null) document.getElementById('pmValue').value = p.value;
      dpModal.show();
    };

    async function dpSave() {
      const code = (document.getElementById('pmCode').value || '').trim().toUpperCase();
      const name = (document.getElementById('pmName').value || '').trim();
      const type = (document.getElementById('pmType').value || '').trim();
      if (!code) { alert('Please enter a promo code.');     return; }
      if (!name) { alert('Please enter a promotion name.'); return; }
      if (!type) { alert('Please select a discount type.'); return; }

      const startVal = document.getElementById('pmStart').value;
      const endVal   = document.getElementById('pmEnd').value;
      const now = new Date(); now.setHours(0,0,0,0);
      let status = 'active';
      if (startVal && new Date(startVal) > now) status = 'scheduled';
      if (endVal && new Date(endVal) < now)     status = 'expired';

      const aaSel = document.getElementById('pmAutoApplySelect');
      const autoApply = aaSel ? aaSel.value === 'auto' : false;
      const pmAppliesTo = document.getElementById('pmAppliesTo');

      const data = {
        code, name, type,
        value: type !== 'bogo' ? (parseFloat(document.getElementById('pmValue').value) || 0) : 0,
        bogoB: null, bogoG: null,
        desc:      (document.getElementById('pmDesc').value || '').trim(),
        minSpend:  parseInt(document.getElementById('pmMinSpend').value) || 0,
        appliesTo: pmAppliesTo ? pmAppliesTo.value : 'all',
        start: startVal, end: endVal,
        days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        limit: 0, autoApply, active: status === 'active', status,
      };

      try {
        const saved = await dpApiSave(data, dpEditing);
        if (dpEditing) {
          const idx = promos.findIndex(x => x.id === dpEditing);
          if (idx !== -1) promos[idx] = saved;
        } else {
          promos.push(saved);
        }
        dpModal.hide();
        dpRender();
      } catch(e) { alert('Could not save promotion: ' + e.message); }
    }

    document.querySelectorAll('.dp-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.dp-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        dpFilter = btn.dataset.filter;
        dpRender();
      });
    });

    document.getElementById('newPromoBtn').addEventListener('click', function () {
      dpEditing = null;
      document.getElementById('pmTitle').textContent = 'New Promotion';
      dpClearForm();
      dpModal.show();
    });

    const pmSaveBtn = document.getElementById('pmSaveBtn') || document.getElementById('savePromoBtn');
    if (pmSaveBtn) pmSaveBtn.addEventListener('click', dpSave);

    dpModal = new bootstrap.Modal(document.getElementById('promoModal'));
    dpLoad().then(() => dpRender());
  }
// Edit and add staff
  const fullNameInput = document.getElementById('asFullName');
  const roleSelect = document.getElementById('asRole');

  if (fullNameInput && roleSelect) {

    function updatePreview() {
      const fullName = fullNameInput.value.trim();

      document.getElementById('asNamePreview').textContent =
          fullName || 'Full Name';

      document.getElementById('asAvatarPreview').textContent =
          fullName ? fullName.charAt(0).toUpperCase() : '?';

      const roleText = roleSelect.options[roleSelect.selectedIndex]?.text;

      document.getElementById('asRolePreview').textContent =
          roleSelect.value ? roleText : 'Role';
    }

    fullNameInput.addEventListener('input', updatePreview);
    roleSelect.addEventListener('change', updatePreview);

    // ⭐ IMPORTANT: force preview update after DB values are rendered
    setTimeout(updatePreview, 0);
  }
}); /* end DOMContentLoaded */
