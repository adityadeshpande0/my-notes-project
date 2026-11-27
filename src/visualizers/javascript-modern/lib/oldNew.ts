/* eslint-disable no-var --
   The "old" halves are deliberately written the old way (ES5 style). */
/**
 * "Then vs now": each card has an old-style function and a modern one that
 * must give the same output. The code shown is the code of these functions
 * (written out once here), and oldNew.test.ts checks old(input) equals
 * new(input) for every card.
 */
export interface Menu {
  name: string;
  category: 'drink' | 'snack';
}
export const MENU: Menu[] = [
  { name: 'chai', category: 'drink' },
  { name: 'samosa', category: 'snack' },
  { name: 'lassi', category: 'drink' },
];

export interface Card {
  id: string;
  title: string;
  /** The ECMAScript edition the modern feature arrived in. */
  year: string;
  /** Link back to the article that taught it (if any). */
  article?: { n: number; slug: string };
  oldCode: string;
  newCode: string;
  caption: string;
  /** Runs both versions with the same input and shows what each gave. */
  run: () => Promise<{ old: unknown; modern: unknown }> | { old: unknown; modern: unknown };
}

// ── The function pairs ──
function oldGreeting(name: string, n: number) {
  return 'Hi ' + name + ', you have ' + n + ' messages';
}
const newGreeting = (name: string, n: number) => `Hi ${name}, you have ${n} messages`;

function oldPull(user: { name: string; age: number }) {
  var name = user.name;
  var age = user.age;
  return [name, age];
}
function newPull(user: { name: string; age: number }) {
  const { name, age } = user;
  return [name, age];
}

function oldSize(options: { size?: string }) {
  var size = options.size !== undefined ? options.size : 'medium';
  return size;
}
function newSize(options: { size?: string }) {
  const { size = 'medium' } = options;
  return size;
}

const BASE = { size: 'medium', sugar: 1 };
const oldMerge = () => Object.assign({}, BASE, { sugar: 2 });
const newMerge = () => ({ ...BASE, sugar: 2 });

type U = { address?: { city?: string } } | undefined;
const oldCity = (user: U) => user && user.address && user.address.city;
const newCity = (user: U) => user?.address?.city;

const oldDouble = (xs: number[]) =>
  xs.map(function (n) {
    return n * 2;
  });
const newDouble = (xs: number[]) => xs.map((n) => n * 2);

function oldGroup(menu: Menu[]) {
  return menu.reduce(function (groups: Record<string, Menu[]>, item) {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
    return groups;
  }, {});
}
// Object.groupBy (ES2024); typed loosely, since older TypeScript libs don't know it yet.
const groupBy = (
  Object as unknown as { groupBy?: <T>(xs: T[], f: (x: T) => string) => Record<string, T[]> }
).groupBy;
const newGroup = (menu: Menu[]) =>
  groupBy
    ? { ...groupBy(menu, (item) => item.category) }
    : 'Object.groupBy isn’t supported in this browser';

const oldLast = (arr: string[]) => arr[arr.length - 1];
const newLast = (arr: string[]) => arr.at(-1);

// The old way: a constructor function plus a method on its prototype.
function OldCup(this: { drink: string; sips: number }, drink: string) {
  this.drink = drink;
  this.sips = 0;
}
OldCup.prototype.sip = function (this: { drink: string; sips: number }) {
  this.sips++;
  return this.drink + ': sip ' + this.sips;
};
class NewCup {
  drink: string;
  sips = 0;
  constructor(drink: string) {
    this.drink = drink;
  }
  sip() {
    this.sips++;
    return `${this.drink}: sip ${this.sips}`;
  }
}

const getOrder = () => Promise.resolve({ item: 'chai', price: 30 });
function oldAsync() {
  return getOrder().then(function (order) {
    return order.item + ' costs ₹' + order.price;
  });
}
async function newAsync() {
  const order = await getOrder();
  return `${order.item} costs ₹${order.price}`;
}

