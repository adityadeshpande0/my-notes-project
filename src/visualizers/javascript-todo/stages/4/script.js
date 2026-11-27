// ☕ Chai To-Do: plain JavaScript version
// The pattern: keep the data in `todos`, change it with small functions,
// then call render() to redraw the page FROM the data.

// ---- State (the single source of truth) ----
let todos = [];

// ---- Elements we need (found once) ----
const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const list = document.querySelector("#todo-list");

function makeId() {
  return crypto.randomUUID?.() ?? String(Date.now() + Math.random());
}

// ---- Changing the data (articles #5, #6, #13: functions, map/filter, spread) ----
function addTodo(text) {
  todos = [...todos, { id: makeId(), text, done: false }];
  render();
}

function toggleTodo(id) {
  todos = todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo));
  render();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  render();
}

// ---- Drawing the page from the data (article #9: the DOM) ----
function createTodoElement(todo) {
  const li = document.createElement("li");
  li.className = "todo";
  li.dataset.id = todo.id;
  li.classList.toggle("done", todo.done);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "toggle";
  checkbox.checked = todo.done;

  const text = document.createElement("span");
  text.className = "text";
  text.textContent = todo.text; // textContent, never innerHTML: it's user input!

  const del = document.createElement("button");
  del.className = "delete";
  del.textContent = "✕";

  li.append(checkbox, text, del);
  return li;
}

function render() {
  list.replaceChildren(...todos.map(createTodoElement));
}

// ---- Listening (article #10: events, preventDefault, delegation) ----
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTodo(text);
  input.value = "";
});

list.addEventListener("click", (event) => {
  if (!event.target.matches(".delete")) return;
  deleteTodo(event.target.closest(".todo").dataset.id);
});

list.addEventListener("change", (event) => {
  if (!event.target.matches(".toggle")) return;
  toggleTodo(event.target.closest(".todo").dataset.id);
});

render();
