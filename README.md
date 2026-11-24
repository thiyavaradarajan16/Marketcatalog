# Marketcatalog
**One catalog. Endless finds.**

MarketCatalog is a small multi-vendor marketplace front end built with plain HTML, CSS and JavaScript. Shoppers can search, filter and sort products, save favourites and fill a cart. Merchants can add their own products from a built-in form. There is no backend and there is no build step: everything runs in the browser.

## Features

**Shopper**
- Browse a catalog of 12 sample products from 4 vendors, with prices in ₹ (Indian rupees).
- Search by product or vendor name. Press `/` to jump to the search box.
- Filter by vendor, category, price range (slider plus min/max boxes) and minimum rating.
- Sort by Featured, Price: low to high, Price: high to low, Top rated or Newest.
- Save products with the heart button and view them on the **Saved** page.
- Open a product details window and add items to the cart. The cart keeps quantities and a running total.
- Active filters appear as chips. A **Reset** button and a "Showing x of y" line help you track results.

**Merchant**
- Switch the role from **Shopper** to **Merchant** in the header menu.
- Use **Add product** to enter the name, vendor, category, price, rating, description and an optional photo (JPG, PNG or WebP, up to 1 MB).
- The new product appears at the top of the catalog straight away.

**General**
- Cart, saved items, merchant products and the chosen role are stored in the browser with `localStorage`. They are still there after a refresh.
- Responsive layout with a mobile **Filters** button.
- Accessibility: skip link, ARIA labels, live regions for the result count and notices, keyboard support (`/`, `Esc`) and reduced-motion support.
- Fonts and Bootstrap are bundled locally, so the app works offline.

## Getting started

No installation or build is needed.

1. Download or clone this folder.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).

If you prefer a local server:

```bash
# Python
python3 -m http.server 8000

# or Node
npx serve .
```

Then open <http://localhost:8000>.

## Project structure

```
marketcatalog/
├── index.html          # Page structure: header, hero, filters, product grid, dialogs
├── style.css           # All custom design (16 numbered sections, responsive rules)
├── catalog.js          # App behaviour: state, rendering, filters, cart, merchant form
├── products.js         # Sample product data (12 products)
├── icons.js            # Inline SVG icon helpers
├── bootstrap.min.css   # Bootstrap, used only for form and grid classes
├── favicon.svg
├── images/             # Product photos and hero image (.webp)
├── fonts/              # DM Sans (400, 500, 600, 700, 800)
└── licenses/           # Bootstrap and DM Sans licences
```

Scripts load in this order: `icons.js`, then `products.js`, then `catalog.js`. Each file depends on the one before it.

## How it works

- **State.** `catalog.js` keeps the products, cart, saved ids, role and current filters in memory. It validates everything it reads from `localStorage`, so corrupted data cannot break the page.
- **Rendering.** `renderProducts()` applies the search, filters and sort, then redraws the grid. It runs again whenever one of those inputs changes.
- **Storage.** All keys start with `mc.` (`mc.cart`, `mc.saved`, `mc.products`, `mc.role`). Clear them in your browser's site data to reset the app.
- **Safety.** User-entered text goes through `escapeHtml()` before it is inserted into the page.
- **Dialogs.** The cart, product details and merchant form use native HTML `<dialog>` elements.

## Customising

**Add or change sample products.** Edit the array in `products.js`. Each row has this format:

```js
[ image-name, 'Product name', 'Vendor', 'Category', price, rating, 'Description' ]
```

Put a matching `images/<image-name>.webp` file in the `images/` folder.

**Change the look.** Edit `style.css`. The file header lists its sections (fonts, header, hero, filters, cards, dialogs and so on). Rule order matters, so check the page after you move rules.

## Limitations

- This is a demo. There is no server, user accounts, checkout or payment. The cart stays in your browser only.
- Merchant products are saved in `localStorage` on the same device and browser. Other users can't see them.
- Browser storage is limited. Large photos can fail to save, so uploads are capped at 1 MB.

## Tech stack

HTML5, CSS3, vanilla JavaScript (ES2020+), Bootstrap (form and grid classes only), DM Sans font.

## Licences

- Bootstrap: see `licenses/Bootstrap-LICENSE.txt`
- DM Sans: SIL Open Font License, see `licenses/DM-Sans-OFL.txt`


