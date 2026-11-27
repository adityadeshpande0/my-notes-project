import type { JSX } from 'react';

export interface PreviewTodo {
  id: string;
  text: string;
  done: boolean;
}
/** The reference React app (see PreviewApp.jsx), reporting its todos. */
export default function App(props: { onState?: (todos: PreviewTodo[]) => void }): JSX.Element;
