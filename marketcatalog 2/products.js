// ============================================================================
// products.js — sample product data
// ----------------------------------------------------------------------------
// This file only defines the demo products. catalog.js reads `sampleProducts`
// and shows them in the catalog. (It is loaded BEFORE catalog.js in index.html.)
// ============================================================================

// Each row below is one product, written as a short list (an array) to save space:
//   [ image-name, product name, vendor, category, price in ₹, rating (0-5), description ]
// The .map() at the end turns every row into a proper product object:
//   { id, name, vendor, category, price, rating, description, image }
const sampleProducts = [
  ['headphones','Aura Wireless Headphones','Soundform','Electronics',2499,4.8,'Soft lavender ear cushions, a comfortable padded headband, and wireless listening for your everyday soundtrack.'],
  ['backpack','Everyday Canvas Backpack','Fieldwork','Accessories',1499,4.7,'A warm sand canvas backpack with an easy-access front pocket and adjustable shoulder straps.'],
  ['lamp','Mushroom Table Lamp','Form & Found','Home & living',1799,4.9,'A sculptural olive-green table lamp that brings a soft glow to your bedside or favorite reading corner.'],
  ['sneakers','Court Classic Sneakers','Dayfolk','Lifestyle',1999,4.6,'Clean white low-top sneakers with subtle sage details. A comfortable everyday staple.'],
  ['mug','Everyday Ceramic Mug','Form & Found','Home & living',599,4.8,'A generously rounded ceramic mug in a warm apricot glaze, made for slow mornings.'],
  ['camera','Pocket Digital Camera','Soundform','Electronics',3999,4.5,'A compact silver camera with vintage-inspired details, ready for everyday snapshots.'],
  ['speaker','Mini Bluetooth Speaker','Soundform','Electronics',1299,4.4,'A compact woven speaker with a warm sound and a soft sage finish.'],
  ['tote','The Market Tote','Fieldwork','Accessories',749,4.7,'A spacious natural canvas tote with bold blue handles for daily errands.'],
  ['bottle','Daily Insulated Bottle','Dayfolk','Lifestyle',699,4.5,'A reusable steel bottle with a cork base and a clean, minimal silhouette.'],
  ['sunglasses','Sunday Sunglasses','Fieldwork','Accessories',999,4.3,'Amber tortoiseshell frames with a relaxed, retro shape.'],
  ['notebook','Studio Hardcover Notebook','Dayfolk','Lifestyle',549,4.2,'A lavender notebook with an elastic closure for plans, ideas, and little reminders.'],
  ['plant','Little Leaf Planter','Form & Found','Home & living',849,4.9,'A leafy green plant nestled in a small ribbed ceramic pot.']
].map(([id,name,vendor,category,price,rating,description]) => ({
  id, name, vendor, category, price, rating, description,
  image: `images/${id}.webp`   // the picture file lives in the images/ folder and is named after the id
}));
