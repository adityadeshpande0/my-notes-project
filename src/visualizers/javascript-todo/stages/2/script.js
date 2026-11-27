// ☕ Chai To-Do: plain JavaScript version
// The pattern: keep the data in `todos`, change it with small functions,
// then call render() to redraw the page FROM the data.

// ---- State (the single source of truth) ----
let todos = [
  { id: "a1", text: "Buy milk", done: true },
  { id: "b2", text: "Make chai", done: false },
];

// ---- Elements we need (found once) ----
const list = document.querySelector("#todo-list");

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

render();
