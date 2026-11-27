// What the shop DOES. These tests describe behaviour, not code style, so
// they must keep passing, unchanged, while you modernise the code.
import { describe, expect, it } from "vitest";
import {
  Cart,
  GST,
  MENU,
  addGST,
  applyDiscount,
  cheapestFirst,
  findItem,
  formatReceipt,
  formatRupees,
  groupByCategory,
} from "../src/index.js";

describe("pricing", () => {
  it("GST is 18%", () => {
    expect(GST).toBe(0.18);
    expect(addGST(100)).toBe(118);
  });
  it("rounds GST to paise", () => {
    expect(addGST(25)).toBe(29.5);
    expect(addGST(33.33)).toBe(39.33);
  });
  it("CHAI10 takes 10% off", () => {
    expect(applyDiscount(200, "CHAI10")).toBe(180);
  });
  it("FLAT50 needs an order of ₹200 or more", () => {
    expect(applyDiscount(250, "FLAT50")).toBe(200);
    expect(applyDiscount(150, "FLAT50")).toBe(150);
  });
  it("an unknown or missing code changes nothing", () => {
    expect(applyDiscount(120, "FREECHAI")).toBe(120);
    expect(applyDiscount(120)).toBe(120);
  });
});

describe("the cart", () => {
  it("adds items, with a quantity of 1 by default", () => {
    const cart = new Cart().add(1).add(2, 3);
    expect(cart.getItems().map((i) => [i.name, i.quantity])).toEqual([
      ["Samosa", 1],
      ["Masala Chai", 3],
    ]);
    expect(cart.count()).toBe(4);
  });
  it("adding the same item again increases its quantity", () => {
    const cart = new Cart().add(1, 2).add(1);
    expect(cart.getItems()).toHaveLength(1);
    expect(cart.getItems()[0].quantity).toBe(3);
  });
  it("refuses unknown items", () => {
    expect(() => new Cart().add(99)).toThrow("No menu item with id 99");
  });
  it("removes items, and setting a quantity of 0 removes too", () => {
    const cart = new Cart().add(1).add(2).add(3);
    cart.remove(2).setQuantity(3, 0);
    expect(cart.getItems().map((i) => i.id)).toEqual([1]);
  });
  it("updates quantities", () => {
    const cart = new Cart().add(4).setQuantity(4, 5);
    expect(cart.subtotal()).toBe(300);
  });
  it("getItems returns copies, so the cart can't be changed from outside", () => {
    const cart = new Cart().add(1);
    cart.getItems()[0].quantity = 100;
    expect(cart.count()).toBe(1);
    expect(MENU[0]).not.toHaveProperty("quantity");
  });
  it("totals with a discount, then GST", () => {
    const cart = new Cart().add(4, 4); // ₹240
    expect(cart.total()).toBe(283.2);
    expect(cart.total("FLAT50")).toBe(224.2);
    expect(cart.total("CHAI10")).toBe(254.88);
  });
});

describe("the menu", () => {
  it("finds items by id, or gives undefined", () => {
    expect(findItem(5).name).toBe("Jalebi");
    expect(findItem(42)).toBeUndefined();
  });
  it("groups by category", () => {
    const groups = groupByCategory(MENU);
    expect(Object.keys(groups).sort()).toEqual(["drink", "snack", "sweet"]);
    expect(groups.drink.map((i) => i.name)).toEqual(["Masala Chai", "Mango Lassi", "Filter Coffee"]);
  });
  it("sorts cheapest first without changing the menu", () => {
    const before = MENU.map((i) => i.id);
    expect(cheapestFirst(MENU).map((i) => i.price)).toEqual([20, 25, 30, 35, 40, 60]);
    expect(MENU.map((i) => i.id)).toEqual(before);
  });
});

describe("the receipt", () => {
  it("formats rupees", () => {
    expect(formatRupees(29.5)).toBe("₹29.50");
  });
  it("prints every line, for a named customer with a code", () => {
    const cart = new Cart().add(1, 2).add(2);
    expect(formatReceipt(cart, { customer: { name: "Riya" }, code: "CHAI10" })).toBe(
      [
        "Chai Corner receipt for Riya",
        "Samosa x2 = ₹40.00",
        "Masala Chai x1 = ₹30.00",
        "Subtotal: ₹70.00",
        "Discount code: CHAI10",
        "Total with GST: ₹74.34",
      ].join("\n"),
    );
  });
  it("handles missing options: a Guest, and no discount line", () => {
    const cart = new Cart().add(3);
    expect(formatReceipt(cart)).toBe(
      ["Chai Corner receipt for Guest", "Vada Pav x1 = ₹25.00", "Subtotal: ₹25.00", "Total with GST: ₹29.50"].join("\n"),
    );
    expect(formatReceipt(cart, { customer: {} })).toContain("for Guest");
  });
});
