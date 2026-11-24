// ============================================================================
// catalog.js — all behaviour of the MarketCatalog page
// ----------------------------------------------------------------------------
// What this file does:
//   1. Keeps the app's data ("state"): products, cart, saved items, role, filters
//   2. Draws (renders) the product cards, filters, cart and product details
//   3. Listens to clicks, typing, and form submits, and updates the page
//   4. Remembers cart / saved items / merchant products in the browser (localStorage)
//
// It needs icons.js (icon helpers) and products.js (sampleProducts) loaded first.
// Only HTML, CSS and browser JavaScript are needed — no build tools.
// ============================================================================
'use strict';   // strict mode: JavaScript warns about common mistakes instead of ignoring them


// ----------------------------------------------------------------------------
// 1. SMALL HELPER FUNCTIONS
// ----------------------------------------------------------------------------

// Shortcut: $('cart-count') is the same as document.getElementById('cart-count')
const $ = id => document.getElementById(id);

// Makes text safe to put inside HTML. Characters like < > & " ' are replaced with
// harmless codes, so a product name such as "<b>Hi</b>" shows as text and is never run as code.
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// Formats a number as Indian rupees with Indian digit grouping, e.g. 1999 -> "₹1,999"
// (paise are shown only when the price really has them, e.g. 1999.5 -> "₹1,999.5")
const money = value => new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', minimumFractionDigits:0, maximumFractionDigits:2}).format(value);

// Reads a saved value from localStorage. All keys start with "mc." (MarketCatalog)
// so they never mix with other websites' data. Returns `fallback` if nothing is saved
// or the browser blocks storage.
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem('mc.' + key)) ?? fallback; }
  catch { return fallback; }
}

// Saves a value into localStorage. Returns true on success, false if storage is
// blocked or full (for example when a photo is too big).
function save(key, value) {
  try { localStorage.setItem('mc.' + key, JSON.stringify(value)); return true; }
  catch { return false; }
}

// Reads a saved list; always returns an array, even if the stored data is damaged.
function savedArray(key) {
  const value = load(key, []);
  return Array.isArray(value) ? value : [];
}


// ----------------------------------------------------------------------------
// 2. APP STATE (the data the page is built from)
// ----------------------------------------------------------------------------

// Products added earlier by a merchant, loaded from localStorage.
// The .filter() keeps only well-formed products, so corrupted data cannot break the page.
let additions = savedArray('products').filter(p =>
  p && typeof p.id === 'string' && typeof p.name === 'string' &&
  typeof p.vendor === 'string' && typeof p.category === 'string' &&
  typeof p.price === 'number' && p.price > 0 &&
  typeof p.rating === 'number' && p.rating >= 0 && p.rating <= 5);

// All products = merchant products first, then the built-in sample products
let products = [...additions, ...sampleProducts];

// Cart = list of { id, qty }. Only lines whose product still exists and whose
// quantity is a whole number from 1 to 999 are kept.
let cart = savedArray('cart').filter(line =>
  line && products.some(p => p.id === line.id) &&
  Number.isSafeInteger(line.qty) && line.qty > 0 && line.qty <= 999);

// Saved ("heart") product ids. A Set holds each id only once.
let saved = new Set(savedArray('saved').filter(id => products.some(p => p.id === id)));

// Current role: only "Merchant" or "Shopper" is allowed (Shopper is the default)
let role = load('role', 'Shopper') === 'Merchant' ? 'Merchant' : 'Shopper';

// Current page ('catalog' or 'saved') and current filter / sort choices
let view = 'catalog', search = '', minPrice = 0, maxPrice = 4000, rating = 0, sorting = 'featured';
const selectedVendors = new Set(), selectedCategories = new Set();

// Highest value of the price slider: at least ₹4,000, rounded up to the next ₹100
// above the most expensive product.
let limit = Math.max(4000, Math.ceil(Math.max(...products.map(p => p.price)) / 100) * 100);
maxPrice = limit;   // at the start the price filter allows everything

let noticeTimer;    // remembers the timer that hides the pop-up message


// ----------------------------------------------------------------------------
// 3. NOTIFICATION (small message at the bottom of the screen)
// ----------------------------------------------------------------------------

