/**
 * Article #11's programs: promises, await and the microtask queue.
 * Each one is checked against real JavaScript in eventLoop.test.ts.
 */
import { Sim, type ELStep, type Preset } from './engine';

const DRAIN = { loop: 'draining' as const };
const CHECK = { loop: 'checking' as const };
const MOVE = { loop: 'moving' as const };

// ─── 1. The article's puzzle: 1, 4, 3, 2 ────────────────────────────────────

export const PUZZLE_CODE = `console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");`;

function puzzleSteps(): ELStep[] {
  const s = new Sim();
  s.snap(null, 'Four lines, two of them “later”. Predict the order, then step through.');
  s.push('main()');
  s.snap(1, 'The script starts running inside main().');
  s.push('console.log("1")');
  s.log('1');
  s.pop();
  s.snap(1, '"1" is printed straight away.');
  s.push('setTimeout(cb, 0)');
  s.snap(2, 'setTimeout hands its callback to the browser with a 0 ms timer.');
  s.startTimer('t', 'timer 0 ms → log "2"', 0);
  s.pop();
  s.toQueue('t', 'log "2"');
  s.snap(
    2,
    'The timer is done at once, so the callback joins the TASK queue. It must wait for the stack to be empty.',
  );
  s.push('Promise.resolve().then(cb)');
  s.snap(
    3,
    'This promise is already fulfilled, so its .then callback goes straight to the MICROTASK queue.',
  );
  s.microtask('then: log "3"');
  s.pop();
  s.snap(3, 'Now one callback waits in each queue. The microtask queue is the VIP line ⭐.');
  s.push('console.log("4")');
  s.log('4');
  s.pop();
  s.snap(
    4,
    '"4" is printed. The script still runs to the very end before anything waits its turn.',
  );
  s.pop();
  s.snap(
    null,
    'The script is done and the stack is empty. Rule: first, empty the WHOLE microtask queue.',
    DRAIN,
  );
  s.runMicrotask();
  s.snap(
    3,
    'The promise callback goes onto the stack first, even though the timer was set earlier.',
    DRAIN,
  );
  s.push('console.log("3")');
  s.log('3');
  s.pop();
  s.pop();
  s.snap(3, '"3" is printed. The microtask queue is empty now.', DRAIN);
  s.snap(null, 'Only now does the event loop take ONE task from the task queue.', CHECK);
  s.dequeue();
  s.snap(2, 'The timer’s callback finally gets the stack.', MOVE);
  s.push('console.log("2")');
  s.log('2');
  s.pop();
  s.pop();
  s.snap(
    null,
    'Output: 1, 4, 3, 2. Microtasks (promises) always run before the next task (timers).',
  );
  return s.steps;
}

// ─── 2. await is a microtask ────────────────────────────────────────────────

export const AWAIT_CODE = `async function brew() {
  console.log("A: start brewing");
  await null;
  console.log("C: after await");
}
console.log("start");
brew();
console.log("B: meanwhile");`;

function awaitSteps(): ELStep[] {
  const s = new Sim();
  s.snap(null, 'An async function with an await in the middle. Where does the rest of it go?');
  s.push('main()');
  s.snap(1, 'Line 1 only defines brew. Nothing runs yet.');
  s.push('console.log("start")');
  s.log('start');
  s.pop();
  s.snap(6, '"start" is printed.');
  s.push('brew()');
  s.snap(7, 'brew() is called. An async function starts running straight away, like any function.');
  s.push('console.log("A: …")');
  s.log('A: start brewing');
  s.pop();
  s.snap(2, '"A: start brewing" is printed, still inside brew().');
  s.snap(
    3,
    'await null: brew pauses here. It gives up the stack until the awaited value is ready.',
  );
  s.pop();
  s.parked.push({ label: 'continue brew()', place: 'line 4', locals: [] });
  s.microtask('continue brew()');
  s.snap(
    3,
    'The rest of brew is packed up with its backpack 🎒 (where to carry on, and its local variables: none here), and the continuation goes in the microtask queue. brew() returns a pending promise to main().',
  );
  s.push('console.log("B: …")');
  s.log('B: meanwhile');
  s.pop();
  s.snap(8, '"B: meanwhile" is printed. main() carried on while brew was paused.');
  s.pop();
  s.snap(null, 'The script is done. Time to drain the microtask queue.', DRAIN);
  s.runMicrotask('brew() (resumed)');
  s.parked = [];
  s.snap(
    4,
    'brew() is back on the stack, right where it stopped, with everything it remembered.',
    DRAIN,
  );
  s.push('console.log("C: …")');
  s.log('C: after await');
  s.pop();
  s.snap(4, '"C: after await" is printed.', DRAIN);
  s.pop();
  s.snap(
    null,
    'brew() finishes (its promise fulfils). await paused the function and put the rest of it in the microtask queue.',
  );
  return s.steps;
}

// ─── 3. Microtasks queue more microtasks ────────────────────────────────────

export const CHAIN_CODE = `setTimeout(() => console.log("timeout"), 0);
Promise.resolve()
  .then(() => console.log("then 1"))
  .then(() => console.log("then 2"));`;

