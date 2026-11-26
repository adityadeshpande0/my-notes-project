/**
 * The event loop engine, shared by "What is JavaScript" (article #1) and
 * "Asynchronous JavaScript" (article #11). Plain TypeScript, no React.
 *
 * Each preset is a small program plus a hand-written "script" of what the
 * runtime does with it. `Sim` keeps the current state of the call stack, Web
 * APIs, the two queues and the console, and `snap()` saves a copy of it as
 * one Step. The renderer (EventLoop.tsx) only draws those snapshots.
 *
 * The rules it models (simplified from the HTML spec):
 *   run the script to the end → drain ALL microtasks (even ones queued by
 *   microtasks) → take ONE task → drain microtasks again → …
 *
 * eventLoop.test.ts runs every preset's REAL code and checks the simulated
 * console ends up identical, so the visual can never lie.
 */

export type LoopState = 'idle' | 'checking' | 'moving' | 'draining';

export interface WebApiTask {
  id: string;
  label: string;
  /** Time left before the callback is ready (0 = ready). Infinity for "waits for a click". */
  msLeft: number;
  msTotal: number;
}

/** A function paused at an `await`, waiting to be continued. */
export interface Parked {
  label: string;
  /** Where it will carry on ("line 4"). */
  place: string;
  /** Its local variables, kept while it waits: [name, value as code]. */
  locals: [string, string][];
}

export interface ELStep {
  /** Highlighted code line (1-based), or null when no line is running. */
  line: number | null;
  /** Bottom → top, e.g. ["main()", "greet()"] */
  stack: string[];
  webApis: WebApiTask[];
  /** Task queue (also called the callback or macrotask queue), oldest first. */
  queue: string[];
  /** Microtask queue: promise callbacks and code after an await, oldest first. */
  microtasks: string[];
  /** Paused async functions (for the "await is a microtask" preset). */
  parked: Parked[];
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
  /** Ask the reader to predict the output order before stepping. */
  predict?: boolean;
}

/** A small mutable model of the runtime. Every `snap()` stores a deep copy. */
export class Sim {
  stack: string[] = [];
  webApis: WebApiTask[] = [];
  queue: string[] = [];
  microtasks: string[] = [];
  parked: Parked[] = [];
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
      microtasks: [...this.microtasks],
      parked: this.parked.map((p) => ({
        ...p,
        locals: p.locals.map((r) => [...r] as [string, string]),
      })),
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
  /** A finished Web API task hands its callback to the task queue. */
  toQueue(id: string, callback: string) {
    this.webApis = this.webApis.filter((t) => t.id !== id);
    this.queue.push(callback);
  }
  /** The event loop moves the oldest task onto the (empty) stack. */
  dequeue() {
    const cb = this.queue.shift();
    if (cb) this.stack.push(cb);
  }
  /** A promise callback (or the rest of an async function) joins the microtask queue. */
  microtask(callback: string) {
    this.microtasks.push(callback);
  }
  /** The event loop moves the oldest microtask onto the (empty) stack. */
  runMicrotask(frame?: string) {
    const cb = this.microtasks.shift();
    if (cb) this.stack.push(frame ?? cb);
  }
}
