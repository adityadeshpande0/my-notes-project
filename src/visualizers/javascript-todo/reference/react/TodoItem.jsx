export default function TodoItem({ todo, onToggle, onDelete }) {
  const { id, text, done } = todo;
  return (
    <li className={done ? "todo done" : "todo"}>
      <input
        type="checkbox"
        className="toggle"
        checked={done}
        onChange={() => onToggle(id)}
        aria-label={`Mark "${text}" as done`}
      />
      <span className="text">{text}</span>
      <button className="delete" onClick={() => onDelete(id)} aria-label={`Delete "${text}"`}>
        ✕
      </button>
    </li>
  );
}
