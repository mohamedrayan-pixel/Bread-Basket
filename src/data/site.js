// ============ EDIT THIS FILE to update details, prices, products ============
export const SITE = {
  name: 'The Bread Basket',
  christmas: true, // homepage-only Christmas theme (snow, garland, festive hero). Set to false to switch it off.
  phone: '0431 275 1098',
  email: 'trichybreadbasket@gmail.com',
  // PLACEHOLDERS – fill in once verified with the owner:
  whatsapp: '917395893773', // official order number (country code + number, digits only)
  swiggy: 'https://www.swiggy.com/city/trichy/the-bread-basket-thillai-nagar-rest1475579',
  zomato: 'https://www.zomato.com/trichy/the-bread-basket-3-thillai-nagar',
  instagram: '',       // official Instagram URL
  facebook: '',        // official Facebook URL
  formEndpoint: '',    // POST endpoint (e.g. Formspree/your API). Empty = backend not configured
  // UPI details shown on the payment page next to the QR image (public/images/upi-qr.jpeg = the owner's original QR, unmodified).
  upi: { id: 'achyutsamhari@okhdfcbank', payeeName: 'achyut hari', mobile: '73958 93773', qrImage: '/images/upi-qr.jpeg' },
  // Contact number printed on the customer bill
  billPhone: '73958 93773',
  // Image paths. Put your photos in /public/images and reference them like '/images/hero.jpg'
  images: { hero: '', about: '/images/about-bakery.jpeg', cafe: '', logo: '/images/logo.png' },
};

export const directionsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
export const mapEmbedUrl = (q) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
export const waUrl = (text) =>
  `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`; // no number set -> WhatsApp asks who to send to

// Routes: '/' is the homepage, '/#id' scrolls to a homepage section from any page.
export const NAV = [
  ['Home', '/'], ['About Us', '/#about'], ['Our Menu', '/menu'],
  ['Special Cakes', '/cakes'], ['Our Branches', '/#branches'], ['Contact', '/#contact'],
];

// image: '' shows a placeholder. Set to '/images/xyz.jpg' to use a real photo.
export const MENU = [
  { id: 'breads', name: 'Freshly Baked Breads', items: [
    { name: 'Milk Bread' }, { name: 'Wheat Bread', price: '₹40–₹50' }, { name: 'Salt Bread' },
    { name: 'Ciabatta' }, { name: 'Raisin Bread' }, { name: 'Wholemeal Bread' } ] },
  { id: 'cookies', name: 'Cookies & Rusks', note: 'Cookie packs ₹90–₹200', price: '₹90–₹200', items: [
    { name: 'Sweet Rusk' }, { name: 'Wheat Rusk', price: '₹100–₹150' }, { name: 'Butter Cookies' },
    { name: 'Coconut Cookies' }, { name: 'Salt Cookies' }, { name: 'Chocolate Chip Cookies' } ] },
  { id: 'dry', name: 'Signature Dry Cakes', note: '₹65 per piece', price: '₹65 / piece', items: [
    { name: 'Ghee Cake' }, { name: 'Eggless Vanilla Cake' }, { name: 'Carrot Cake' },
    { name: 'Dates Cake' }, { name: 'Red Velvet Marble Cake' } ] },
  { id: 'cakes', name: 'Cakes & Desserts', items: [
    { name: 'Strawberry Cake' }, { name: 'Fruit and Nut Tea Cake' },
    { name: 'Swiss Rolls' }, { name: 'Muffins' }, { name: 'Custom Fondant Cakes' } ] },
  { id: 'savoury', name: 'Savoury & Café Specials', items: [
    { name: 'Veg Cheese Sandwich', price: '₹60' }, { name: 'Veg Hot Dog' },
    { name: 'Chicken Hot Dog', price: '₹65–₹80' }, { name: 'Chicken Burger' }, { name: 'Paneer Burger' },
    { name: 'Bread Omelette' }, { name: 'Mushroom Manchurian' }, { name: 'French Fries' }, { name: 'Veg Pizza' } ] },
];

export const CAKE_TYPES = [
  'Birthday Cakes', 'Anniversary Cakes', 'Chocolate Cakes', 'Red Velvet Cakes',
  'Butterscotch Cakes', 'Designer Fondant Cakes', 'Custom Celebration Cakes',
].map((name) => ({ name, image: '' }));

