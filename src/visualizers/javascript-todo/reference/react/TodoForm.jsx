import { useState } from "react";

export default function TodoForm({ onAdd }) {
  const [text, setText] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
  }

  return (
    <form id="todo-form" onSubmit={handleSubmit}>
      <input
        id="todo-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs doing?"
        autoComplete="off"
        aria-label="New task"
      />
      <button type="submit">Add</button>
    </form>
  );
}
