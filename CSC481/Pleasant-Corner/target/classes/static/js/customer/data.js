/* ================================================================
   Pleasant Corner — customer/data.js
   Builds MENU_ITEMS from BACKEND_MENU injected by Thymeleaf.
   Also maps BACKEND_TOPPINGS and BACKEND_DRINK_STATES globally.
   Falls back to empty array if not available.
   ================================================================ */

'use strict';

// All available toppings from admin DB
const ALL_TOPPINGS = (typeof BACKEND_TOPPINGS !== 'undefined' && Array.isArray(BACKEND_TOPPINGS))
  ? BACKEND_TOPPINGS.map(function(t) {
      return {
        id:             String(t.id),
        name:           t.name,
        emoji:          t.emoji || '',
        priceAdjustment: Number(t.priceAdjustment || 0),
        description:    t.description || ''
      };
    })
  : [];

// All drink states from admin DB
const ALL_DRINK_STATES = (typeof BACKEND_DRINK_STATES !== 'undefined' && Array.isArray(BACKEND_DRINK_STATES))
  ? BACKEND_DRINK_STATES.map(function(d) {
      return {
        id:             String(d.id),
        name:           d.name,
        emoji:          d.emoji || '',
        priceAdjustment: Number(d.priceAdjustment || 0),
        isDefault:      d.defaultState || false
      };
    })
  : [];

// Map backend MenuItem entities to the shape app.js expects
const MENU_ITEMS = (typeof BACKEND_MENU !== 'undefined' && Array.isArray(BACKEND_MENU))
  ? BACKEND_MENU.map(function(item) {
      var isDrink = (item.itemType === 'DRINK');
      // Always show drinkStates for drinks, toppings for food/dessert.
      // supportsDrinkStates / supportsToppings flags can be NULL in DB for
      // existing rows (added after initial seed) — so we do NOT rely on them
      // to decide whether to show options. Use itemType only.
      return {
        id:          String(item.id),
        backendId:   item.id,
        name:        item.itemName,
        price:       Number(item.price || 0),
        emoji:       item.emojiIcon || '☕',
        category:    item.category || 'OTHER',
        itemType:    item.itemType || 'FOOD',
        description: item.description || '',
        imageUrl:    item.imageUrl || '',
        toppings:    isDrink ? [] : ALL_TOPPINGS,
        drinkStates: isDrink ? ALL_DRINK_STATES : []
      };
    })
  : [];

/* ── Cart ──────────────────────────────────────────────────────── */
const cart = {
  items: [],
  discountCode:   '',
  discountType:   '',   // 'percent' | 'fixed' | 'bogo'
  discountValue:  0,

  add(itemData) {
    this.items.push({ ...itemData });
    this._notify();
  },

  updateQty(index, delta) {
    const newQty = this.items[index].qty + delta;
    if (newQty < 1) return;
    this.items[index].qty = newQty;
    this._notify();
  },

  remove(index) {
    this.items.splice(index, 1);
    this._notify();
  },

  clear() {
    this.items         = [];
    this.discountCode  = '';
    this.discountType  = '';
    this.discountValue = 0;
    this._notify();
  },

  /** Raw sum before discount */
  get subtotal() {
    return this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  },

  /** Amount saved by discount */
  get discountAmount() {
    if (!this.discountType) return 0;
    const sub = this.subtotal;
    if (this.discountType === 'percent') return sub * (this.discountValue / 100);
    if (this.discountType === 'fixed')   return Math.min(this.discountValue, sub);
    if (this.discountType === 'bogo') {
      // Buy-one-get-one: cheapest item is free (one per order)
      const prices = this.items.map(i => i.price).sort((a, b) => a - b);
      return prices.length > 0 ? prices[0] : 0;
    }
    return 0;
  },

  /** Total after discount */
  get total() {
    return Math.max(0, this.subtotal - this.discountAmount);
  },

  get count() {
    return this.items.reduce((sum, i) => sum + i.qty, 0);
  },

  _listeners: [],
  subscribe(fn) { this._listeners.push(fn); },
  _notify()    { this._listeners.forEach(fn => fn()); },
};
