// The All / Active / Done buttons. Props: filter (the current one), onChange(value).
// TODO (step 5): a FILTERS array of { value, label }, and .map it to
//                <button key={…} data-filter={value} aria-pressed={filter === value} onClick={…}>
export default function FilterBar({ filter, onChange }) {
  void [filter, onChange];
  return null;
}
