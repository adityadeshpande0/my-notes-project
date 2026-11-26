/**
 * The mini pages for the Events visuals. TRUSTED strings written here, never
 * user text. Links use href="#demo" and the sandbox always stops them from
 * really navigating (see LiveDomSandbox's guard).
 */
export const LAB_PAGE = `<div class="lab">
  <button id="order">Place order</button>
  <label>Search <input id="search" placeholder="Search snacks" autocomplete="off"></label>
  <label>Size <select id="size"><option>Small</option><option selected>Regular</option><option>Large</option></select></label>
  <label class="tick"><input type="checkbox" id="notify"> Notify me when it’s ready</label>
  <div id="card" class="card">Hover over me: Masala Chai, ₹30</div>
</div>`;

export const FORM_PAGE = `<div class="lab">
  <form id="form">
    <label>Name <input name="name" id="name" value="Riya" autocomplete="off"></label>
    <button>Submit</button>
  </form>
  <p><a id="menu-link" href="#demo">See full menu</a></p>
</div>`;

export const ORDER_PAGE = `<div class="lab"><button id="order">Place order</button></div>`;

export const TOWER_PAGE = `<div class="stage">
  <div class="floor grandparent" data-name="grandparent">
    <span class="tag">div.grandparent · Café</span>
    <div class="floor parent" data-name="parent">
      <span class="tag">div.parent · Table 4</span>
      <button class="child" data-name="child">☕ Order</button>
    </div>
  </div>
</div>`;

export const CARD_PAGE = `<div class="lab">
  <div class="card product">
    <strong>Masala Chai</strong>
    <span>Spiced, milky and sweet. ₹30</span>
    <button class="like">♥ Like</button>
  </div>
</div>`;

export const SNACKS = [
  ['🥟', 'Samosa', '₹20'],
  ['🌯', 'Vada Pav', '₹25'],
  ['🍮', 'Jalebi', '₹40'],
  ['🥥', 'Coconut Water', '₹35'],
  ['🥔', 'Aloo Tikki', '₹30'],
  ['🍡', 'Gulab Jamun', '₹45'],
] as const;

export const snackItem = ([emoji, name, price]: readonly [string, string, string]) =>
  `<li class="item" data-name="${name}"><span class="emoji">${emoji}</span> <span class="name">${name}</span> <span class="price">${price}</span></li>`;

export const MENU_PAGE = `<ul id="menu" class="menu">
  ${SNACKS.slice(0, 4).map(snackItem).join('\n  ')}
</ul>`;

/** The mini pages' extra styles (inside the shadow root, so they can't leak). */
export const EVENTS_CSS = `
.lab { display: grid; gap: 10px; }
label { display: flex; align-items: center; gap: 8px; font-size: 14px; }
label.tick { gap: 6px; }
input:not([type=checkbox]), select { flex: 1; min-width: 0; padding: 6px 8px; border: 1px solid var(--line); border-radius: 8px;
  background: var(--paper); color: var(--ink); font: inherit; }
input[type=checkbox] { width: 18px; height: 18px; accent-color: var(--brand); }
:focus-visible { outline: 3px solid oklch(0.6 0.15 265); outline-offset: 2px; }
.card { padding: 10px 12px; border: 1px dashed var(--line); border-radius: 10px; background: var(--soft); transition: background-color 0.2s; }
.card:hover { background: oklch(0.93 0.05 265); }
.card.product { display: grid; gap: 6px; cursor: pointer; }
.card.product button { justify-self: start; }
.card.product .like.on { background: oklch(0.6 0.2 15); }
form { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0; padding: 10px; border: 1px solid var(--line); border-radius: 10px; }
form label { flex: 1 1 12rem; }
a { color: oklch(0.5 0.17 265); font-weight: 600; }
p { margin: 0; }

/* The bubbling tower: three nested floors. */
/* The bubbling tower: three nested floors. */
.stage { padding: 6px 0; container-type: inline-size; }
.floor { position: relative; padding: 30px 14px 14px; border: 2px solid; border-radius: 12px; cursor: pointer;
  transition: background-color 0.25s, box-shadow 0.25s, opacity 0.25s; }
.grandparent { border-color: oklch(0.75 0.06 260); background: oklch(0.96 0.015 260); }
.parent { border-color: oklch(0.7 0.08 200); background: oklch(0.94 0.03 200); }
.tag { position: absolute; top: 7px; left: 12px; color: oklch(0.45 0.03 260); font: 600 12px/1 ui-monospace, monospace; pointer-events: none; }
button.child { display: block; margin: 6px auto 2px; padding: 10px 18px; font-size: 16px; transition: box-shadow 0.25s, opacity 0.25s; }
/* Lit up during the replay: capture periwinkle, target mint, bubble amber, wall coral. */
.is-capture { box-shadow: 0 0 0 4px oklch(0.62 0.15 265), 0 0 18px oklch(0.62 0.15 265 / 0.6) !important; }
.is-target { box-shadow: 0 0 0 4px oklch(0.72 0.17 165), 0 0 22px oklch(0.72 0.17 165 / 0.7) !important; }
.is-bubble { box-shadow: 0 0 0 4px oklch(0.78 0.16 75), 0 0 18px oklch(0.78 0.16 75 / 0.6) !important; }
.is-wall { box-shadow: 0 0 0 4px oklch(0.62 0.2 15), 0 0 18px oklch(0.62 0.2 15 / 0.6) !important; }
.is-unreached { opacity: 0.55; }
/* Wide enough and motion allowed: tilt the floors so the nesting reads as height.
   (A container query styles what's INSIDE .stage, so the perspective goes on the grandparent itself.) */
@container (min-width: 22rem) {
  @media (prefers-reduced-motion: no-preference) {
    .grandparent { margin: 10px 6px 22px; padding: 44px 22px 22px; transform: perspective(800px) rotateX(30deg); transform-style: preserve-3d;
      box-shadow: 0 16px 0 -4px oklch(0.75 0.06 260 / 0.55); }
    .parent { padding-top: 34px; transform: translateZ(18px); transform-style: preserve-3d; box-shadow: 0 12px 0 -4px oklch(0.7 0.08 200 / 0.55); }
    button.child { transform: translateZ(18px); box-shadow: 0 8px 0 -2px oklch(0.4 0.1 40 / 0.5); }
  }
}

/* The delegation menu. */
.menu { display: grid; gap: 6px; margin: 0; padding: 10px; border: 2px dashed var(--line); border-radius: 12px; list-style: none; }
.menu li { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.menu .name { flex: 1; }
.menu .price { font-weight: 700; color: var(--brand); }
.menu li.picked { border-color: oklch(0.72 0.17 165); background: oklch(0.72 0.17 165 / 0.12); }
.menu li.dud { border-color: oklch(0.62 0.2 15); }
.menu li.walk { box-shadow: 0 0 0 3px oklch(0.78 0.16 75); }
`;
