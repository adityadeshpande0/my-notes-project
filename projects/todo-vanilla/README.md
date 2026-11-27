# Chai To-Do, part 1: plain JavaScript

Build the to-do app from article #14 **yourself**, in plain HTML, CSS and
JavaScript. `index.html` and `style.css` are ready (they're the same as the
reference). Your job is `script.js`, which has the outline and `// TODO:`
comments, but no code yet.

## Open it

```bash
npm run dev
```

Then open <http://localhost:5173/projects/todo-vanilla/index.html>.

## Run the tests

```bash
npm run test:todo -- --project=vanilla
```

They fail at first: that's expected! Each test is tagged with the stage that
introduces its feature (`@stage3`…), so run only the tests up to your stage:

```bash
npm run test:todo -- --project=vanilla --grep "@stage[1-3]"
```

**Hint:** build stage by stage, and run the tests after each stage: the tagged
tests tell you what's next.

## The 7 stages

- [ ] **1. The skeleton.** Already done: look at the HTML. Notice `defer` on the script.
- [ ] **2. Data and `render()`.** A `todos` array with two sample tasks, `createTodoElement`, and `render()` with `list.replaceChildren(...)`. Use `textContent`, never `innerHTML`.
- [ ] **3. Adding tasks.** Start with `todos = []`. Listen for `submit`, `preventDefault()`, trim, ignore blanks, add with spread, clear the input.
- [ ] **4. Ticking off and deleting.** ONE click and ONE change listener on the `<ul>` (event delegation), `closest(".todo")`, `dataset.id`, `map` and `filter`.
- [ ] **5. Counter, empty state, filters.** Derived in `render()`: "3 tasks left" / "1 task left", the empty message, `aria-pressed`.
- [ ] **6. Remembering tasks.** `localStorage` + JSON, in `try...catch`, and an `update()` that saves then renders.
- [ ] **7. Polish.** "Clear done", hide it when nothing is done, keep focus in the input, `aria-label`s.

## The selector contract

The shared tests (`tests/todo.spec.ts`) look for these. Keep them exactly:

| Selector                                    | What it is                                                        |
| ------------------------------------------- | ----------------------------------------------------------------- |
| `#todo-form`                                | the form                                                          |
| `#todo-input`                               | the text input                                                    |
| `form button[type=submit]`                  | the Add button                                                    |
| `#todo-list`                                | the `<ul>` of tasks                                               |
| `.todo`                                     | each task (`<li>`), with the class `done` when it's done          |
| `.todo .toggle`                             | its checkbox                                                      |
| `.todo .text`                               | its text                                                          |
| `.todo .delete`                             | its delete button                                                 |
| `#count`                                    | "3 tasks left" / "1 task left"                                    |
| `[data-filter="all"]`, `"active"`, `"done"` | the filter buttons, with `aria-pressed="true"` on the current one |
| `#clear-done`                               | "Clear done" (hidden when nothing is done)                        |
| `#empty`                                    | the empty message (hidden when there are tasks)                   |
