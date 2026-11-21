/**
 * Shared glossary. Any note can explain a word on hover with:
 *
 *   <Term id="big-o">Big-O</Term>
 *
 * Write definitions for a beginner: one or two plain sentences, no jargon that
 * would itself need a definition. `note` points to the topic that covers it in
 * depth; the link only appears once that note exists.
 */
export interface GlossaryEntry {
  term: string;
  definition: string;
  note?: string; // e.g. "/dsa/binary-search"
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  array: {
    term: 'Array',
    definition:
      'An ordered list of values stored side by side in memory. Each value has a numbered position called its index.',
    note: '/dsa/arrays-and-big-o',
  },
  index: {
    term: 'Index',
    definition:
      'The position number of an item in an array. Counting starts at 0, so the first item is at index 0 and the last is at length − 1.',
  },
  contiguous: {
    term: 'Contiguous memory',
    definition:
      'Stored in one unbroken block, with no gaps between items. This is what lets the computer jump straight to any item.',
  },
  'big-o': {
    term: 'Big-O notation',
    definition:
      'A way to describe how the work an algorithm does grows as its input gets bigger. It ignores small details and keeps only the overall shape of the growth.',
    note: '/dsa/arrays-and-big-o',
  },
  'constant-time': {
    term: 'Constant time, O(1)',
    definition:
      'The work takes the same number of steps however big the input is. Reading arr[5] costs the same in a list of 10 or 10 million.',
  },
  'linear-time': {
    term: 'Linear time, O(n)',
    definition:
      'The work grows in step with the input. Twice as many items means roughly twice as many steps.',
  },
  'logarithmic-time': {
    term: 'Logarithmic time, O(log n)',
    definition:
      'The work grows very slowly because each step cuts the problem in half. A million items take only about 20 steps.',
    note: '/dsa/binary-search',
  },
  'off-by-one': {
    term: 'Off-by-one error',
    definition:
      'A bug where a loop runs one time too many or too few, usually from mixing up < with <=, or length with length − 1.',
  },
  amortized: {
    term: 'Amortized cost',
    definition:
      'The average cost per operation over a long run. An occasional slow step is fine if it is rare enough that the average stays low.',
  },
  bit: {
    term: 'Bit',
    definition:
      'The smallest piece of information: a single 0 or 1. In hardware it is a wire at low or high voltage.',
    note: '/fundamentals/from-code-to-electrons',
  },
  binary: {
    term: 'Binary',
    definition:
      'Writing numbers in base 2, using only the digits 0 and 1. Each position is worth double the one to its right: 1, 2, 4, 8, 16…',
    note: '/fundamentals/from-code-to-electrons',
  },
  compiler: {
    term: 'Compiler',
    definition:
      'A program that translates source code you can read into machine code a CPU can run.',
    note: '/fundamentals/from-code-to-electrons',
  },
  token: {
    term: 'Token',
    definition:
      'One “word” of code, like `let`, `total`, `=` or `5`, labelled with what kind of word it is.',
  },
  ast: {
    term: 'Abstract Syntax Tree (AST)',
    definition:
      'A tree that shows what code means, after the parser has checked its grammar. `5 + 3` becomes an “add” node with 5 and 3 underneath.',
  },
  'constant-folding': {
    term: 'Constant folding',
    definition:
      'An optimization where the compiler works out an expression that never changes, like 5 + 3, ahead of time and just writes 8.',
  },
  assembly: {
    term: 'Assembly language',
    definition:
      'Machine code written with short readable names (LOAD, ADD, STORE) instead of raw bits. One line usually equals one CPU instruction.',
    note: '/fundamentals/from-code-to-electrons',
  },
  'machine-code': {
    term: 'Machine code',
    definition: 'Instructions encoded as bits. It is the only thing a CPU can actually execute.',
    note: '/fundamentals/from-code-to-electrons',
  },
  opcode: {
    term: 'Opcode',
    definition:
      'The part of an instruction that says what to do (add, load, store). The rest of the bits say what to do it to.',
  },
  register: {
    term: 'Register',
    definition:
      'A tiny, ultra-fast storage slot inside the CPU. A CPU has only a handful, so values are moved in and out of RAM.',
    note: '/fundamentals/from-code-to-electrons',
  },
  ram: {
    term: 'RAM (memory)',
    definition:
      'The computer’s main working memory: a huge row of numbered slots outside the CPU. Much bigger than registers, but slower.',
  },
  executable: {
    term: 'Executable',
    definition:
      'A file full of machine code that the operating system can load and run, like a .exe on Windows.',
  },
  bytecode: {
    term: 'Bytecode',
    definition:
      'Compact instructions for a virtual machine rather than a real CPU. Easier to generate than machine code, and quick to interpret.',
  },
  interpreter: {
    term: 'Interpreter',
    definition:
      'A program that reads code (or bytecode) and carries it out step by step, without first turning all of it into machine code.',
  },
  jit: {
    term: 'JIT (Just-In-Time) compilation',
    definition:
      'Compiling code to machine code while the program is already running, focusing on the parts that run most often.',
    note: '/fundamentals/from-code-to-electrons',
  },
  'program-counter': {
    term: 'Program Counter (PC)',
    definition:
      'A register that holds the memory address of the next instruction. It’s the CPU’s bookmark.',
    note: '/fundamentals/from-code-to-electrons',
  },
  alu: {
    term: 'ALU (Arithmetic Logic Unit)',
    definition:
      'The part of the CPU that does the maths (add, subtract) and logic (compare, AND, OR).',
    note: '/fundamentals/from-code-to-electrons',
  },
  clock: {
    term: 'Clock',
    definition:
      'A signal that ticks billions of times per second. Every tick, the CPU’s parts move forward one step together.',
  },
  pipelining: {
    term: 'Pipelining',
    definition:
      'Overlapping instructions like an assembly line: fetching the next one while decoding this one and executing the one before.',
  },
  'logic-gate': {
    term: 'Logic gate',
    definition:
      'A tiny circuit that takes one or two bits in and gives one bit out, following a fixed rule such as AND, OR or NOT.',
    note: '/fundamentals/from-code-to-electrons',
  },
  'full-adder': {
    term: 'Full adder',
    definition:
      'A small circuit of logic gates that adds two bits plus a carry, giving a sum bit and a carry out.',
    note: '/fundamentals/from-code-to-electrons',
  },
  'carry-lookahead': {
    term: 'Carry-lookahead',
    definition:
      'A faster adder design that works out all the carries at once, instead of waiting for each one to ripple across.',
  },
  transistor: {
    term: 'Transistor (MOSFET)',
    definition:
      'A switch with no moving parts. Voltage on its gate decides whether current can flow through it.',
    note: '/fundamentals/from-code-to-electrons',
  },
  doping: {
    term: 'Doping',
    definition:
      'Mixing tiny amounts of another element into silicon to change how easily it conducts electricity.',
  },
  'threshold-voltage': {
    term: 'Threshold voltage',
    definition:
      'The gate voltage a transistor needs before enough electrons gather to form a channel and switch it on.',
  },
  cmos: {
    term: 'CMOS',
    definition:
      'Building gates from pairs of opposite transistors (NMOS and PMOS) so only one conducts at a time and almost no power is wasted.',
  },
  'call-stack': {
    term: 'Call stack',
    definition:
      'The list of functions that are running right now. Calling a function puts it on top; when it finishes, it comes off. JavaScript only ever runs the top one.',
    note: '/javascript/what-is-javascript',
  },
  'event-loop': {
    term: 'Event loop',
    definition:
      'The part of a JavaScript runtime that waits until the call stack is empty, then moves the next waiting callback onto it.',
    note: '/javascript/what-is-javascript',
  },
  callback: {
    term: 'Callback',
    definition:
      'A function you hand to someone else to call later, such as "run this when the timer ends" or "run this on a click".',
  },
  'type-coercion': {
    term: 'Type coercion',
    definition:
      'JavaScript quietly converting a value from one type to another, like the text "5" to the number 5, when you mix types.',
  },
  ecmascript: {
    term: 'ECMAScript',
    definition:
      'The official standard that describes the JavaScript language. Engines like V8 follow it. A new edition comes out every year.',
  },
  'single-threaded': {
    term: 'Single-threaded',
    definition:
      'Able to run only one piece of code at a time, in one sequence. The opposite is running several things truly in parallel.',
  },
  variable: {
    term: 'Variable',
    definition:
      'A named box in memory that holds a value. You create it once and can read it, or (with let) change it, later.',
    note: '/javascript/variables-and-data-types',
  },
  primitive: {
    term: 'Primitive',
    definition:
      'A simple, single value: a string, number, bigint, boolean, undefined, null or symbol. Primitives are copied when you assign them.',
    note: '/javascript/variables-and-data-types',
  },
  heap: {
    term: 'Heap',
    definition:
      'The area of memory where objects and arrays live. Variables don’t hold the object itself, only an arrow (a reference) to it.',
  },
  reference: {
    term: 'Reference',
    definition:
      'An arrow from a variable to an object in memory. Copying the variable copies the arrow, not the object.',
    note: '/javascript/variables-and-data-types',
  },
  hoisting: {
    term: 'Hoisting',
    definition:
      'JavaScript sets up a scope’s variables before running its code. var variables start as undefined; let and const exist but can’t be used until their line.',
  },
  tdz: {
    term: 'Temporal Dead Zone',
    definition:
      'The part of a block before a let or const line runs. Using the variable there throws a ReferenceError instead of quietly giving undefined.',
  },
  'block-scope': {
    term: 'Block scope',
    definition:
      'A variable that only exists inside the { } block it was created in. let and const are block-scoped; var is not.',
  },
  immutable: {
    term: 'Immutable',
    definition:
      'Can’t be changed in place. String methods never change the original string; they return a new one.',
  },
  'template-literal': {
    term: 'Template literal',
    definition:
      'A string written with backticks that can include values with ${ }, like `Hi ${name}`.',
  },
  'dynamic-typing': {
    term: 'Dynamically typed',
    definition:
      'A variable can hold any type of value, and the type is checked while the code runs, not before.',
  },
};
