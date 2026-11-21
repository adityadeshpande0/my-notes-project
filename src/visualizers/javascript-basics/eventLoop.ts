/**
 * Event loop step generators. Plain TypeScript, no React.
 *
 * Each preset is a small program plus a hand-written "script" of what the
 * engine does with it. A tiny simulator (`Sim`) keeps the current state of the
 * call stack, Web APIs, queue and console, and `snap()` saves a copy of it as
 * one Step. The renderer (EventLoop.tsx) only draws those snapshots.
 *
 * eventLoop.test.ts runs each preset's *real* code and checks that the
 * simulated console ends up identical, so the visual can never lie.
 */

export type LoopState = 'idle' | 'checking' | 'moving';

export interface WebApiTask {
  id: string;
  label: string;
  /** Time left before the callback is ready (0 = ready). Infinity for "waits for a click". */
  msLeft: number;
  msTotal: number;
}

export interface ELStep {
  /** Highlighted code line (1-based), or null when no line is running. */
  line: number | null;
  /** Bottom → top, e.g. ["main()", "greet()"] */
  stack: string[];
  webApis: WebApiTask[];
  /** Callbacks waiting, oldest first. */
  queue: string[];
  loop: LoopState;
  console: string[];
  /** Plain-English explanation of this step. */
  caption: string;
  /** Simulated clock, in ms since the script started. */
  clock: number;
  /** The visual pauses here until the reader clicks the real button. */
  waitForClick?: boolean;
}

export interface Preset {
  id: string;
  name: string;
  code: string;
  steps: ELStep[];
}

/** A small mutable model of the runtime. Every `snap()` stores a deep copy. */
class Sim {
  stack: string[] = [];
  webApis: WebApiTask[] = [];
  queue: string[] = [];
  console: string[] = [];
  clock = 0;
  steps: ELStep[] = [];

  snap(
    line: number | null,
    caption: string,
    extra: { loop?: LoopState; waitForClick?: boolean } = {},
  ) {
    this.steps.push({
      line,
      stack: [...this.stack],
      webApis: this.webApis.map((t) => ({ ...t })),
      queue: [...this.queue],
      loop: extra.loop ?? 'idle',
      console: [...this.console],
      caption,
      clock: this.clock,
      ...(extra.waitForClick ? { waitForClick: true } : {}),
    });
  }

  push(frame: string) {
    this.stack.push(frame);
  }
  pop() {
    this.stack.pop();
  }
  log(text: string) {
    this.console.push(text);
  }
  startTimer(id: string, label: string, ms: number) {
    this.webApis.push({ id, label, msLeft: ms, msTotal: ms });
  }
  /** Let time pass: every timer counts down. */
  tick(ms: number) {
    this.clock += ms;
    for (const t of this.webApis) {
      if (Number.isFinite(t.msLeft)) t.msLeft = Math.max(0, t.msLeft - ms);
    }
  }
  /** A finished Web API task hands its callback to the queue. */
  toQueue(id: string, callback: string) {
    this.webApis = this.webApis.filter((t) => t.id !== id);
    this.queue.push(callback);
  }
  /** The event loop moves the oldest callback onto the (empty) stack. */
  dequeue() {
    const cb = this.queue.shift();
    if (cb) this.stack.push(cb);
  }
}

// ─── Preset 1: synchronous code ─────────────────────────────────────────────

export const SYNC_CODE = `function greet(name) {
  return "Hi " + name;
}
console.log("Start");
console.log(greet("Riya"));
console.log("End");`;

function syncSteps(): ELStep[] {
  const s = new Sim();
  s.snap(null, 'The engine is about to run this file. The call stack is empty.');
  s.push('main()');
  s.snap(
    1,
    'The whole file runs inside a frame we call main(). Line 1 only *defines* greet; nothing runs yet.',
  );
  s.push('console.log("Start")');
  s.snap(4, 'Calling console.log puts a new plate on top of the stack.');
  s.log('Start');
  s.pop();
  s.snap(4, 'It prints "Start" and finishes, so its plate comes off. Back to main().');
  s.push('greet("Riya")');
  s.snap(
    2,
    'Line 5 needs the value of greet("Riya") before it can call console.log, so greet goes on top and runs first.',
  );
  s.pop();
  s.snap(5, 'greet returns "Hi Riya" and its plate comes off. main() is on top again.');
  s.push('console.log("Hi Riya")');
  s.snap(5, 'Now console.log is called with the finished value.');
  s.log('Hi Riya');
  s.pop();
  s.snap(5, 'console.log prints "Hi Riya" and is popped.');
  s.push('console.log("End")');
  s.snap(6, 'Another call, another plate.');
  s.log('End');
  s.pop();
  s.snap(6, '"End" is printed and the plate comes off.');
  s.pop();
  s.snap(null, 'The file is done, so main() is popped. The stack is empty: nothing is left to do.');
  return s.steps;
}

