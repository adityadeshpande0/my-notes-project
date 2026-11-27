// ☕ Chai To-Do: plain JavaScript version (YOUR version!)
// The pattern: keep the data in `todos`, change it with small functions,
// then call render() to redraw the page FROM the data.
//
// Build it stage by stage (see README.md), and run the tests after each one:
//   npm run test:todo -- --project=vanilla

// TODO (stage 6): const STORAGE_KEY = "stackscape-todos";

// ---- State (the single source of truth) ----
// TODO (stage 2): let todos = [ …two sample tasks… ];  (stage 3: start with []; stage 6: loadTodos())
// TODO (stage 5): let filter = "all"; // "all" | "active" | "done"

// ---- Elements we need (found once) ----
// TODO: find the form, input, list, empty message, count, filters and clear button
//       with document.querySelector (the selectors are listed in README.md).

// ---- Saving and loading (article #7: JSON + localStorage) ----
// TODO (stage 6): loadTodos(): JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [], inside try/catch
// TODO (stage 6): saveTodos(): localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)), inside try/catch

// TODO (stage 3): makeId(): crypto.randomUUID?.() ?? a time-plus-random fallback

// ---- Changing the data (articles #5, #6, #13: functions, map/filter, spread) ----
// TODO (stage 3): addTodo(text): a NEW array with the new task added (spread)
// TODO (stage 4): toggleTodo(id): map, flipping `done` on the matching task
// TODO (stage 4): deleteTodo(id): filter it out
// TODO (stage 7): clearDone(): filter out the done tasks
// TODO (stage 6): update(): save, then render (call it at the end of every change function)

// ---- Drawing the page from the data (article #9: the DOM) ----
// TODO (stage 5): visibleTodos(): the tasks the current filter shows
// TODO (stage 2): createTodoElement(todo): an <li class="todo"> with a checkbox (.toggle),
//                 a <span class="text"> (textContent, never innerHTML!) and a button (.delete)
// TODO (stage 2): render(): list.replaceChildren(...) from the data
//                 (stage 5: the counter, the empty message, aria-pressed on the filters;
//                  stage 7: hide "Clear done" when nothing is done)

// ---- Listening (article #10: events, preventDefault, delegation) ----
// TODO (stage 3): the form's submit: preventDefault, trim, ignore blanks, add, clear the input
// TODO (stage 4): ONE click listener and ONE change listener on the list (event delegation)
// TODO (stage 5): one click listener on the filter buttons
// TODO (stage 7): the "Clear done" button

// TODO (stage 2): render();
