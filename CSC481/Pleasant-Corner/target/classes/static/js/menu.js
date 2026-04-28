// ══════════════════════════════════════════
//  PLEASANT CORNER – menu.js
// ══════════════════════════════════════════

// ── DATA ──
// menuItems is loaded from the backend on DOMContentLoaded via /api/menu-items
let menuItems    = [];
let activeFilter = 'All';
let searchVal    = '';
let editingId    = null;
let modal;

// ── API HELPERS ──
// Map frontend category string → backend enum value
function catToEnum(cat) {
  const map = { 'Coffee': 'COFFEE', 'Food': 'FOOD', 'Desserts': 'DESSERT', 'Dessert': 'DESSERT' };
  return map[cat] || cat.toUpperCase();
}
// Map backend enum → display label
function enumToCat(e) {
  const map = { 'COFFEE': 'Coffee', 'FOOD': 'Food', 'DESSERT': 'Desserts', 'DESSERTS': 'Desserts' };
  return map[e] || e;
}
// Map frontend type string → backend enum value
function typeToEnum(t) {
  const map = { 'Drink': 'DRINK', 'Food': 'FOOD' };
  return map[t] || t.toUpperCase();
}
// Map backend enum → display label
function enumToType(e) {
  const map = { 'DRINK': 'Drink', 'FOOD': 'Food' };
  return map[e] || e;
}

// Convert a backend MenuItem JSON → frontend object used by render()
function fromApi(item) {
  return {
    id:                  item.id,
    name:                item.itemName,
    cat:                 enumToCat(item.category),
    type:                enumToType(item.itemType),
    sub:                 item.itemType === 'DRINK' ? 'Drink' : 'Food',
    price:               Number(item.price),
    emoji:               item.emojiIcon  || '☕',
    desc:                item.description || '',
    avail:               item.available,
    featured:            item.featuredItem,
    photo:               item.imageUrl   || null,
    supportsDrinkStates: item.supportsDrinkStates !== false, // default true
    supportsToppings:    item.supportsToppings    !== false, // default true
    brightness: 0, contrast: 0, flipped: false, rotateDeg: 0, cropped: true,
  };
}

// Convert frontend object → backend MenuItem JSON for POST/PUT
function toApi(data) {
  const type = (data.type || '').toUpperCase();
  return {
    itemName:            data.name,
    category:            catToEnum(data.cat),
    itemType:            typeToEnum(data.type),
    description:         data.desc,
    price:               data.price,
    emojiIcon:           data.emoji,
    available:           data.avail,
    featuredItem:        data.featured,
    imageUrl:            data.photo || null,
    supportsDrinkStates: type === 'DRINK' ? (data.supportsDrinkStates !== false) : false,
    supportsToppings:    type === 'FOOD'  ? (data.supportsToppings    !== false) : false,
  };
}

async function apiLoadAll() {
  try {
    const res = await fetch('/api/menu-items');
    if (!res.ok) throw new Error('Load failed: ' + res.status);
    const items = await res.json();
    menuItems = items.map(fromApi);
  } catch (err) {
    console.error('Failed to load menu items:', err);
    menuItems = [];
  }
}

async function apiSave(data, id) {
  const url    = id ? `/api/menu-items/${id}` : '/api/menu-items';
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApi(data)),
  });
  if (!res.ok) throw new Error('Save failed: ' + res.status);
  return fromApi(await res.json());
}