// Shows `message` for about 2.6 seconds, then hides it again.
function notify(message) {
  const el = $('notice');
  el.innerHTML = icon('check') + `<span>${escapeHtml(message)}</span>`;
  el.classList.add('show');
  clearTimeout(noticeTimer);                                          // restart the timer if another message arrives
  noticeTimer = setTimeout(() => el.classList.remove('show'), 2600);
}


// ----------------------------------------------------------------------------
// 4. PRODUCT IMAGES & FILTER LISTS
// ----------------------------------------------------------------------------

// Returns the HTML for a product picture.
// Only two kinds of image source are accepted: a local file "images/name.webp" or an
// uploaded photo (data: URL). Anything else, or a missing picture, shows a box icon instead.
function imageMarkup(p, cls = '', lazy = true) {
  const src = p.image || '';
  const valid = /^images\/[a-z0-9-]+\.webp$/.test(src) || /^data:image\/(jpeg|png|webp);base64,/.test(src);
  return valid
    ? `<img class="${cls}" src="${escapeHtml(src)}" alt="${escapeHtml(p.name)}" ${lazy ? 'loading="lazy"' : ''}>`
    : `<div class="image-fallback ${cls}" aria-label="No product photo">${icon('box')}</div>`;
}

// Returns the list of different values for one product field, without duplicates.
// listFor('vendor') -> ['Soundform', 'Fieldwork', ...]
function listFor(key) {
  return [...new Set(products.map(p => p[key]))];
}

// Rebuilds the filter sidebar: vendor + category checkboxes (with product counts),
// the hero numbers, the price slider/boxes, and the vendor suggestions of the merchant form.
function updateFilters() {
  // Vendor and category checkboxes. Each one gets a "checked" state from the matching Set.
  for (const [key, target, set] of [['vendor', 'vendor-filters', selectedVendors], ['category', 'category-filters', selectedCategories]]) {
    $(target).innerHTML = listFor(key).map(v =>
      `<label><input type="checkbox" data-filter="${key}" value="${escapeHtml(v)}" ${set.has(v) ? 'checked' : ''}><span>${escapeHtml(v)}</span><small>${products.filter(p => p[key] === v).length}</small></label>`
    ).join('');
  }

  // Numbers shown in the hero banner
  $('hero-products').textContent = products.length;
  $('hero-vendors').textContent = listFor('vendor').length;

  // Price slider, its labels and the two number boxes
  $('price-range').max = limit;
  $('price-range').value = maxPrice;
  $('range-output').textContent = money(maxPrice).replace('.00', '');
  $('max-price-label').textContent = money(limit);
  $('min-price').value = minPrice;
  $('max-price').value = maxPrice;
  $('max-price').max = limit;

  // Existing vendor names offered as suggestions in the merchant form
  $('vendor-list').innerHTML = listFor('vendor').map(v => `<option value="${escapeHtml(v)}"></option>`).join('');
}


// ----------------------------------------------------------------------------
// 5. PRODUCT GRID
// ----------------------------------------------------------------------------

// Returns the HTML for ONE product card. `i` is the card's position: the first three
// images load immediately, the rest are "lazy" (loaded only when scrolled near).
function card(p, i) {
  const fav = saved.has(p.id);   // is this product saved (hearted)?
  return `<article class="product-card"><div class="product-media"><button class="photo-button" data-detail="${escapeHtml(p.id)}" aria-label="View ${escapeHtml(p.name)} details">${imageMarkup(p, '', i > 2)}</button><span class="cat-label">${escapeHtml(p.category)}</span><button data-save="${escapeHtml(p.id)}" class="heart-button ${fav ? 'saved' : ''}" aria-label="${fav ? 'Unsave' : 'Save'} ${escapeHtml(p.name)}" aria-pressed="${fav}">${icon('heart')}</button></div><div class="product-body"><div class="product-meta"><span class="vendor">${icon('store')}${escapeHtml(p.vendor)}</span><span class="rating" aria-label="Rated ${p.rating} out of 5"><span class="star">★</span>${p.rating.toFixed(1)}</span></div><button class="product-title" data-detail="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button><div class="card-bottom"><strong class="price">${money(p.price)}</strong><button class="add-button" data-add="${escapeHtml(p.id)}" aria-label="Add ${escapeHtml(p.name)} to cart">${icon('plus')}Add to cart</button></div></div></article>`;
}

