// One task. Props: todo ({ id, text, done }), onToggle(id), onDelete(id).
export default function TodoItem({ todo, onToggle, onDelete }) {
  // TODO (step 2): destructure { id, text, done } from todo
  // TODO (step 2): return <li className={done ? "todo done" : "todo"}> with
  //                <input type="checkbox" className="toggle" …>, <span className="text">, <button className="delete">✕</button>
  // TODO (step 4): onChange → onToggle(id), onClick → onDelete(id); aria-labels in step 7
  void [todo, onToggle, onDelete];
  return null;
}
