// Visualizers for the note "Scope, Hoisting & Closures"
// (src/content/javascript/scope-hoisting-closures.mdx imports them by name).
// Only that note imports this file, so all of it lands in its own lazy chunk.
import '../core/viz.css';
import '../core/memory/memory.css';
import '../core/code/code.css';
import '../core/stack/stack.css';
import '../core/scope/scope.css';
import './js-closures.css';

export { default as ScopeChain } from './ScopeChain';
export { default as HoistingPhases } from './HoistingPhases';
export { default as ClosureBackpack } from './ClosureBackpack';
export { default as PiggyBankFactory } from './PiggyBankFactory';
export { default as ClosuresQuiz } from './ClosuresQuiz';
