/**
 * "Robot" actions on a to-do app, done the way a user would: typing into the
 * input and submitting the form, clicking checkboxes and buttons. The same
 * function drives both apps:
 * - the plain-JS one inside its sandboxed iframe (the bridge script embeds
 *   this exact function), and
 * - the React one on this page.
 *
 * It's async: after each step it waits a moment, the way a real user's
 * keystrokes and clicks arrive separately. (React applies state updates from
 * an event a moment later, so typing and submitting in the very same instant
 * would read the old text.)
 *
 * Self-contained on purpose (no imports, no outside variables).
 */
export type TodoAction =
  | { type: 'add'; text: string }
  | { type: 'addMany'; texts: string[] }
  | { type: 'tick'; n: number }
  | { type: 'delete'; n: number }
  | { type: 'filter'; value: 'all' | 'active' | 'done' }
  | { type: 'clear' }
  | { type: 'reset' };

export async function driveTodo(root: ParentNode, action: TodoAction) {
  const wait = () => new Promise((r) => setTimeout(r, 0));
  const $ = (sel: string) => root.querySelector(sel) as HTMLElement | null;
  const type = async (text: string) => {
    const input = $('#todo-input') as HTMLInputElement | null;
    const form = $('#todo-form') as HTMLFormElement | null;
    if (!input || !form) return;
    // Set the value the way the browser does when you type, so React's
    // onChange sees it too, then submit the form like pressing Enter.
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')?.set;
    if (setter) setter.call(input, text);
    else input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await wait();
    form.requestSubmit();
    await wait();
  };
  const row = (n: number) =>
    root.querySelectorAll('#todo-list .todo')[n - 1] as HTMLElement | undefined;
  if (action.type === 'add') await type(action.text);
  else if (action.type === 'addMany') for (const t of action.texts) await type(t);
  else if (action.type === 'tick')
    (row(action.n)?.querySelector('.toggle') as HTMLElement | null)?.click();
  else if (action.type === 'delete')
    (row(action.n)?.querySelector('.delete') as HTMLElement | null)?.click();
  else if (action.type === 'filter') $(`[data-filter="${action.value}"]`)?.click();
  else if (action.type === 'clear') $('#clear-done')?.click();
  else if (action.type === 'reset') {
    $('[data-filter="all"]')?.click();
    // Delete from the top until the list is empty (a few at a time is plenty).
    await wait();
    for (let k = 0; k < 50 && row(1); k++) {
      (row(1)!.querySelector('.delete') as HTMLElement).click();
      await wait();
    }
  }
  await wait();
}
