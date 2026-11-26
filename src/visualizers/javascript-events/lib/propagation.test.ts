// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createListenerBag } from './listeners';
import { predictCalls, type Call, type NodeListeners } from './propagation';

const NAMES = ['document', 'grandparent', 'parent', 'child'] as const;

/** The tower: a root standing in for document, then three nested elements. */
function build() {
  const root = document.createElement('div');
  root.innerHTML =
    '<div class="grandparent"><div class="parent"><button class="child">Order</button></div></div>';
  document.body.append(root);
  const els = {
    document: root,
    grandparent: root.querySelector('.grandparent')!,
    parent: root.querySelector('.parent')!,
    child: root.querySelector('.child')!,
  };
  return { root, els };
}

/** Attach REAL listeners per the settings, click, and record what ran. */
function clickAndRecord(
  settings: Record<string, NodeListeners>,
  target: keyof ReturnType<typeof build>['els'],
) {
  const { root, els } = build();
  const bag = createListenerBag();
  const calls: Call[] = [];
  for (const name of NAMES) {
    const s = settings[name];
    for (const listener of ['capture', 'bubble'] as const) {
      if (!s[listener]) continue;
      bag.add(
        els[name],
        'click',
        (e) => {
          calls.push({ node: name, phase: e.eventPhase as Call['phase'], listener });
          if (s.stop) e.stopPropagation();
        },
        { capture: listener === 'capture' },
      );
    }
  }
  (els[target] as HTMLElement).click();
  bag.removeAll();
  root.remove();
  return calls;
}

describe('the model matches real clicks', () => {
  it('for every combination of capture, bubble and stop toggles', () => {
    let checked = 0;
    // 3 toggles × 4 nodes = 12 bits: 4096 combinations, clicking the button.
    for (let mask = 0; mask < 1 << 12; mask++) {
      const settings: Record<string, NodeListeners> = {};
      NAMES.forEach((n, i) => {
        settings[n] = {
          capture: !!(mask & (1 << (i * 3))),
          bubble: !!(mask & (1 << (i * 3 + 1))),
          stop: !!(mask & (1 << (i * 3 + 2))),
        };
      });
      expect(clickAndRecord(settings, 'child')).toEqual(predictCalls([...NAMES], settings));
      checked++;
    }
    expect(checked).toBe(4096);
  });

  it('when the parent itself is clicked, the journey is shorter', () => {
    const all = { capture: true, bubble: true, stop: false };
    const settings = Object.fromEntries(NAMES.map((n) => [n, all]));
    const real = clickAndRecord(settings, 'parent');
    expect(real).toEqual(predictCalls(['document', 'grandparent', 'parent'], settings));
    expect(real.some((c) => c.node === 'child')).toBe(false);
  });
});

describe('the listener bag', () => {
  it('removes every listener, ignores duplicates, and needs the same function', () => {
    const btn = document.createElement('button');
    const bag = createListenerBag();
    let runs = 0;
    const named = () => runs++;
    bag.add(btn, 'click', named);
    bag.add(btn, 'click', named); // identical: no effect
    bag.add(btn, 'click', () => runs++);
    bag.add(btn, 'click', () => runs++, { once: true });
    expect(bag.count()).toBe(3);
    bag.remove(btn, 'click', () => runs++); // a NEW arrow: removes nothing
    expect(bag.count()).toBe(3);
    btn.click();
    expect(runs).toBe(3);
    expect(bag.count()).toBe(2); // the once-listener removed itself
    bag.remove(btn, 'click', named);
    btn.click();
    expect(runs).toBe(4);
    bag.removeAll();
    btn.click();
    expect(runs).toBe(4);
    expect(bag.count()).toBe(0);
  });
});
