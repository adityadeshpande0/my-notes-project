// Visualizers for the note "JavaScript Basics"
// (src/content/javascript/what-is-javascript.mdx imports them by name).
//
// Only that note imports this file, so all of this code (and the CSS) lands in
// the note's own lazy chunk. The 3D part of WhereJsRuns is split out even
// further: it's a separate chunk loaded only when that visual nears the screen.
import '../core/viz.css';
import '../core/stack/stack.css';
import './js-basics.css';

export { default as WebsiteLayers } from './WebsiteLayers';
export { default as WhyJsSimulator } from './WhyJsSimulator';
export { default as JavaVsJavaScript } from './JavaVsJavaScript';
export { default as HistoryTimeline } from './HistoryTimeline';
export { default as EventLoop } from './EventLoop';
export { default as CodePlayground } from './CodePlayground';
export { default as GuessTheOutput } from './GuessTheOutput';
export { default as WhereJsRuns } from './WhereJsRuns';
export { default as JsBasicsQuiz } from './JsBasicsQuiz';