// ─── Preset 2: setTimeout(…, 0) ─────────────────────────────────────────────

export const TIMEOUT_ZERO_CODE = `console.log("1: Order placed");
setTimeout(() => {
  console.log("3: Chai is ready ☕");
}, 0);
console.log("2: Serving other tables");`;

function timeoutZeroSteps(): ELStep[] {
  const s = new Sim();
  s.snap(null, 'Watch the order of the three messages. The numbers are a hint.');
  s.push('main()');
  s.snap(1, 'The file starts running inside main().');
  s.push('console.log("1: …")');
  s.snap(1, 'console.log goes on the stack…');
  s.log('1: Order placed');
  s.pop();
  s.snap(1, '…prints "1: Order placed" and comes off.');
  s.push('setTimeout(cb, 0)');
  s.snap(2, 'setTimeout is called. It does not run the arrow function. It hands it to the browser.');
  s.startTimer('t', 'timer 0 ms → cb', 0);
  s.pop();
  s.snap(
    2,
    'The browser (the kitchen) now owns a 0 ms timer. setTimeout returns at once and its plate comes off.',
  );
  s.toQueue('t', 'cb: log "3: …"');
  s.snap(
    2,
    'The timer is already done, so its callback goes to the queue. Even with 0 ms, the callback must wait in the queue until the call stack is completely empty.',
    { loop: 'checking' },
  );
  s.push('console.log("2: …")');
  s.snap(5, 'Meanwhile main() keeps going. The stack is not empty, so the callback keeps waiting.', {
    loop: 'checking',
  });
  s.log('2: Serving other tables');
  s.pop();
  s.snap(5, '"2: Serving other tables" is printed.', { loop: 'checking' });
  s.pop();
  s.snap(null, 'main() is finished and popped. The stack is finally empty.', { loop: 'checking' });
  s.dequeue();
  s.snap(
    3,
    'The event loop sees an empty stack and a waiting callback, so it moves the callback onto the stack.',
    { loop: 'moving' },
  );
  s.push('console.log("3: …")');
  s.snap(3, 'The callback calls console.log…');
  s.log('3: Chai is ready ☕');
  s.pop();
  s.snap(3, '…and "3: Chai is ready ☕" is printed last, even though its delay was 0 ms.');
  s.pop();
  s.snap(null, 'The callback finishes. Stack empty, queue empty, no timers left. All done.');
  return s.steps;
}

// ─── Preset 3: two timers ───────────────────────────────────────────────────

export const TWO_TIMERS_CODE = `setTimeout(() => console.log("B (1000ms)"), 1000);
setTimeout(() => console.log("A (500ms)"), 500);
console.log("C (now)");`;

