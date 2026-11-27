// ☕ Chai To-Do: plain JavaScript version
// The pattern: keep the data in `todos`, change it with small functions,
// then call render() to redraw the page FROM the data.

const STORAGE_KEY = "stackscape-todos";

// ---- State (the single source of truth) ----
let todos = loadTodos();
let filter = "all"; // "all" | "active" | "done"

// ---- Elements we need (found once) ----
const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const list = document.querySelector("#todo-list");
const empty = document.querySelector("#empty");
const count = document.querySelector("#count");
const filters = document.querySelector(".filters");
const clearButton = document.querySelector("#clear-done");

// ---- Saving and loading (article #7: JSON + localStorage) ----
function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return []; // storage blocked or broken data: start fresh
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // storage unavailable: the app still works, it just won't remember
  }
}

function makeId() {
  return crypto.randomUUID?.() ?? String(Date.now() + Math.random());
}

// ---- Changing the data (articles #5, #6, #13: functions, map/filter, spread) ----
function addTodo(text) {
  todos = [...todos, { id: makeId(), text, done: false }];
  update();
}

function toggleTodo(id) {
  todos = todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo));
  update();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  update();
}

function clearDone() {
  todos = todos.filter((todo) => !todo.done);
  update();
}

function update() {
  saveTodos();
  render();
}

// ---- Drawing the page from the data (article #9: the DOM) ----
function visibleTodos() {
  if (filter === "active") return todos.filter((todo) => !todo.done);
  if (filter === "done") return todos.filter((todo) => todo.done);
  return todos;
}

function createTodoElement(todo) {
  const li = document.createElement("li");
  li.className = "todo";
  li.dataset.id = todo.id;
  li.classList.toggle("done", todo.done);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "toggle";
  checkbox.checked = todo.done;
  checkbox.setAttribute("aria-label", `Mark "${todo.text}" as done`);

  const text = document.createElement("span");
  text.className = "text";
  text.textContent = todo.text; // textContent, never innerHTML: it's user input!

  const del = document.createElement("button");
  del.className = "delete";
  del.textContent = "✕";
  del.setAttribute("aria-label", `Delete "${todo.text}"`);

  li.append(checkbox, text, del);
  return li;
}

function render() {
  list.replaceChildren(...visibleTodos().map(createTodoElement));

  const left = todos.filter((todo) => !todo.done).length;
  count.textContent = `${left} ${left === 1 ? "task" : "tasks"} left`;

  empty.hidden = todos.length > 0;
  clearButton.hidden = !todos.some((todo) => todo.done);

  for (const button of filters.querySelectorAll("[data-filter]")) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
  }
}

// ---- Listening (article #10: events, preventDefault, delegation) ----
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTodo(text);
  input.value = "";
  input.focus();
});

list.addEventListener("click", (event) => {
  if (!event.target.matches(".delete")) return;
  deleteTodo(event.target.closest(".todo").dataset.id);
});

list.addEventListener("change", (event) => {
  if (!event.target.matches(".toggle")) return;
  toggleTodo(event.target.closest(".todo").dataset.id);
});

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  filter = button.dataset.filter;
  render();
});

clearButton.addEventListener("click", clearDone);

render();
