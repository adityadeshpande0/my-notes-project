# Chai To-Do, part 2: React

Now build the same app in React. `style.css` is the same as before, and the
four components (`App.jsx`, `TodoForm.jsx`, `TodoItem.jsx`, `FilterBar.jsx`)
have their props and `// TODO:` comments, but no logic.

## Open it

```bash
npm run dev
```

Then open <http://localhost:5173/projects/todo-react/index.html>.

## Run the tests

The **same** tests as the plain-JS version:

```bash
npm run test:todo -- --project=react
```

## The steps

- [ ] **1. Static JSX.** Copy the HTML from `projects/todo-vanilla/index.html` into `App` (`class` becomes `className`).
- [ ] **2. State and `.map`.** `useState` with two hard-coded tasks; render them with `todos.map(todo => <TodoItem key={todo.id} todo={todo} … />)`.
- [ ] **3. Adding.** `TodoForm` as a controlled input (`value` + `onChange`), calling `onAdd`; `addTodo` uses `setTodos(prev => [...prev, newTodo])`.
- [ ] **4. Toggle and delete.** Pass `onToggle` and `onDelete` down as props; `map` and `filter` in `App`.
- [ ] **5. Filters and derived values.** `const [filter, setFilter] = useState("all")`; calculate `visible` and `left` during render (don't store them in state). `FilterBar` maps over an array of filters.
- [ ] **6. Saving.** A `useEffect` that saves `todos` whenever they change, and `useState(loadTodos)` (pass the function: it then runs only once).
- [ ] **7. Polish.** "Clear done" (only shown when something is done), `aria-label`s, the singular "1 task left".

## Plain JS → React

| Plain JavaScript (part 1)                        | React (part 2)                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `let todos = []` plus `update()`                 | `const [todos, setTodos] = useState([])`. Calling `setTodos` re-renders automatically |
| `render()` builds DOM elements                   | **Components** _return_ what the page should look like (JSX)                          |
| `createElement("li")` in a loop                  | `todos.map(todo => <TodoItem key={todo.id} … />)`                                     |
| Event delegation on the `<ul>`                   | `onClick` / `onChange` props on each element (React delegates for you)                |
| `saveTodos()` after every change                 | **`useEffect`** that runs whenever `todos` changes                                    |
| `list.replaceChildren(...)` (rebuilds every row) | React changes **only what's different**                                               |
| The `filter` variable                            | `const [filter, setFilter] = useState("all")`                                         |

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