// Works out which products match ALL current filters, sorts them, and draws the grid.
// Called every time the search text, a filter, the sort order, or the saved list changes.
function renderProducts() {
  // --- Step 1: filter ---------------------------------------------------------
  // A product stays in the list only if it passes every test below.
  let matches = products.filter(p =>
    (view !== 'saved' || saved.has(p.id)) &&                                  // on the Saved page: only hearted products
    [p.name, p.vendor, p.category].some(v => v.toLowerCase().includes(search.toLowerCase().trim())) &&  // search text is in name, vendor or category
    (!selectedVendors.size || selectedVendors.has(p.vendor)) &&               // vendor filter (none selected = allow all)
    (!selectedCategories.size || selectedCategories.has(p.category)) &&       // category filter (none selected = allow all)
    p.price >= minPrice && p.price <= maxPrice &&                             // inside the chosen price range
    p.rating >= rating);                                                      // at least the chosen minimum rating

  // --- Step 2: sort -----------------------------------------------------------
  if (sorting === 'low')    matches.sort((a, b) => a.price - b.price);         // cheapest first
  if (sorting === 'high')   matches.sort((a, b) => b.price - a.price);         // most expensive first
  if (sorting === 'rating') matches.sort((a, b) => b.rating - a.rating);       // best rated first
  if (sorting === 'new')    matches.sort((a, b) => (b.created || 0) - (a.created || 0));  // newest first (only merchant products have a date)

  // --- Step 3: update counters ------------------------------------------------
  $('result-count').textContent = matches.length + ' product' + (matches.length === 1 ? '' : 's');
  $('saved-count').textContent = saved.size || '';   // empty text hides the badge when nothing is saved

  // --- Step 4: draw the cards, or an "empty" message if nothing matches --------
  if (matches.length) {
    $('product-grid').innerHTML = matches.map(card).join('');
    $('end-results').textContent = `Showing ${matches.length} of ${view === 'saved' ? saved.size : products.length} products`;
  } else {
    // "emptySaved" = the Saved page is empty because the user has not hearted anything yet
    const emptySaved = view === 'saved' && !saved.size;
    $('product-grid').innerHTML = `<div class="empty-state"><span class="empty-icon">${icon(emptySaved ? 'heart' : 'search')}</span><h3>${emptySaved ? 'Your saved finds live here' : 'No products found'}</h3><p>${emptySaved ? 'Tap the heart on a product to keep it in your collection.' : 'Try a different search or clear your filters to see more finds.'}</p><button class="secondary-button" data-empty-action="${emptySaved ? 'browse' : 'reset'}">${emptySaved ? 'Explore the catalog' : 'Clear search & filters'}${icon('arrow-right')}</button></div>`;
    $('end-results').textContent = '';
  }
  $('end-results').hidden = !matches.length;

  // --- Step 5: "chips" = small removable tags that show the active filters -----
  const chips = [
    ...[...selectedVendors].map(v => ['vendor', v]),
    ...[...selectedCategories].map(v => ['category', v])
  ];
  if (search.trim()) chips.push(['search', `“${search.trim()}”`]);
  if (minPrice !== 0 || maxPrice !== limit) chips.push(['price', `${money(minPrice)} – ${money(maxPrice)}`]);
  if (rating) chips.push(['rating', `${rating}+ stars`]);
  $('active-filters').innerHTML = chips.map(([type, v]) =>
    `<button class="filter-chip" data-remove-filter="${type}" data-value="${escapeHtml(v)}" aria-label="Remove ${escapeHtml(v)} filter">${escapeHtml(v)}${icon('x')}</button>`
  ).join('');
}

