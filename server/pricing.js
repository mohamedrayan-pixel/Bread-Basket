import { CAKE_PRICING } from '../src/data/site.js';
import { weightKg, unitPrice } from '../src/utils/order.js';

/** Server-side order total (the customer's browser is never trusted for the amount). */
export function priceOrder({ size, customKg, flavour, quantity }) {
  const unit = unitPrice(flavour, weightKg(size, customKg));
  if (unit === null || !Number.isInteger(quantity) || quantity < 1) return { error: 'invalid' };
  return { unit, subtotal: unit * quantity, delivery: 0, total: unit * quantity, rates: CAKE_PRICING };
}
