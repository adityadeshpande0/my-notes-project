/**
 * The mini pages the sandbox shows. These are TRUSTED strings written here
 * by us, never user text, so filling the sandbox with them is safe.
 */

export const CHAI_PAGE = `<h1>Chai Corner</h1>
<p class="tagline">Fresh chai, every morning</p>
<ul id="menu">
  <li class="item">Masala Chai</li>
  <li class="item">Ginger Chai</li>
  <li class="item sold-out">Kesar Chai</li>
</ul>
<button data-action="order">Order</button>`;

const svg = (fill: string, label: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="70" viewBox="0 0 120 70"><rect width="120" height="70" rx="10" fill="${fill}"/><text x="60" y="42" font-size="22" text-anchor="middle">${label}</text></svg>`,
  );

/** Two inline images, so the demo never makes a network request. */
export const HERO_IMAGES = [
  { src: svg('oklch(0.85 0.09 70)', '☕ chai'), alt: 'A cup of masala chai' },
  { src: svg('oklch(0.85 0.1 150)', '🫚 ginger'), alt: 'A cup of ginger chai' },
];

export const CAFE_PAGE = `<header>
  <h1 id="title">Chai Corner</h1>
  <p class="tagline">Fresh chai, every morning</p>
</header>
<img id="hero" src="${HERO_IMAGES[0].src}" alt="${HERO_IMAGES[0].alt}">
<ul id="menu">
  <li class="item" data-id="1"><span class="name">Masala Chai</span> <span class="price">₹30</span></li>
  <li class="item" data-id="2"><span class="name">Ginger Chai</span> <span class="price">₹35</span></li>
  <li class="item sold-out" data-id="3"><span class="name">Kesar Chai</span> <span class="price">₹50</span></li>
  <li class="item" data-id="4"><span class="name">Cutting Chai</span> <span class="price">₹15</span></li>
</ul>
<button id="order">Place order</button>`;

export const BUILD_PAGE = `<h1>Menu</h1>
<ul id="menu">
  <li>Masala Chai</li>
  <li>Ginger Chai</li>
</ul>`;

export const GREETING_PAGE = `<p id="greeting">Hello</p>`;

export const TODO_PAGE = `<p>Items: <span id="count">0</span></p>
<ul id="todos"></ul>`;
