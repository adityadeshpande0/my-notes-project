/** Shared data for "JavaScript's universe" (2D and 3D draw the same planets). */

export interface Planet {
  id: string;
  icon: string;
  name: string;
  text: string;
  example: string;
  /** Theme colour (CSS variable name) for this planet. */
  colorVar: string;
}

export const PLANETS: Planet[] = [
  {
    id: 'browsers',
    icon: '🌐',
    name: 'Browsers',
    text: 'Where it all began: the interactivity on every website.',
    example: 'Gmail, YouTube, this site',
    colorVar: '--accent',
  },
  {
    id: 'servers',
    icon: '🖥️',
    name: 'Servers',
    text: 'Node.js (2009), and newer runtimes Deno and Bun, run JavaScript on servers.',
    example: 'APIs, chat servers',
    colorVar: '--accent-2',
  },
  {
    id: 'mobile',
    icon: '📱',
    name: 'Mobile apps',
    text: 'React Native lets JavaScript power iOS and Android apps.',
    example: 'Many popular apps use it',
    colorVar: '--violet',
  },
  {
    id: 'desktop',
    icon: '💻',
    name: 'Desktop apps',
    text: 'Electron wraps web technology into desktop apps.',
    example: 'VS Code, Discord, Slack',
    colorVar: '--pink',
  },
  {
    id: 'games',
    icon: '🎮',
    name: 'Games and 3D',
    text: 'Canvas, WebGL and WebGPU draw graphics right in the browser.',
    example: 'three.js scenes like this one!',
    colorVar: '--success',
  },
  {
    id: 'devices',
    icon: '🔌',
    name: 'Tiny devices',
    text: 'Small JavaScript engines run on microcontrollers.',
    example: 'Espruino, IoT gadgets',
    colorVar: '--danger',
  },
];
