// ☕ Chai To-Do: React version (YOUR version!). See README.md for the steps.
import TodoForm from './TodoForm.jsx';
import TodoItem from './TodoItem.jsx';
import FilterBar from './FilterBar.jsx';

// TODO (step 6): const STORAGE_KEY = "stackscape-todos";
// TODO (step 6): function loadTodos() { … JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [], in try/catch … }
// TODO (step 3): function makeId() { … }

export default function App() {
  // TODO (step 2): const [todos, setTodos] = useState([ …two sample tasks… ]);  (step 6: useState(loadTodos))
  // TODO (step 5): const [filter, setFilter] = useState("all");

  // TODO (step 6): useEffect that saves todos whenever they change (try/catch)

  // TODO (steps 3–7): addTodo, toggleTodo, deleteTodo, clearDone, each using setTodos(prev => …)

  // TODO (step 5): derived values, calculated here (not in state): `visible` and `left`

  // Step 1: replace this with the static JSX from the vanilla index.html (className, not class).
  // Keep the ids and classes: the shared tests look for them (see README.md).
  return (
    <main className="app">
      <h1>☕ Chai To-Do</h1>
      {/* TODO: <TodoForm onAdd={…} />, the <ul id="todo-list"> of <TodoItem key={…} …/>, #empty, and the footer */}
    </main>
  );
}

// These imports are here for you to use; this line stops "unused" warnings until you do.
void [TodoForm, TodoItem, FilterBar];