function twoTimersSteps(): ELStep[] {
  const s = new Sim();
  s.snap(null, 'Two timers, set in the order B then A. Which one prints first?');
  s.push('main()');
  s.snap(1, 'The file starts running inside main().');
  s.push('setTimeout(cbB, 1000)');
  s.snap(1, 'The first setTimeout asks the browser for a 1000 ms timer.');
  s.startTimer('b', 'timer 1000 ms → cbB', 1000);
  s.pop();
  s.snap(1, 'The browser starts counting. setTimeout returns straight away.');
  s.push('setTimeout(cbA, 500)');
  s.snap(2, 'The second setTimeout asks for a 500 ms timer.');
  s.startTimer('a', 'timer 500 ms → cbA', 500);
  s.pop();
  s.snap(2, 'Now two timers count down in the browser at the same time.');
  s.push('console.log("C (now)")');
  s.snap(3, 'JavaScript did not wait for either timer. It moves straight on to line 3.');
  s.log('C (now)');
  s.pop();
  s.snap(3, '"C (now)" prints first.');
  s.pop();
  s.snap(null, 'main() is done. The stack is empty, so the event loop keeps checking the queue.', {
    loop: 'checking',
  });
  s.tick(250);
  s.snap(null, '250 ms pass. Both timers are still counting, so the queue stays empty.', {
    loop: 'checking',
  });
  s.tick(250);
  s.snap(null, '500 ms: timer A reaches zero.', { loop: 'checking' });
  s.toQueue('a', 'cbA');
  s.snap(null, 'A was set second but finishes first, so its callback is first in the queue.', {
    loop: 'checking',
  });
  s.dequeue();
  s.snap(2, 'The stack is empty, so the event loop moves cbA onto it.', { loop: 'moving' });
  s.push('console.log("A …")');
  s.snap(2, 'cbA calls console.log.');
  s.log('A (500ms)');
  s.pop();
  s.pop();
  s.snap(null, '"A (500ms)" prints and cbA is done. Timer B still has 500 ms to go.', {
    loop: 'checking',
  });
  s.tick(250);
  s.snap(null, '750 ms: B keeps counting.', { loop: 'checking' });
  s.tick(250);
  s.snap(null, '1000 ms: timer B reaches zero.', { loop: 'checking' });
  s.toQueue('b', 'cbB');
  s.snap(null, 'cbB joins the queue.', { loop: 'checking' });
  s.dequeue();
  s.snap(1, 'The event loop moves cbB onto the empty stack.', { loop: 'moving' });
  s.push('console.log("B …")');
  s.snap(1, 'cbB calls console.log.');
  s.log('B (1000ms)');
  s.pop();
  s.pop();
  s.snap(
    null,
    'Output: C, A, B. The order in your code did not decide it; the order the timers finished did.',
  );
  return s.steps;
}

// ─── Preset 4: a click event ────────────────────────────────────────────────

export const CLICK_CODE = `const button = document.querySelector("#order");
button.addEventListener("click", () => {
  console.log("Clicked! Order received");
});
console.log("Listening for clicks");`;

function clickSteps(): ELStep[] {
  const s = new Sim();
  s.snap(null, 'This program does not use a timer. It waits for you.');
  s.push('main()');
  s.snap(1, 'The file starts running. Line 1 finds the button on the page.');
  s.push('addEventListener("click", cb)');
  s.snap(2, 'addEventListener hands the arrow function to the browser and says: run this on a click.');
  s.startTimer('click', 'click listener → onClick', Infinity);
  s.pop();
  s.snap(2, 'The browser now watches the button. Nothing else happens yet.');
  s.push('console.log("Listening…")');
  s.snap(5, 'JavaScript moves on to line 5 straight away.');
  s.log('Listening for clicks');
  s.pop();
  s.pop();
  s.snap(null, 'main() is done. The stack is empty, and the page is free to do anything else.', {
    loop: 'checking',
  });
  s.snap(
    null,
    'Waiting for a click… Press the "Click me" button. Until you do, the event loop has nothing to move.',
    { loop: 'checking', waitForClick: true },
  );
  // After the reader's click. The listener stays registered, it isn't used up.
  s.queue.push('onClick');
  s.snap(null, 'Your click! The browser puts the onClick callback in the queue.', {
    loop: 'checking',
  });
  s.dequeue();
  s.snap(2, 'The stack is empty, so the event loop moves onClick onto it.', { loop: 'moving' });
  s.push('console.log("Clicked! …")');
  s.snap(3, 'onClick calls console.log.');
  s.log('Clicked! Order received');
  s.pop();
  s.pop();
  s.snap(
    null,
    'Printed. The listener is still registered, so every later click would queue onClick again.',
  );
  return s.steps;
}

export const PRESETS: Preset[] = [
  { id: 'sync', name: 'Synchronous', code: SYNC_CODE, steps: syncSteps() },
  { id: 'timeout0', name: 'setTimeout(0)', code: TIMEOUT_ZERO_CODE, steps: timeoutZeroSteps() },
  { id: 'timers', name: 'Two timers', code: TWO_TIMERS_CODE, steps: twoTimersSteps() },
  { id: 'click', name: 'Click event', code: CLICK_CODE, steps: clickSteps() },
];
