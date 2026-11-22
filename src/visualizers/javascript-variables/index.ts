// Visualizers for the note "Variables & Data Types"
// (src/content/javascript/variables-and-data-types.mdx imports them by name).
// Only that note imports this file, so all of it lands in the note's own lazy chunk.
import '../core/viz.css';
import '../core/memory/memory.css';
import './js-variables.css';

export { default as VariableBoxes } from './VariableBoxes';
export { default as NameChecker } from './NameChecker';
export { default as LetConstVar } from './LetConstVar';
export { default as TypeZoo } from './TypeZoo';
export { default as StringBoxes } from './StringBoxes';
export { default as NumberLab } from './NumberLab';
export { default as CopyVsReference } from './CopyVsReference';
export { default as CoercionMachine } from './CoercionMachine';
export { default as VariablesQuiz } from './VariablesQuiz';