async function apiDelete(id) {
  const res = await fetch(`/api/menu-items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed: ' + res.status);
}

async function apiToggleAvail(id, avail) {
  const res = await fetch(`/api/menu-items/${id}/available`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ available: avail }),
  });
  if (!res.ok) throw new Error('Toggle failed: ' + res.status);
}

// ── RENDER GRID ──
function render() {
  const grid = document.getElementById('menuGrid');
  const filtered = menuItems.filter(m => {
    const matchCat    = activeFilter === 'All' || m.cat === activeFilter;
    const matchSearch = m.name.toLowerCase().includes(searchVal.toLowerCase());
    return matchCat && matchSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>No items found.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map((m, i) => {
    const imgContent = m.photo
      ? `<img src="${m.photo}" alt="${m.name}" style="width:100%;height:100%;object-fit:cover;display:block;${m.flipped?'transform:scaleX(-1)':''}"/>`
      : `<span style="font-size:3.2rem">${m.emoji}</span>`;
    return `
      <div class="menu-card" style="animation-delay:${i * 0.045}s">
        <div class="card-img-wrap">${imgContent}</div>
        <div class="card-body-custom">
          <div class="card-name">${m.name}</div>
          <div class="card-meta">${m.cat} · ${m.sub}</div>
          <div class="card-price">฿${m.price}</div>
          <div class="card-actions">
            <div class="toggle-wrap">
              <label class="toggle-switch">
                <input type="checkbox" ${m.avail ? 'checked' : ''} onchange="toggleAvail(${m.id})"/>
                <span class="toggle-slider"></span>
              </label>
              <span class="toggle-label">${m.avail ? 'Available' : 'Unavailable'}</span>
            </div>
            <button class="btn-edit" onclick="openEdit(${m.id})">Edit</button>
            <button class="btn-del"  onclick="delItem(${m.id})">Del</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── TOGGLE AVAILABILITY ──
async function toggleAvail(id) {
  const m = menuItems.find(x => x.id === id);
  if (!m) return;
  const newAvail = !m.avail;
  try {
    await apiToggleAvail(id, newAvail);
    m.avail = newAvail;
    render();
  } catch (err) {
    console.error('Toggle availability failed:', err);
    alert('Could not update availability. Please try again.');
  }
}

// ── DELETE ──
let pendingDeleteId = null;
function delItem(id) {
  pendingDeleteId = id;
  const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  deleteModal.show();
}

// ══════════════════════════════════════════
//  MODAL – photo / adjust state
// ══════════════════════════════════════════
// ── Crop overlay helpers (defined globally so resetPhotoState can call them) ──
function hideCropOverlay() {
  const overlay  = document.getElementById('cropOverlay');
  const controls = document.getElementById('manualCropControls');
  const wrap     = document.getElementById('imPreviewWrap');
  if (overlay)  overlay.style.display  = 'none';
  if (controls) controls.style.display = 'none';
  if (wrap)     wrap.classList.remove('crop-active');
}

let currentPhotoDataUrl  = null;  // current working image (may be cropped)
let originalPhotoDataUrl = null;  // always the first-uploaded image – never mutated
let adjustState = { brightness: 0, contrast: 0, flipped: false, rotateDeg: 0, cropped: true };

function resetPhotoState() {
  currentPhotoDataUrl  = null;
  originalPhotoDataUrl = null;
  adjustState = { brightness: 0, contrast: 0, flipped: false, rotateDeg: 0, cropped: true };
  document.getElementById('imDropzone').style.display = '';
  document.getElementById('imPhotoEditor').style.display = 'none';
  document.getElementById('photoInput').value = '';
  hideCropOverlay();
  // reset sliders
  const bs = document.getElementById('adjBrightness');
  const cs = document.getElementById('adjContrast');
  if (bs) { bs.value = 0; document.getElementById('brightnessVal').textContent = '0'; }
  if (cs) { cs.value = 0; document.getElementById('contrastVal').textContent   = '0'; }
}

function applyImageFilters() {
  const img = document.getElementById('imPreviewImg');
  if (!img) return;
  const b = adjustState.brightness / 100;
  const c = adjustState.contrast   / 100;
  img.style.filter = `brightness(${1 + b * 0.5}) contrast(${1 + c * 0.5})`;
  const flipX = adjustState.flipped ? ' scaleX(-1)' : '';
  img.style.transform  = `rotate(${adjustState.rotateDeg}deg)${flipX}`;
  img.style.transition = 'transform 0.35s cubic-bezier(.4,0,.2,1), filter .25s';
  if (adjustState.cropped) {
    img.style.aspectRatio = '1/1';
    img.style.objectFit   = 'cover';
  } else {
    img.style.aspectRatio = '';
    img.style.objectFit   = 'contain';
  }
}

function getProcessedDataUrl() {
  const img    = document.getElementById('imPreviewImg');
  const size   = 400;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx    = canvas.getContext('2d');
  const b = adjustState.brightness / 100;
  const c = adjustState.contrast   / 100;
  ctx.filter = `brightness(${1 + b * 0.5}) contrast(${1 + c * 0.5})`;
  const nw = img.naturalWidth, nh = img.naturalHeight;
  let sx, sy, sw, sh;
  if (adjustState.cropped) {
    const s = Math.min(nw, nh);
    sx = (nw - s) / 2; sy = (nh - s) / 2; sw = sh = s;
  } else {
    sx = 0; sy = 0; sw = nw; sh = nh;
  }
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(adjustState.rotateDeg * Math.PI / 180);
  if (adjustState.flipped) ctx.scale(-1, 1);
  ctx.drawImage(img, sx, sy, sw, sh, -size / 2, -size / 2, size, size);
  ctx.restore();
  return canvas.toDataURL('image/jpeg', 0.92);
}

function showPhotoEditor(dataUrl, filename, isOriginal) {
  currentPhotoDataUrl = dataUrl;
  if (isOriginal) originalPhotoDataUrl = dataUrl;  // only set on fresh upload
  document.getElementById('imDropzone').style.display    = 'none';
  document.getElementById('imPhotoEditor').style.display = '';
  const img = document.getElementById('imPreviewImg');
  img.src = dataUrl;
  document.getElementById('imFilename').textContent = filename || '';
  applyImageFilters();
}

function handleTypeChange() {
  const type = (document.getElementById('mType').value || '').toUpperCase();
  const body = document.getElementById('customBody');
  if (type === 'DRINK') {
    body.innerHTML = `
      <div class="im-toggle-row" style="margin-bottom:10px">
        <div>
          <div class="im-toggle-title">Supports drink states</div>
          <div class="im-toggle-sub">Customer selects Hot / Iced / Blended</div>
        </div>
        <label class="im-toggle-switch">
          <input type="checkbox" id="mDrinkStates" checked onchange="toggleDrinkStates()"/>
          <span class="im-toggle-slider"></span>
        </label>
      </div>
      <div id="defaultStateWrap">
        <div class="im-ds-label">Default Drink State</div>
        <select class="im-input" id="mDefaultState">
          <option>Hot</option>
          <option>Iced</option>
          <option>Blended</option>
        </select>
      </div>`;
  } else if (type === 'FOOD') {
    body.innerHTML = `
      <div class="im-toggle-row">
        <div>
          <div class="im-toggle-title">Supports toppings</div>
          <div class="im-toggle-sub">Customer can add extra toppings</div>
        </div>
        <label class="im-toggle-switch">
          <input type="checkbox" id="mToppings" checked/>
          <span class="im-toggle-slider"></span>
        </label>
      </div>`;
  } else {
    body.innerHTML = `<p class="im-custom-hint">Select an item type above to see customisation options.</p>`;
  }
}

function toggleDrinkStates() {
  const checked = document.getElementById('mDrinkStates').checked;
  document.getElementById('defaultStateWrap').style.display = checked ? '' : 'none';
}

// ── BUILD sub-label from form ──
function buildSub(type) {
  // type may be 'DRINK'/'FOOD' (from select value) or 'Drink'/'Food' (legacy)
  const t = (type || '').toUpperCase();
  if (t === 'DRINK') {
    const ds = document.getElementById('mDrinkStates');
    if (ds && ds.checked) {
      return 'Hot / Iced';
    }
    return 'Drink';
  }
  if (t === 'FOOD') {
    const tp = document.getElementById('mToppings');
    return (tp && tp.checked) ? 'Toppings' : 'Food';
  }
  return '';
}

// ── OPEN MODAL helpers ──
function resetModal() {
  document.getElementById('mName').value  = '';
  document.getElementById('mCat').value   = '';
  document.getElementById('mType').value  = '';
  document.getElementById('mPrice').value = '0';
  document.getElementById('mEmoji').value = '';
  document.getElementById('mDesc').value  = '';
  document.getElementById('mAvail').checked    = true;
  document.getElementById('mFeatured').checked = false;
  document.getElementById('customBody').innerHTML = `<p class="im-custom-hint">Select an item type above to see customisation options.</p>`;
  adjustState = { brightness: 0, contrast: 0, flipped: false, rotateDeg: 0, cropped: true };
  syncAdjustButtons();
  resetPhotoState();
}

function populateModal(m) {
  document.getElementById('mName').value  = m.name;
  document.getElementById('mPrice').value = m.price;
  document.getElementById('mEmoji').value = m.emoji;
  document.getElementById('mDesc').value  = m.desc || '';
  document.getElementById('mAvail').checked    = m.avail;
  document.getElementById('mFeatured').checked = m.featured || false;
  // m.type is already 'Drink'/'Food' from fromApi(); map to select enum values
  document.getElementById('mCat').value  = catToEnum(m.cat);
  document.getElementById('mType').value = typeToEnum(m.type);
  handleTypeChange();
  // set drink state / toppings if applicable
  if (m.type === 'Drink' || m.type === 'DRINK') {
    const ds = document.getElementById('mDrinkStates');
    if (ds) ds.checked = m.supportsDrinkStates !== false;
    toggleDrinkStates();
  }
  if (m.type === 'Food' || m.type === 'FOOD') {
    const tp = document.getElementById('mToppings');
    if (tp) tp.checked = m.supportsToppings !== false;
  }
  adjustState = {
    brightness: m.brightness || 0,
    contrast:   m.contrast   || 0,
    flipped:    m.flipped    || false,
    rotateDeg:  m.rotateDeg  || 0,
    cropped:    m.cropped !== undefined ? m.cropped : true,
  };
  syncAdjustButtons();
  if (m.photo) {
    showPhotoEditor(m.photo, 'Saved photo');
  } else {
    resetPhotoState();
  }
}

function syncAdjustButtons() {
  const autoCrop   = document.getElementById('adjAutoCrop');
  const manualCrop = document.getElementById('adjManualCrop');
  const flipBtn    = document.getElementById('adjFlip');
  const rotateCW   = document.getElementById('adjRotateCW');
  if (autoCrop)   autoCrop.classList.toggle('im-adj-active',   adjustState.cropped);
  if (manualCrop) manualCrop.classList.toggle('im-adj-active', false); // never stays active
  if (flipBtn)    flipBtn.classList.toggle('im-adj-active',    adjustState.flipped);
  if (rotateCW)   rotateCW.classList.toggle('im-adj-active',   adjustState.rotateDeg !== 0);
  // sync sliders
  const bs = document.getElementById('adjBrightness');
  const cs = document.getElementById('adjContrast');
  if (bs) { bs.value = adjustState.brightness; document.getElementById('brightnessVal').textContent = adjustState.brightness; }
  if (cs) { cs.value = adjustState.contrast;   document.getElementById('contrastVal').textContent   = adjustState.contrast;   }
}

// ── OPEN EDIT ──
function openEdit(id) {
  const m = menuItems.find(x => x.id === id);
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Menu Item';
  populateModal(m);
  modal.show();
}

// ══════════════════════════════════════════
//  SIDEBAR TOGGLE  (initialised inside DOMContentLoaded)
// ══════════════════════════════════════════
let sidebarOpen = true;

function isMobile() { return window.innerWidth <= 640; }

function setSidebar(open) {
  const sidebar   = document.getElementById('sidebar');
  const mainPanel = document.getElementById('mainPanel');
  const overlay   = document.getElementById('sidebarOverlay');
  sidebarOpen = open;
  if (isMobile()) {
    sidebar.classList.toggle('mobile-open', open);
    overlay.classList.toggle('show', open);
  } else {
    sidebar.classList.toggle('collapsed', !open);
    mainPanel.classList.toggle('expanded', !open);
  }
}

function initSidebar() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const overlay      = document.getElementById('sidebarOverlay');
  if (hamburgerBtn) hamburgerBtn.addEventListener('click', () => setSidebar(!sidebarOpen));
  if (overlay)      overlay.addEventListener('click',      () => setSidebar(false));
  window.addEventListener('resize', () => {
    const sidebar   = document.getElementById('sidebar');
    const mainPanel = document.getElementById('mainPanel');
    const overlay2  = document.getElementById('sidebarOverlay');
    if (!isMobile()) {
      if (overlay2)  overlay2.classList.remove('show');
      if (sidebar)   sidebar.classList.remove('mobile-open');
      if (sidebarOpen && sidebar)   sidebar.classList.remove('collapsed');
      if (sidebarOpen && mainPanel) mainPanel.classList.remove('expanded');
    }
  });
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
window.addEventListener('DOMContentLoaded', async () => {
  initSidebar();
  modal = new bootstrap.Modal(document.getElementById('itemModal'));

  // ── LOAD FROM BACKEND ──
  await apiLoadAll();
  render();

  // ── DELETE CONFIRM MODAL ──
  let deleteModalBS = new bootstrap.Modal(document.getElementById('deleteModal'));
  // Override delItem to use the modal instance
  window.delItem = function(id) {
    pendingDeleteId = id;
    deleteModalBS.show();
  };
  document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (pendingDeleteId == null) return;
    try {
      await apiDelete(pendingDeleteId);
      menuItems = menuItems.filter(x => x.id !== pendingDeleteId);
      pendingDeleteId = null;
      deleteModalBS.hide();
      render();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Could not delete item. Please try again.');
    }
  });

  // ── ADD ITEM BUTTON ──
  document.getElementById('addItemBtn').addEventListener('click', () => {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Add Menu Item';
    resetModal();
    modal.show();
  });

  // ── SAVE ITEM ──
  document.getElementById('saveItemBtn').addEventListener('click', () => saveItem(false));
  document.getElementById('saveDraftBtn').addEventListener('click', () => saveItem(true));

  async function saveItem(draft) {
    const name  = document.getElementById('mName').value.trim();
    const price = parseFloat(document.getElementById('mPrice').value) || 0;
    const cat   = document.getElementById('mCat').value;
    const type  = document.getElementById('mType').value;
    const emoji = document.getElementById('mEmoji').value.trim() || '☕';
    const desc  = document.getElementById('mDesc').value.trim();
    const avail = document.getElementById('mAvail').checked && !draft;
    const featured = document.getElementById('mFeatured').checked;

    if (!name)  { alert('Please enter an item name.');  return; }
    if (!cat)   { alert('Please select a category.');   return; }
    if (!type)  { alert('Please select an item type.'); return; }

    const sub   = buildSub(type);
    const dsEl  = document.getElementById('mDrinkStates');
    const tpEl  = document.getElementById('mToppings');
    const supportsDrinkStates = dsEl ? dsEl.checked : true;
    const supportsToppings    = tpEl ? tpEl.checked : true;
    const photo = currentPhotoDataUrl ? getProcessedDataUrl() : (editingId ? menuItems.find(x=>x.id===editingId)?.photo || null : null);

    const data = {
      name, cat, type, sub, price, emoji, desc, avail, featured, photo,
      supportsDrinkStates,
      supportsToppings,
      brightness: adjustState.brightness,
      contrast:   adjustState.contrast,
      flipped:    adjustState.flipped,
      rotateDeg:  adjustState.rotateDeg,
      cropped:    adjustState.cropped,
    };

    try {
      const saved = await apiSave(data, editingId || null);
      // Merge adjustments that the backend doesn't store
      saved.brightness = data.brightness;
      saved.contrast   = data.contrast;
      saved.flipped    = data.flipped;
      saved.rotateDeg  = data.rotateDeg;
      saved.cropped    = data.cropped;

      if (editingId) {
        const idx = menuItems.findIndex(x => x.id === editingId);
        if (idx !== -1) menuItems[idx] = saved;
      } else {
        menuItems.push(saved);
      }
      modal.hide();
      render();
    } catch (err) {
      console.error('Save failed:', err);
      alert('Could not save item. Please try again.');
    }
  }

  // ── PHOTO UPLOAD ──
  const dropzone   = document.getElementById('imDropzone');
  const photoInput = document.getElementById('photoInput');

  dropzone.addEventListener('click',    () => photoInput.click());
  document.getElementById('browseBtn').addEventListener('click', e => { e.stopPropagation(); photoInput.click(); });

  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave',()  => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop',  e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) loadPhoto(file);
  });

  photoInput.addEventListener('change', () => {
    if (photoInput.files[0]) loadPhoto(photoInput.files[0]);
  });

  function loadPhoto(file) {
    if (!file.type.startsWith('image/')) { alert('Please upload an image file.'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      originalPhotoDataUrl = e.target.result;
      showPhotoEditor(e.target.result, file.name, true);
    };
    reader.readAsDataURL(file);
  }

  document.getElementById('removePhoto').addEventListener('click', () => resetPhotoState());

  // ── REVERT TO ORIGINAL ──
  document.getElementById('revertPhoto').addEventListener('click', () => {
    if (!originalPhotoDataUrl) return;
    currentPhotoDataUrl = originalPhotoDataUrl;
    // Reset all adjustments
    adjustState = { brightness: 0, contrast: 0, flipped: false, rotateDeg: 0, cropped: true };
    hideCropOverlay();
    syncAdjustButtons();
    showPhotoEditor(originalPhotoDataUrl, document.getElementById('imFilename').textContent, false);
  });

  // ── BRIGHTNESS SLIDER ──
  document.getElementById('adjBrightness').addEventListener('input', function() {
    adjustState.brightness = parseInt(this.value);
    document.getElementById('brightnessVal').textContent = this.value;
    applyImageFilters();
  });

  // ── CONTRAST SLIDER ──
  document.getElementById('adjContrast').addEventListener('input', function() {
    adjustState.contrast = parseInt(this.value);
    document.getElementById('contrastVal').textContent = this.value;
    applyImageFilters();
  });

  // ── AUTO CROP ──
  document.getElementById('adjAutoCrop').addEventListener('click', () => {
    hideCropOverlay();
    adjustState.cropped = true;
    syncAdjustButtons();
    applyImageFilters();
  });

  // ── MANUAL CROP ──
  document.getElementById('adjManualCrop').addEventListener('click', () => {
    // Always revert to original before entering crop mode
    if (originalPhotoDataUrl) {
      currentPhotoDataUrl = originalPhotoDataUrl;
      document.getElementById('imPreviewImg').src = originalPhotoDataUrl;
      adjustState.cropped = false;
      applyImageFilters();
    }
    startCropOverlay();
  });

  // ── FLIP (mirror horizontal) ──
  document.getElementById('adjFlip').addEventListener('click', () => {
    adjustState.flipped = !adjustState.flipped;
    syncAdjustButtons();
    applyImageFilters();
  });

  // ── ROTATE CW 90° ──
  document.getElementById('adjRotateCW').addEventListener('click', () => {
    adjustState.rotateDeg = (adjustState.rotateDeg + 90) % 360;
    syncAdjustButtons();
    applyImageFilters();
  });

  // ══════════════════════════════════════════
  //  SVG CROP OVERLAY LOGIC
  // ══════════════════════════════════════════
  let cropState = { dragging: false, x0: 0, y0: 0, x1: 0, y1: 0 };

  function startCropOverlay() {
    const overlay  = document.getElementById('cropOverlay');
    const controls = document.getElementById('manualCropControls');
    const wrap     = document.getElementById('imPreviewWrap');
    overlay.style.display  = '';
    controls.style.display = '';
    wrap.classList.add('crop-active');
    cropState = { dragging: false, x0: 0, y0: 0, x1: 0, y1: 0 };
    updateCropSVG(0, 0, 0, 0);
  }

  function hideCropOverlay() {
    const overlay  = document.getElementById('cropOverlay');
    const controls = document.getElementById('manualCropControls');
    const wrap     = document.getElementById('imPreviewWrap');
    if (overlay)  overlay.style.display  = 'none';
    if (controls) controls.style.display = 'none';
    if (wrap)     wrap.classList.remove('crop-active');
    cropState.dragging = false;
  }

  function updateCropSVG(x, y, w, h) {
    const hole   = document.getElementById('cropHole');
    const border = document.getElementById('cropBorder');
    const cTL    = document.getElementById('cTL');
    const cTR    = document.getElementById('cTR');
    const cBL    = document.getElementById('cBL');
    const cBR    = document.getElementById('cBR');
    const hw = 10, hh = 10;
    [hole, border].forEach(el => {
      el.setAttribute('x', x); el.setAttribute('y', y);
      el.setAttribute('width', w); el.setAttribute('height', h);
    });
    cTL.setAttribute('x', x - hw/2);      cTL.setAttribute('y', y - hh/2);
    cTR.setAttribute('x', x + w - hw/2);  cTR.setAttribute('y', y - hh/2);
    cBL.setAttribute('x', x - hw/2);      cBL.setAttribute('y', y + h - hh/2);
    cBR.setAttribute('x', x + w - hw/2);  cBR.setAttribute('y', y + h - hh/2);
  }

  function pctCoords(e) {
    const overlay = document.getElementById('cropOverlay');
    const rect    = overlay.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width)  * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top)  / rect.height) * 100)),
    };
  }

  const cropOverlayEl = document.getElementById('cropOverlay');

  function onCropDown(e) {
    e.preventDefault();
    const p = pctCoords(e);
    cropState = { dragging: true, x0: p.x, y0: p.y, x1: p.x, y1: p.y };
    updateCropSVG(p.x + '%', p.y + '%', '0%', '0%');
  }
  function onCropMove(e) {
    if (!cropState.dragging) return;
    e.preventDefault();
    const p = pctCoords(e);
    cropState.x1 = p.x; cropState.y1 = p.y;
    const x = Math.min(cropState.x0, cropState.x1) + '%';
    const y = Math.min(cropState.y0, cropState.y1) + '%';
    const w = Math.abs(cropState.x1 - cropState.x0) + '%';
    const h = Math.abs(cropState.y1 - cropState.y0) + '%';
    updateCropSVG(x, y, w, h);
  }
  function onCropUp(e) {
    cropState.dragging = false;
  }

  cropOverlayEl.addEventListener('mousedown',  onCropDown);
  cropOverlayEl.addEventListener('mousemove',  onCropMove);
  cropOverlayEl.addEventListener('mouseup',    onCropUp);
  cropOverlayEl.addEventListener('touchstart', onCropDown, { passive: false });
  cropOverlayEl.addEventListener('touchmove',  onCropMove, { passive: false });
  cropOverlayEl.addEventListener('touchend',   onCropUp);

  document.getElementById('applyCropBtn').addEventListener('click', () => {
    const x0pct = Math.min(cropState.x0, cropState.x1) / 100;
    const y0pct = Math.min(cropState.y0, cropState.y1) / 100;
    const wpct  = Math.abs(cropState.x1 - cropState.x0) / 100;
    const hpct  = Math.abs(cropState.y1 - cropState.y0) / 100;
    if (wpct < 0.03 || hpct < 0.03) { alert('Please draw a larger crop area.'); return; }

    // Draw cropped region from the original image onto a canvas
    const srcImg = new Image();
    srcImg.onload = () => {
      const nw = srcImg.naturalWidth, nh = srcImg.naturalHeight;
      const sx = x0pct * nw, sy = y0pct * nh;
      const sw = wpct  * nw, sh = hpct  * nh;
      const out = document.createElement('canvas');
      out.width = sw; out.height = sh;
      const ctx = out.getContext('2d');
      ctx.drawImage(srcImg, sx, sy, sw, sh, 0, 0, sw, sh);
      const croppedUrl = out.toDataURL('image/jpeg', 0.92);
      currentPhotoDataUrl = croppedUrl;
      // Do NOT overwrite originalPhotoDataUrl — keeps re-crop working
      hideCropOverlay();
      adjustState.cropped = false;
      syncAdjustButtons();
      const fname = document.getElementById('imFilename').textContent;
      showPhotoEditor(croppedUrl, fname, false);
    };
    srcImg.src = originalPhotoDataUrl; // always crop from original
  });

  document.getElementById('cancelCropBtn').addEventListener('click', () => {
    hideCropOverlay();
    adjustState.cropped = true;
    // restore original image if we had reverted it
    if (originalPhotoDataUrl) {
      currentPhotoDataUrl = originalPhotoDataUrl;
      showPhotoEditor(originalPhotoDataUrl, document.getElementById('imFilename').textContent, false);
    }
    syncAdjustButtons();
  });

  // ── FILTERS ──
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.cat;
      render();
    });
  });

  // ── SEARCH ──
  document.getElementById('searchInput').addEventListener('input', e => {
    searchVal = e.target.value;
    render();
  });

  render();
});

