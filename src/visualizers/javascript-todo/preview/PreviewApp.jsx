// The reference App.jsx, as used by the "Same actions, two apps" visual.
// It is IDENTICAL to ../reference/react/App.jsx except for the lines marked
// "preview:" (its own storage key, and reporting state to the visual) and the
// import paths. preview.test.ts checks that nothing else differs.
import { useEffect, useState } from "react";
import TodoForm from "../reference/react/TodoForm.jsx";
import TodoItem from "../reference/react/TodoItem.jsx";
import FilterBar from "../reference/react/FilterBar.jsx";

const STORAGE_KEY = "stackscape-todos-preview"; // preview: its own key, so it never touches your app's tasks

function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function makeId() {
  return crypto.randomUUID?.() ?? String(Date.now() + Math.random());
}

export default function App({ onState }) { // preview: reports its state to the visual
  const [todos, setTodos] = useState(loadTodos);   // load once, on first render
  const [filter, setFilter] = useState("all");

  // Save whenever todos change (replaces the vanilla saveTodos() calls)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // storage unavailable: keep working without saving
    }
  }, [todos]);

  // preview: tell the visual the current data (not in the reference app)
  useEffect(() => onState?.(todos), [todos, onState]);

  const addTodo = (text) =>
    setTodos((prev) => [...prev, { id: makeId(), text, done: false }]);
  const toggleTodo = (id) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const deleteTodo = (id) => setTodos((prev) => prev.filter((t) => t.id !== id));
  const clearDone = () => setTodos((prev) => prev.filter((t) => !t.done));

  // Derived values: calculated during render, never stored in state
  const visible = todos.filter((t) =>
    filter === "active" ? !t.done : filter === "done" ? t.done : true
  );
  const left = todos.filter((t) => !t.done).length;

  return (
    <main className="app">
      <h1>☕ Chai To-Do</h1>
      <TodoForm onAdd={addTodo} />
      <ul id="todo-list">
        {visible.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
        ))}
      </ul>
      {todos.length === 0 && <p id="empty">Nothing to do… enjoy your chai ☕</p>}
      <footer>
        <span id="count">{left} {left === 1 ? "task" : "tasks"} left</span>
        <FilterBar filter={filter} onChange={setFilter} />
        {todos.some((t) => t.done) && (
          <button id="clear-done" onClick={clearDone}>Clear done</button>
        )}
      </footer>
    </main>
  );
}
