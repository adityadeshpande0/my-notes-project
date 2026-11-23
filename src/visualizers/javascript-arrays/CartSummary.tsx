/**
 * #4 Cart Summary: "Shopping cart"
 *
 * ─── YOUR TURN ─────────────────────────────────────────────────────────
 * This one is yours to build. The component below is a placeholder so the
 * article still reads well until you replace it.
 *
 * The app: a menu of 6 items (name, emoji, price, category "drink" or
 * "snack"), each with an Add button. A category filter (All / Drinks /
 * Snacks) filters the menu. The cart lists the added items with a quantity
 * stepper and a Remove button. A summary shows the number of items, the
 * subtotal, GST (18%) and the total in ₹. An empty cart shows a friendly
 * empty state. A small "Under the hood" panel names the array method behind
 * each part as it updates: menu.filter(...) → 3 items, cart.map(...) → 3
 * rows, cart.reduce(...) → ₹155.
 *
 * Suggested steps:
 *  1. Write a pure cartTotals(cart) in lib/cartTotals.ts and test it FIRST
 *     (lib/cartTotals.test.ts): an empty cart gives all zeros, plus a couple
 *     of real carts. Watch for GST decimals: round to paise with
 *     Math.round(x * 100) / 100.
 *  2. Keep `cart` in useState as an array of { id, name, price, qty }.
 *  3. NEVER mutate it:
 *       add:     setCart([...cart, newItem])  (or cart.map to bump qty)
 *       remove:  setCart(cart.filter(item => item.id !== id))
 *       change:  setCart(cart.map(item => item.id === id ? { ...item, qty } : item))
 *  4. Render rows with cart.map(item => <CartRow key={item.id} … />).
 *     Always give each row a key: React uses it to tell the rows apart.
 *  5. Work out the totals with cartTotals(cart) while rendering. Don't
 *     store them in state.
 *  6. You can use ArrayStrip from '../core/array' if you want to draw the
 *     cart array itself.
 * Ping me when you have a first version and I'll review it.
 * ───────────────────────────────────────────────────────────────────────
 */

// Placeholder: replace this whole component with your cart.
export default function CartSummary() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Shopping cart (coming soon)</p>
      <p className="viz-sub">
        A small cart app built only with map, filter and reduce is on its way.
      </p>
      <p className="viz-caption">
        The plan: <code>filter</code> picks which menu items to show, <code>map</code> turns the
        cart into rows, and <code>reduce</code> adds up the bill.
      </p>
    </div>
  );
}