// Clears every filter (search, vendor, category, price, rating) and redraws the page.
function resetFilters() {
  selectedVendors.clear();
  selectedCategories.clear();
  minPrice = 0;
  maxPrice = limit;
  rating = 0;
  search = '';
  $('search').value = '';
  document.querySelector('input[name="rating"][value="0"]').checked = true;   // select "All ratings" again
  updateFilters();
  renderProducts();
}


// ----------------------------------------------------------------------------
// 6. SHOPPING CART
// ----------------------------------------------------------------------------

// Updates the cart numbers in the header button and in the cart window title.
function syncCart() {
  const n = cart.reduce((sum, line) => sum + line.qty, 0);   // total number of items (all quantities added up)
  $('cart-count').textContent = n;
  $('drawer-count').textContent = n + ' item' + (n === 1 ? '' : 's');
  $('cart-button').setAttribute('aria-label', `Open cart, ${n} items`);
}

// Saves the cart to localStorage and refreshes the counters. Returns true if saving worked.
function persistCart() {
  const ok = save('cart', cart);
  syncCart();
  return ok;
}

// Adds one piece of product `id` to the cart. `button` (optional) is the button that was
// clicked; it briefly changes to "Added" as feedback.
function addToCart(id, button) {
  const p = products.find(p => p.id === id);
  if (!p) return;                                              // unknown product: do nothing
  const line = cart.find(line => line.id === id);              // is it already in the cart?
  if (line && line.qty >= 999) { notify('Maximum quantity is 999 per product.'); return; }
  if (line) line.qty += 1; else cart.push({id, qty: 1});       // increase quantity, or add a new line
  const stored = persistCart();
  notify(stored ? `${p.name} added to cart` : 'Added for this visit. Browser storage is unavailable.');
  if (button) {
    // Show "✓ Added" for 0.9 seconds, then restore the original button
    const label = button.innerHTML;
    button.innerHTML = icon('check') + 'Added';
    button.classList.add('just-added');
    button.disabled = true;
    setTimeout(() => { button.innerHTML = label; button.classList.remove('just-added'); button.disabled = false; }, 900);
  }
}

// Opens the cart window.
function showCart() {
  renderCart();
  $('cart-dialog').showModal();
}

// Draws the cart window content: one row per cart line plus the total.
function renderCart() {
  syncCart();

  // Empty cart: show a friendly message with a "shop" button
  if (!cart.length) {
    $('cart-items').innerHTML = `<div class="empty-state"><span class="empty-icon">${icon('bag')}</span><h3>Your cart is empty</h3><p>Find something you love, then choose Add to cart.</p><button class="primary-button" data-empty-action="shop">Explore products ${icon('arrow-right')}</button></div>`;
    $('cart-bottom').innerHTML = '';
    return;
  }

  // The total is counted in cents (whole numbers) to avoid decimal errors like 0.1 + 0.2 = 0.30000000000000004
  let totalCents = 0;
  $('cart-items').innerHTML = cart.map(line => {
    const p = products.find(p => p.id === line.id);
    const cents = Math.round(p.price * 100) * line.qty;   // price of this line in cents
    totalCents += cents;
    return `<div class="cart-row">${imageMarkup(p, 'cart-thumb')}<div><span class="vendor">${escapeHtml(p.vendor)}</span><h3>${escapeHtml(p.name)}</h3><div class="quantity"><button data-quantity="-1" data-id="${escapeHtml(p.id)}" aria-label="Decrease ${escapeHtml(p.name)} quantity">${icon('minus')}</button><span>${line.qty}</span><button data-quantity="1" data-id="${escapeHtml(p.id)}" aria-label="Increase ${escapeHtml(p.name)} quantity" ${line.qty >= 999 ? 'disabled' : ''}>${icon('plus')}</button></div></div><div class="cart-line-end"><strong>${money(cents / 100)}</strong><button class="remove-item" data-remove-item="${escapeHtml(p.id)}" aria-label="Remove ${escapeHtml(p.name)}">${icon('trash')}</button></div></div>`;
  }).join('');

  // Total price + "Continue browsing" button
  $('cart-bottom').innerHTML = `<div class="cart-summary"><div class="cart-total"><span>Cart total</span><b>${money(totalCents / 100)}</b></div><p>${icon('shield')}Your cart stays in this browser after a refresh.</p><button data-close="cart-dialog" class="primary-button">Continue browsing ${icon('arrow-right')}</button></div>`;
}