function chainSteps(): ELStep[] {
  const s = new Sim();
  s.snap(null, 'A timer, and a promise chain with two .then steps.');
  s.push('main()');
  s.push('setTimeout(cb, 0)');
  s.snap(1, 'setTimeout hands its callback to the browser.');
  s.startTimer('t', 'timer 0 ms → log "timeout"', 0);
  s.pop();
  s.toQueue('t', 'log "timeout"');
  s.snap(1, 'The 0 ms timer is done: its callback waits in the task queue.');
  s.push('.then(cb1)');
  s.snap(
    3,
    'The first .then is on an already-fulfilled promise, so “then 1” joins the microtask queue.',
  );
  s.microtask('then 1');
  s.pop();
  s.push('.then(cb2)');
  s.snap(
    4,
    'The second .then waits on the promise returned by the first one, which isn’t settled yet. So “then 2” isn’t queued yet: it just waits.',
  );
  s.pop();
  s.pop();
  s.snap(null, 'The script is done. Drain the microtask queue.', DRAIN);
  s.runMicrotask();
  s.push('console.log("then 1")');
  s.log('then 1');
  s.pop();
  s.pop();
  s.snap(
    3,
    '"then 1" is printed. Its callback finished, so the promise it returned is now fulfilled…',
    DRAIN,
  );
  s.microtask('then 2');
  s.snap(
    4,
    '…which queues “then 2” as a NEW microtask. The loop keeps draining: a microtask added during draining still runs before any task.',
    DRAIN,
  );
  s.runMicrotask();
  s.push('console.log("then 2")');
  s.log('then 2');
  s.pop();
  s.pop();
  s.snap(4, '"then 2" is printed. Now the microtask queue is really empty.', DRAIN);
  s.dequeue();
  s.snap(1, 'Only now does the timer’s callback get a turn.', MOVE);
  s.push('console.log("timeout")');
  s.log('timeout');
  s.pop();
  s.pop();
  s.snap(
    null,
    'Output: then 1, then 2, timeout. The microtask queue is fully drained before the next task.',
  );
  return s.steps;
}

// ─── 4. Mixed order challenge ───────────────────────────────────────────────

export const MIXED_CODE = `console.log("waiter: order taken");
setTimeout(() => console.log("timer A"), 0);
async function cook() {
  const dish = "dal";
  console.log("cook: start " + dish);
  await null;
  console.log("cook: " + dish + " ready");
}
cook();
Promise.resolve().then(() => console.log("bill printed"));
setTimeout(() => console.log("timer B"), 0);
console.log("waiter: next customer");`;

function mixedSteps(): ELStep[] {
  const s = new Sim();
  s.snap(null, 'Two timers, an async function and a promise. Predict the order first!');
  s.push('main()');
  s.push('console.log(…)');
  s.log('waiter: order taken');
  s.pop();
  s.snap(1, '"waiter: order taken" is printed.');
  s.push('setTimeout(cbA, 0)');
  s.startTimer('a', 'timer 0 ms → timer A', 0);
  s.pop();
  s.toQueue('a', 'log "timer A"');
  s.snap(2, 'Timer A is done at once: its callback waits in the task queue.');
  s.snap(3, 'Lines 3 to 8 only define cook().');
  s.push('cook()');
  s.snap(4, 'cook() runs straight away. It makes a local variable, dish = "dal".');
  s.push('console.log(…)');
  s.log('cook: start dal');
  s.pop();
  s.snap(5, 'It prints "cook: start dal".');
  s.pop();
  s.parked.push({ label: 'continue cook()', place: 'line 7', locals: [['dish', '"dal"']] });
  s.microtask('continue cook()');
  s.snap(
    6,
    'await null pauses cook(). The rest of it goes in the microtask queue, and its backpack 🎒 keeps dish safe until it resumes.',
  );
  s.push('.then(cb)');
  s.microtask('then: bill printed');
  s.pop();
  s.snap(
    10,
    'An already-fulfilled promise: its .then callback joins the microtask queue too, AFTER cook’s continuation.',
  );
  s.push('setTimeout(cbB, 0)');
  s.startTimer('b', 'timer 0 ms → timer B', 0);
  s.pop();
  s.toQueue('b', 'log "timer B"');
  s.snap(11, 'Timer B’s callback joins the task queue, behind timer A.');
  s.push('console.log(…)');
  s.log('waiter: next customer');
  s.pop();
  s.pop();
  s.snap(12, '"waiter: next customer" is printed. The script is done.');
  s.snap(null, 'Drain the microtask queue, in order.', DRAIN);
  s.runMicrotask('cook() (resumed)');
  s.parked = [];
  s.push('console.log(…)');
  s.log('cook: dal ready');
  s.pop();
  s.pop();
  s.snap(7, 'cook() resumes with dish still "dal", and prints "cook: dal ready".', DRAIN);
  s.runMicrotask();
  s.push('console.log(…)');
  s.log('bill printed');
  s.pop();
  s.pop();
  s.snap(10, '"bill printed". The microtask queue is empty.', DRAIN);
  s.dequeue();
  s.push('console.log(…)');
  s.log('timer A');
  s.pop();
  s.pop();
  s.snap(2, 'Now ONE task: timer A. Then the loop checks for microtasks again (none).', MOVE);
  s.dequeue();
  s.push('console.log(…)');
  s.log('timer B');
  s.pop();
  s.pop();
  s.snap(11, 'Then timer B. All done.', MOVE);
  s.snap(
    null,
    'Script first, then every microtask (await, .then), then tasks one at a time (timers).',
  );
  return s.steps;
}

export const ASYNC_PRESETS: Preset[] = [
  { id: 'puzzle', name: '1, 4, 3, 2', code: PUZZLE_CODE, steps: puzzleSteps(), predict: true },
  { id: 'await', name: 'await is a microtask', code: AWAIT_CODE, steps: awaitSteps() },
  { id: 'chain', name: 'Microtasks queue more', code: CHAIN_CODE, steps: chainSteps() },
  { id: 'mixed', name: 'Mixed challenge', code: MIXED_CODE, steps: mixedSteps(), predict: true },
];
