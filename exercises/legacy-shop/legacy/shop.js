// Chai Corner shop: the LEGACY version.
// Written the old way on purpose (var, constructor functions, string
// concatenation, index loops, Object.assign, && chains). It works! Your job
// is to modernise it without changing what it does. See ../README.md.

var GST = 0.18;

var MENU = [
  { id: 1, name: "Samosa", price: 20, category: "snack" },
  { id: 2, name: "Masala Chai", price: 30, category: "drink" },
  { id: 3, name: "Vada Pav", price: 25, category: "snack" },
  { id: 4, name: "Mango Lassi", price: 60, category: "drink" },
  { id: 5, name: "Jalebi", price: 40, category: "sweet" },
  { id: 6, name: "Filter Coffee", price: 35, category: "drink" }
];

function findItem(id) {
  for (var i = 0; i < MENU.length; i++) {
    if (MENU[i].id === id) {
      return MENU[i];
    }
  }
  return undefined;
}

function addGST(price) {
  return Math.round(price * (1 + GST) * 100) / 100;
}

// Discount codes: CHAI10 = 10% off; FLAT50 = ₹50 off orders of ₹200 or more.
function applyDiscount(amount, code) {
  if (code === "CHAI10") {
    return Math.round(amount * 0.9 * 100) / 100;
  }
  if (code === "FLAT50" && amount >= 200) {
    return amount - 50;
  }
  return amount;
}

function Cart() {
  this.items = [];
}

Cart.prototype.add = function (id, quantity) {
  var item = findItem(id);
  if (!item) {
    throw new Error("No menu item with id " + id);
  }
  var qty = quantity !== undefined ? quantity : 1;
  for (var i = 0; i < this.items.length; i++) {
    if (this.items[i].id === id) {
      this.items[i].quantity = this.items[i].quantity + qty;
      return this;
    }
  }
  this.items.push(Object.assign({}, item, { quantity: qty }));
  return this;
};

Cart.prototype.remove = function (id) {
  var kept = [];
  for (var i = 0; i < this.items.length; i++) {
    if (this.items[i].id !== id) {
      kept.push(this.items[i]);
    }
  }
  this.items = kept;
  return this;
};

Cart.prototype.setQuantity = function (id, quantity) {
  if (quantity <= 0) {
    return this.remove(id);
  }
  for (var i = 0; i < this.items.length; i++) {
    if (this.items[i].id === id) {
      this.items[i].quantity = quantity;
    }
  }
  return this;
};

Cart.prototype.getItems = function () {
  var copy = [];
  for (var i = 0; i < this.items.length; i++) {
    copy.push(Object.assign({}, this.items[i]));
  }
  return copy;
};

Cart.prototype.count = function () {
  var n = 0;
  for (var i = 0; i < this.items.length; i++) {
    n = n + this.items[i].quantity;
  }
  return n;
};

Cart.prototype.subtotal = function () {
  var sum = 0;
  for (var i = 0; i < this.items.length; i++) {
    sum = sum + this.items[i].price * this.items[i].quantity;
  }
  return sum;
};

Cart.prototype.total = function (code) {
  return addGST(applyDiscount(this.subtotal(), code));
};

function groupByCategory(menu) {
  return menu.reduce(function (groups, item) {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
    return groups;
  }, {});
}

function cheapestFirst(menu) {
  // slice() first, so the original menu isn't changed.
  return menu.slice().sort(function (a, b) {
    return a.price - b.price;
  });
}

function formatRupees(n) {
  return "₹" + n.toFixed(2);
}

function formatReceipt(cart, options) {
  var name = options && options.customer && options.customer.name ? options.customer.name : "Guest";
  var code = options && options.code ? options.code : undefined;
  var lines = ["Chai Corner receipt for " + name];
  var items = cart.getItems();
  for (var i = 0; i < items.length; i++) {
    lines.push(items[i].name + " x" + items[i].quantity + " = " + formatRupees(items[i].price * items[i].quantity));
  }
  lines.push("Subtotal: " + formatRupees(cart.subtotal()));
  if (code) {
    lines.push("Discount code: " + code);
  }
  lines.push("Total with GST: " + formatRupees(cart.total(code)));
  return lines.join("\n");
}

export { GST, MENU, findItem, addGST, applyDiscount, Cart, groupByCategory, cheapestFirst, formatRupees, formatReceipt };