// ----------------------------------------------------------------------------
// 7. PRODUCT DETAILS WINDOW
// ----------------------------------------------------------------------------

// Fills the details window with the product `id` and opens it.
function showDetail(id) {
  const p = products.find(p => p.id === id);
  if (!p) return;
  $('product-detail').innerHTML = `<button class="icon-button detail-close" data-close="detail-dialog" aria-label="Close product details">${icon('x')}</button><div class="detail-layout"><div class="detail-image">${imageMarkup(p)}</div><div class="detail-copy"><span class="tag">${escapeHtml(p.category)}</span><h2>${escapeHtml(p.name)}</h2><span class="vendor">${icon('store')}${escapeHtml(p.vendor)}</span><span class="rating"><span class="star">★</span>${p.rating.toFixed(1)} out of 5</span><p class="muted">${escapeHtml(p.description || 'A new addition to the MarketCatalog collection.')}</p><strong class="price">${money(p.price)}</strong><button class="primary-button" data-add="${escapeHtml(p.id)}">${icon('cart')}Add to cart</button></div></div>`;
  $('detail-dialog').showModal();
}


// ----------------------------------------------------------------------------
// 8. ROLE (Shopper / Merchant) AND PAGE NAVIGATION
// ----------------------------------------------------------------------------

// Updates everything that depends on the role: the label in the header, the
// merchant banner (visible only for a Merchant on the Catalog page), and the
// tick mark in the role menu.
function renderRole() {
  $('role-label').textContent = role;
  $('merchant-banner').hidden = role !== 'Merchant' || view !== 'catalog';
  document.querySelectorAll('[data-role]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.role === role));
    b.querySelector('.role-tick').innerHTML = b.dataset.role === role ? icon('check') : '';
  });
}

