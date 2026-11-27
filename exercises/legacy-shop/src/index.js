// The shop's public API. The tests import everything from HERE.
//
// Right now it simply re-exports the legacy file. When your new modules are
// ready (cart.js, pricing.js, format.js, menu.js), change this file to
// re-export from them instead, for example:
//
//   export { Cart } from "./cart.js";
//   export { GST, addGST, applyDiscount } from "./pricing.js";
//   export { default as formatReceipt, formatRupees } from "./format.js";
//   export { MENU, findItem, groupByCategory, cheapestFirst } from "./menu.js";
//
// …then run the tests. They must all still pass, unchanged.
export {
  GST,
  MENU,
  findItem,
  addGST,
  applyDiscount,
  Cart,
  groupByCategory,
  cheapestFirst,
  formatRupees,
  formatReceipt,
} from "../legacy/shop.js";
