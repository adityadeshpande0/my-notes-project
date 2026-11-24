// Visualizers for the note "Functions" (src/content/javascript/functions.mdx
// imports them by name). Only that note imports this file, so all of it lands
// in the note's own lazy chunk.
import '../core/viz.css';
import '../core/memory/memory.css';
import '../core/code/code.css';
import '../core/stack/stack.css';
import '../core/scope/scope.css';
import './js-functions.css';

export { default as FunctionMachine } from './FunctionMachine';
export { default as ParamsArgsSlots } from './ParamsArgsSlots';
export { default as ReturnVsLog } from './ReturnVsLog';
export { default as ArrowMorph } from './ArrowMorph';
export { default as FunctionsAsValues } from './FunctionsAsValues';
export { default as CallStackTower } from './CallStackTower';
export { default as ScopeBubbles } from './ScopeBubbles';
export { default as TipCalculator } from './TipCalculator';
export { default as RecursionTree } from './RecursionTree';
export { default as FunctionsQuiz } from './FunctionsQuiz';
