# The Bread Basket - Website, Custom Cake Orders, UPI Payment Proof + WhatsApp

No admin dashboard. You check orders yourself in the database (`server/data/bread-basket.db`).

## Customer flow
1. Homepage -> **Order Now** -> *Order Online* page: Swiggy, Zomato, or **Custom Cake Orders**.
2. Custom cake form (store pickup only, Birthday, 15 cake flavours, 6 branches). The price is calculated live and again on the server.
3. Payment page: your UPI QR, UPI ID and mobile number. The customer uploads a payment screenshot and types the UTR (both required).
4. The bill appears (also downloadable as PDF / printable). Status is always **Payment Verification Pending**.
5. WhatsApp opens with the order message already written. The customer must press **Send**. The website never sends anything.

**Nothing is ever marked "paid" by the website.** Check each UTR in your UPI app, then contact the customer.

## Run (Node 22.5 or newer)
    npm install
    npm run build
    npm start          # http://localhost:3001

## Where to change things
- Prices: `CAKE_PRICING` in `src/data/site.js` (Rs 900 per kg; Black/White Forest Rs 700 per kg = Rs 350 per 500g).
- Swiggy/Zomato links, WhatsApp number, UPI ID, bill phone, Christmas on/off (`christmas: true/false`), product lists: `src/data/site.js`. Run `npm run build` after editing.
- QR image: `public/images/upi-qr.jpeg` (your original, unmodified).
- Product photos: `public/images/products/` (file names are listed in `src/data/site.js`).
- Optional `.env` (see `.env.example`).

## Orders and screenshots
Stored in `server/data/` (database + private `uploads/`). Back it up and never share it. The screenshot link inside the WhatsApp message is a long random address that cannot be guessed; it only opens when you have that link.

## Database
No migration is needed. The existing tables are reused and no column was added or removed. New orders use the status `PAYMENT_VERIFICATION_PENDING`. Custom sizes are stored in the `size` column as e.g. `2.3kg`.

## Checks
`npm run test:server` runs 48 automatic server checks (prices, validation, duplicates, uploads, pending status, WhatsApp text, bill).