// Switches between the "Catalog" and "Saved" pages. The page is chosen by the
// address hash: ...#saved shows saved products, anything else shows the full catalog.
function setView() {
  const hash = location.hash.slice(1);
  view = hash === 'saved' ? 'saved' : 'catalog';
  $('hero').hidden = view !== 'catalog';                                       // hero banner only on the Catalog page
  $('catalog-heading').textContent = view === 'saved' ? 'Saved products' : 'Product catalog';
  // Highlight the active link in the top navigation
  document.querySelectorAll('[data-nav]').forEach(a => {
    a.classList.toggle('active', a.dataset.nav === view);
    if (a.dataset.nav === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  renderRole();
  resetFilters();           // start every page with clean filters (this also redraws the products)
  window.scrollTo(0, 0);
}


// ----------------------------------------------------------------------------
// 9. EVENT LISTENERS (reacting to what the user does)
// ----------------------------------------------------------------------------

// Typing in the search box -> filter live
$('search').addEventListener('input', e => { search = e.target.value; renderProducts(); });

// Changing the sort dropdown
$('sort').addEventListener('change', e => { sorting = e.target.value; renderProducts(); });

// "Reset" button in the filter sidebar
$('reset').addEventListener('click', resetFilters);

// Any change inside the filter sidebar: vendor / category checkboxes or rating radio buttons
$('filter-panel').addEventListener('change', e => {
  const type = e.target.dataset.filter;                  // 'vendor' or 'category' (only on the checkboxes)
  if (type) {
    const set = type === 'vendor' ? selectedVendors : selectedCategories;
    if (e.target.checked) set.add(e.target.value); else set.delete(e.target.value);
  }
  if (e.target.name === 'rating') rating = Number(e.target.value);
  renderProducts();
});

// Dragging the price slider: sets the maximum price (and keeps the minimum below it)
$('price-range').addEventListener('input', e => {
  maxPrice = Number(e.target.value);
  minPrice = Math.min(minPrice, maxPrice);
  $('min-price').value = minPrice;
  $('max-price').value = maxPrice;
  $('range-output').textContent = money(maxPrice);
  renderProducts();
});

// Typing exact prices in the Min / Max boxes. The values are forced into a valid range:
// min is between 0 and the limit, max is between min and the limit (empty max = limit).
for (const id of ['min-price', 'max-price']) {
  $(id).addEventListener('change', () => {
    minPrice = Math.max(0, Math.min(limit, Number($('min-price').value) || 0));
    maxPrice = Math.max(minPrice, Math.min(limit, $('max-price').value === '' ? limit : Number($('max-price').value)));
    updateFilters();
    renderProducts();
  });
}

// "Filters" button on small screens: show / hide the filter sidebar
$('mobile-filters').addEventListener('click', () => {
  const active = $('filter-panel').classList.toggle('expanded');
  $('mobile-filters').setAttribute('aria-expanded', String(active));
});

// Role button in the header: open / close the role menu
$('role-button').addEventListener('click', () => {
  const menu = $('role-menu');
  menu.hidden = !menu.hidden;
  $('role-button').setAttribute('aria-expanded', String(!menu.hidden));
});

// Cart button in the header: open the cart window
$('cart-button').addEventListener('click', showCart);

// "Add product" button (Merchant only): clear old errors and open the merchant form
$('new-product').addEventListener('click', () => {
  if (role === 'Merchant') {
    $('form-error').textContent = '';
    $('merchant-dialog').showModal();
  }
});

// Closes the role menu.
function closeRole() {
  $('role-menu').hidden = true;
  $('role-button').setAttribute('aria-expanded', 'false');
}

// ONE click listener for the whole page ("event delegation").
// Buttons created by JavaScript (product cards, cart rows, ...) carry data-* attributes
// such as data-add="mug". Instead of attaching a listener to every button, we listen on
// the document and check which data-* attribute the clicked button has.
document.addEventListener('click', e => {
  if (!(e.target instanceof Element)) return;
  if (!e.target.closest('.role-wrap')) closeRole();    // a click outside the role menu closes it
  const b = e.target.closest('button');                // the button that was clicked (if any)
  if (!b) return;
  const d = b.dataset;                                 // all of the button's data-* attributes

  // data-close="dialog-id": close that pop-up window
  if (d.close) { $(d.close).close(); return; }

  // data-role="Shopper|Merchant": switch role
  if (d.role) {
    role = d.role;
    save('role', role);
    closeRole();
    if (role === 'Merchant' && view !== 'catalog') location.hash = 'catalog';   // merchants work on the Catalog page
    renderRole();
    notify(`Switched to ${role.toLowerCase()} mode`);
  }

  // data-detail="product-id": open the product details window
  if (d.detail) showDetail(d.detail);

  // data-add="product-id": add to cart
  if (d.add) addToCart(d.add, b);

  // data-save="product-id": heart / un-heart a product
  if (d.save) {
    const on = saved.has(d.save);                       // was it already saved?
    if (on) saved.delete(d.save); else saved.add(d.save);
    const ok = save('saved', [...saved]);
    renderProducts();
    notify(ok ? (on ? 'Removed from saved products' : 'Added to your saved products') : 'Saved for this visit only.');
  }

  // data-empty-action: the button inside an "empty" message
  if (d.emptyAction === 'reset') resetFilters();                                // "Clear search & filters"
  if (d.emptyAction === 'browse') location.hash = 'catalog';                    // "Explore the catalog"
  if (d.emptyAction === 'shop') { $('cart-dialog').close(); location.hash = 'catalog'; }   // "Explore products" in the empty cart

  // data-quantity="-1|1" or data-remove-item="product-id": change a cart line
  if (d.quantity || d.removeItem) {
    const id = d.id || d.removeItem;
    const line = cart.find(item => item.id === id);
    if (!line) return;
    line.qty = d.removeItem ? 0 : Math.min(999, line.qty + Number(d.quantity));   // remove = quantity 0
    cart = cart.filter(item => item.qty > 0);                                     // drop lines that reached 0
    if (!persistCart()) notify('Change applied for this visit only.');
    renderCart();
  }

  // data-remove-filter="type": remove one filter chip
  if (d.removeFilter) {
    if (d.removeFilter === 'vendor') selectedVendors.delete(d.value);
    if (d.removeFilter === 'category') selectedCategories.delete(d.value);
    if (d.removeFilter === 'search') { search = ''; $('search').value = ''; }
    if (d.removeFilter === 'price') { minPrice = 0; maxPrice = limit; }
    if (d.removeFilter === 'rating') { rating = 0; document.querySelector('input[name="rating"][value="0"]').checked = true; }
    updateFilters();
    renderProducts();
  }
});

// Keyboard shortcuts:
//   Escape -> close the role menu
//   "/"    -> jump to the search box (unless a window is open or the user is already typing)
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeRole();
  if (e.key === '/' && !document.querySelector('dialog[open]') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    $('search').focus();
  }
});

// Clicking on the dark area OUTSIDE a pop-up window closes it.
// (The click target is the <dialog> itself only when the backdrop or its edge was clicked;
// we then check the mouse position to make sure it was really outside the window.)
document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => {
  if (e.target !== d) return;
  const r = d.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
}));


