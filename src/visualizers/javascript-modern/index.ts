// Visualizers for the note "Modern JavaScript (ES6+)"
// (src/content/javascript/modern-javascript.mdx imports them by name).
// Only that note imports this file, so all of it lands in its own lazy chunk.
import '../core/viz.css';
import '../core/code/code.css';
import '../core/memory/memory.css';
import './js-modern.css';

export { default as UnpackAndPack } from './UnpackAndPack';
export { default as ModuleMap } from './ModuleMap';
export { default as OldVsNew } from './OldVsNew';
export { default as ModernQuiz } from './ModernQuiz';
