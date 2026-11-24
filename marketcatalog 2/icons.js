// ============================================================================
// icons.js — small inline SVG icons
// ----------------------------------------------------------------------------
// Every icon is drawn with SVG shapes stored in the `iconShapes` object below,
// so the page needs no icon font and no internet connection.
//
// Two ways icons get on the page:
//   1. In index.html:  <i data-icon="cart"></i>  -> paintIcons() swaps it for the SVG.
//   2. In JavaScript:  icon('cart')              -> returns the SVG as an HTML string.
// ============================================================================

// name -> the inner SVG shapes (paths, circles, rectangles) for that icon
const iconShapes = {
  // Navigation, header & branding
  brand: '<path d="m3.5 7.5 1.5 14h14l1.5-14z"/><path d="M8 9V6a4 4 0 0 1 8 0v3m-8 5 4 3 4-3"/>',
  grid: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.3"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.3"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.3"/><rect x="14" y="14" width="6.5" height="6.5" rx="1.3"/>',
  heart: '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6z"/>',
  user: '<circle cx="12" cy="7.5" r="3.5"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  // Shopping: cart, bag, products, stores
  cart: '<path d="M2 3h3l2.5 12h11L21 6H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  bag: '<rect x="4" y="7" width="16" height="14" rx="2"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>',
  box: '<path d="m12 2 9 5v10l-9 5-9-5V7zm-9 5 9 5 9-5m-9 5v10M7.5 4.5l9 5v5"/>',
  store: '<path d="M3 10 5 3h14l2 7M4 13v8h16v-8M3 10c0 4 5 4 6 0 1 4 5 4 6 0 1 4 6 4 6 0zM9 21v-6h5v6"/>',
  // Toolbar & filters
  search: '<circle cx="10.5" cy="10.5" r="6.7"/><path d="m16 16 5 5"/>',
  sort: '<path d="M7 4v16m-3-3 3 3 3-3M17 20V4m-3 3 3-3 3 3"/>',
  sliders: '<path d="M3 6h8m4 0h6M3 12h3m4 0h11M3 18h11m4 0h3"/><circle cx="13" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
  // Actions & status
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="m6 6 12 12M6 18 18 6"/>',
  'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
  shield: '<path d="m12 2 8 3v6c0 6-8 11-8 11S4 17 4 11V5z"/><path d="m8 11 3 3 5-5"/>'
};

// Builds a complete <svg> element (as an HTML string) for the icon called `name`.
//  - `cls` lets the caller add an extra CSS class.
//  - An unknown name gives an empty icon instead of an error.
//  - stroke="currentColor" makes the icon take the text colour of its parent.
function icon(name, cls = '') {
  return `<svg class="icon ${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconShapes[name] || ''}</svg>`;
}

// Finds every <i data-icon="..."> placeholder inside `root` (default: the whole
// page) and replaces it with the real SVG icon.
function paintIcons(root = document) {
  root.querySelectorAll('i[data-icon]').forEach(el => el.outerHTML = icon(el.dataset.icon));
}

// Run once when the script loads so the icons already written in index.html appear.
paintIcons();