// ----------------------------------------------------------------------------
// 10. MERCHANT FORM: add a new product
// ----------------------------------------------------------------------------

// Runs when the merchant form is submitted. Steps: check the inputs -> read the optional
// photo -> build the product -> save it -> show it in the catalog.
$('product-form').addEventListener('submit', async e => {
  e.preventDefault();                       // stop the browser from reloading the page
  if (role !== 'Merchant') return;          // only merchants may add products
  const form = e.target, data = new FormData(form), error = $('form-error');
  error.textContent = '';

  // Name and vendor must contain more than just spaces
  const name = String(data.get('name')).trim(), vendor = String(data.get('vendor')).trim();
  if (!name || !vendor) { error.textContent = 'Please enter a product name and vendor name.'; return; }

  const photo = data.get('photo');          // the chosen file (may be empty)
  let image = '';
  const submit = form.querySelector('[type=submit]');
  submit.disabled = true;                   // prevent double submits while we work

  try {
    // Optional photo: must be JPG / PNG / WebP and at most 1 MB. It is converted into a
    // data: URL (text) so it can be stored in localStorage together with the product.
    if (photo && photo.size) {
      if (photo.size > 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)) throw new Error('Choose a JPG, PNG, or WebP photo smaller than 1 MB.');
      image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('This photo could not be read. Please try another.'));
        reader.readAsDataURL(photo);
      });
    }

    // Build the new product object (price rounded to 2 decimals; `created` is used by "Newest" sorting)
    const p = {
      id: 'product-' + crypto.randomUUID(),
      name, vendor,
      category: String(data.get('category')),
      price: Math.round(Number(data.get('price')) * 100) / 100,
      rating: Number(data.get('rating')),
      description: String(data.get('description')).trim(),
      image,
      created: Date.now()
    };

    // Save first; only if saving worked do we change the live data
    const next = [p, ...additions];
    if (!save('products', next)) throw new Error('Not enough browser storage. Try a smaller photo or leave it out.');
    additions = next;
    products = [...additions, ...sampleProducts];
    limit = Math.max(limit, Math.ceil(p.price / 100) * 100);   // make sure the price slider can reach the new price

    // Show the new product: back to "Featured" order, clear filters, close the form
    sorting = 'featured';
    $('sort').value = 'featured';
    resetFilters();
    form.reset();
    $('merchant-dialog').close();
    notify('Product added to the catalog');
    $('catalog-heading').scrollIntoView({block: 'start', behavior: 'smooth'});
  } catch (err) {
    error.textContent = err.message || 'Could not save this product. Please try again.';   // show the problem inside the form
  } finally {
    submit.disabled = false;                // always re-enable the submit button
  }
});


// ----------------------------------------------------------------------------
// 11. START-UP
// ----------------------------------------------------------------------------

// When the address hash changes (#catalog <-> #saved) switch the page.
// The skip link ("#content") is ignored here: it should only move keyboard focus to the
// main content, not reset the filters or scroll the page back to the top.
window.addEventListener('hashchange', () => { if (location.hash !== '#content') setView(); });

// First draw of the page
syncCart();        // cart numbers in the header
updateFilters();   // filter sidebar
setView();         // choose Catalog / Saved page and draw the products