export const CARDS: Card[] = [
  {
    id: 'template',
    title: 'String building',
    year: 'ES2015',
    article: { n: 2, slug: 'variables-and-data-types' },
    oldCode: `"Hi " + name + ", you have " + n + " messages"`,
    newCode: '`Hi ${name}, you have ${n} messages`',
    caption: 'A template literal: backticks, with values dropped in using ${ }.',
    run: () => ({ old: oldGreeting('Riya', 3), modern: newGreeting('Riya', 3) }),
  },
  {
    id: 'pull',
    title: 'Pulling out properties',
    year: 'ES2015',
    oldCode: 'var name = user.name;\nvar age = user.age;',
    newCode: 'const { name, age } = user;',
    caption: 'Object destructuring: one line, matched by name.',
    run: () => ({
      old: oldPull({ name: 'Riya', age: 19 }),
      modern: newPull({ name: 'Riya', age: 19 }),
    }),
  },
  {
    id: 'defaults',
    title: 'Defaults',
    year: 'ES2015',
    oldCode: 'var size = options.size !== undefined\n  ? options.size : "medium";',
    newCode: 'const { size = "medium" } = options;',
    caption: 'A default in the pattern (or options.size ?? "medium", from article #3).',
    run: () => ({
      old: [oldSize({}), oldSize({ size: 'large' })],
      modern: [newSize({}), newSize({ size: 'large' })],
    }),
  },
  {
    id: 'merge',
    title: 'Copying and merging',
    year: 'ES2018',
    article: { n: 7, slug: 'objects-and-json' },
    oldCode: 'Object.assign({}, base, { sugar: 2 })',
    newCode: '{ ...base, sugar: 2 }',
    caption: 'Object spread: copy, then override. Later properties win.',
    run: () => ({ old: oldMerge(), modern: newMerge() }),
  },
  {
    id: 'safe',
    title: 'Safe access',
    year: 'ES2020',
    article: { n: 3, slug: 'operators-and-conditions' },
    oldCode: 'user && user.address && user.address.city',
    newCode: 'user?.address?.city',
    caption: 'Optional chaining stops at the first null or undefined.',
    run: () => ({
      old: [oldCity({ address: { city: 'Pune' } }), oldCity({})],
      modern: [newCity({ address: { city: 'Pune' } }), newCity({})],
    }),
  },
  {
    id: 'arrow',
    title: 'Functions',
    year: 'ES2015',
    article: { n: 5, slug: 'functions' },
    oldCode: 'function (n) { return n * 2; }',
    newCode: 'n => n * 2',
    caption: 'An arrow function with an implicit return (article #5’s ArrowMorph).',
    run: () => ({ old: oldDouble([1, 2, 3]), modern: newDouble([1, 2, 3]) }),
  },
  {
    id: 'group',
    title: 'Grouping',
    year: 'ES2024',
    oldCode:
      'menu.reduce(function (groups, item) {\n  if (!groups[item.category]) groups[item.category] = [];\n  groups[item.category].push(item);\n  return groups;\n}, {})',
    newCode: 'Object.groupBy(menu, item => item.category)',
    caption: 'Object.groupBy does the whole reduce for you.',
    run: () => ({ old: oldGroup(MENU), modern: newGroup(MENU) }),
  },
  {
    id: 'at',
    title: 'Last item',
    year: 'ES2022',
    article: { n: 6, slug: 'arrays' },
    oldCode: 'arr[arr.length - 1]',
    newCode: 'arr.at(-1)',
    caption: 'at() takes negative indexes: -1 is the last item.',
    run: () => ({
      old: oldLast(['chai', 'lassi', 'jalebi']),
      modern: newLast(['chai', 'lassi', 'jalebi']),
    }),
  },
  {
    id: 'class',
    title: 'Classes',
    year: 'ES2015',
    oldCode:
      'function Cup(drink) {\n  this.drink = drink;\n  this.sips = 0;\n}\nCup.prototype.sip = function () {\n  this.sips++;\n  return this.drink + ": sip " + this.sips;\n};',
    newCode:
      'class Cup {\n  constructor(drink) {\n    this.drink = drink;\n    this.sips = 0;\n  }\n  sip() {\n    this.sips++;\n    return `${this.drink}: sip ${this.sips}`;\n  }\n}',
    caption: 'The same blueprint, written as a class.',
    run: () => {
      const a = new (OldCup as unknown as new (d: string) => { sip(): string })('chai');
      const b = new NewCup('chai');
      return { old: [a.sip(), a.sip()], modern: [b.sip(), b.sip()] };
    },
  },
  {
    id: 'async',
    title: 'Async',
    year: 'ES2017',
    article: { n: 11, slug: 'async' },
    oldCode:
      'getOrder().then(function (order) {\n  return order.item + " costs ₹" + order.price;\n});',
    newCode: 'const order = await getOrder();\nreturn `${order.item} costs ₹${order.price}`;',
    caption: 'async/await reads top to bottom (article #11).',
    run: async () => ({ old: await oldAsync(), modern: await newAsync() }),
  },
];