export const BRANCHES = [
  { name: 'Thillai Nagar – Flagship Outlet', flagship: true,
    address: '34, MS Mani Road, 3rd Cross, Opposite Unlimited Showroom, Thillai Nagar, Trichy – 620018',
    hours: 'Daily, 10:00 AM – 10:00 PM', features: 'Ground-floor bakery · First-floor dine-in restaurant' },
  { name: 'Cantonment – Williams Road', address: 'Williams Road, Melapudur, near Sona Mina Theatre, Trichy – 620001',
    hours: 'Daily, 8:00 AM – 9:00 PM' },
  { name: 'Cantonment – Rockins Road', address: '8A, Rockins Road, Melapudur, Cantonment, Trichy – 620001',
    features: 'Takeaway and delivery' },
  { name: 'Kumaran Nagar', address: 'Royal Park Apartments, Kumaran Nagar, off Vayalur Road, Trichy – 620017',
    hours: 'Monday–Saturday, 10:00 AM – 10:00 PM' },
  { name: 'Karumandapam', address: 'No. 9C, Dindigul Main Road, Jaya Nagar Extension, near National College, Trichy – 620001' },
  { name: 'Anna Nagar', address: 'Near Mahatma Gandhi School, Anna Nagar, Trichy – 620017' },
  // add `phone: '0431 ...'` to a branch once verified to show a Call button
];

// ---- Special cakes (main attraction) – images come from the owner's MenuItems_no_Gemini_logo.xlsx ----
export const SPECIAL_CAKES = [
  ['Blackcurrant Cake', 'blackcurrant-cake'], ['Chocolate Truffle Cake', 'chocolate-truffle-cake'], ['Red Velvet Cake', 'red-velvet-cake'],
  ['Caramel Butterscotch Cake', 'caramel-butterscotch-cake'], ['Blueberry Milk Chocolate Cake', 'blueberry-milk-chocolate-cake'], ['Butterscotch Cake', 'butterscotch-cake'],
  ['Belgian Chocolate Cake', 'belgian-chocolate-cake'], ['Lotus Biscoff Cake', 'lotus-biscoff-cake'], ['Butterscotch Milk Chocolate Cake', 'butterscotch-milk-chocolate-cake'],
  ['Chocolate Oreo Cake', 'chocolate-oreo-cake'], ['Caramel Dates Nuts Cake', 'caramel-dates-nuts-cake'], ['Mango Delight Cake', 'mango-delight-cake'],
  ['Brownie Delight Cake', 'brownie-delight-cake'], ['Black Forest Cake', 'black-forest-cake'], ['White Forest Cake', 'white-forest-cake'],
].map(([name, file]) => ({ name, image: `/images/products/${file}.jpg` }));

export const DONUTS = [
  ['Chocolate Chip Cream Filled Donut', 'chocolate-chip-cream-filled-donut'], ['Choco Donut', 'choco-donut'], ['Chocolate KitKat Donut', 'chocolate-kitkat-donut'],
].map(([name, file]) => ({ name, image: `/images/products/${file}.jpg` }));

export const SNACKS = [
  ['Chicken Puffs', 'chicken-puffs'], ['Chicken Roll', 'chicken-roll'], ['Egg Puffs', 'egg-puffs'], ['Chicken Pan Fry', 'chicken-pan-fry'],
].map(([name, file]) => ({ name, image: `/images/products/${file}.jpg` }));

// ---- Cake prices (confirmed by the owner) ----
// Black Forest & White Forest: Rs 350 per 500g. Every other cake: Rs 900 per kg.
export const CAKE_PRICING = { perKg: 900, perKgByFlavour: { 'Black Forest Cake': 700, 'White Forest Cake': 700 }, minKg: 0.5, maxKg: 10 };
export const SIZE_KG = { '500g': 0.5, '1kg': 1, '1.5kg': 1.5, '2kg': 2, '2.5kg': 2.5, '3kg': 3 };

export const ORDER_OPTIONS = {
  occasions: ['Birthday'],
  flavours: SPECIAL_CAKES.map((c) => c.name),
  sizes: ['500g', '1kg', '1.5kg', '2kg', '2.5kg', '3kg', 'Custom Size'],
  // custom cake orders are STORE PICKUP ONLY
  branches: ['Thillainagar', 'Williams Road', 'Rockins Road', 'Kumaran Nagar', 'Karumandabam', 'Anna Nagar'],
};
// Pickup time window (24h) – matches the flagship hours
export const PICKUP_HOURS = { from: '10:00', to: '22:00' };
