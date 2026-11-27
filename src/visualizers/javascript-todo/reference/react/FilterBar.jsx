const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "done", label: "Done" },
];

export default function FilterBar({ filter, onChange }) {
  return (
    <div className="filters">
      {FILTERS.map(({ value, label }) => (
        <button key={value} data-filter={value} aria-pressed={filter === value} onClick={() => onChange(value)}>
          {label}
        </button>
      ))}
    </div>
  );
}
