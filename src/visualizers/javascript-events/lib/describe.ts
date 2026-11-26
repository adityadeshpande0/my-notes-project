/** Small helpers for turning real events and elements into text for the logs. */

/** "<input#search>", "<li.item>" or "null". */
export function tagOf(t: EventTarget | null): string {
  if (!t) return 'null';
  if (!(t instanceof Element)) return t instanceof Document ? 'document' : 'window';
  const cls = t.classList.length ? `.${[...t.classList].join('.')}` : '';
  return `<${t.tagName.toLowerCase()}${t.id ? `#${t.id}` : ''}${cls}>`;
}

const q = (s: string) => JSON.stringify(s);

/**
 * Copy the interesting properties of an event AT THE MOMENT it fires.
 * (Some change afterwards: currentTarget is null once the event is over,
 * which is why we copy values instead of keeping the event object.)
 */
export function snapshot(e: Event): [string, string][] {
  const out: [string, string][] = [
    ['type', q(e.type)],
    ['target', tagOf(e.target)],
    ['currentTarget', tagOf(e.currentTarget)],
  ];
  if (e instanceof KeyboardEvent) out.push(['key', q(e.key)], ['code', q(e.code)]);
  const t = e.target as HTMLInputElement | null;
  if (t && 'value' in t && typeof t.value === 'string' && t.tagName !== 'BUTTON')
    out.push(['target.value', q(t.value)]);
  if (t && t.type === 'checkbox') out.push(['target.checked', String(t.checked)]);
  if (e instanceof MouseEvent)
    out.push(
      ['clientX', String(Math.round(e.clientX))],
      ['clientY', String(Math.round(e.clientY))],
    );
  out.push(
    ['eventPhase', String(e.eventPhase)],
    ['timeStamp', String(Math.round(e.timeStamp))],
    ['isTrusted', String(e.isTrusted)],
    ['defaultPrevented', String(e.defaultPrevented)],
  );
  return out;
}

/** The one-line detail for a log row. */
export function detailOf(e: Event): string {
  const t = e.target as HTMLInputElement | null;
  if (e instanceof KeyboardEvent) return `key: ${q(e.key)}`;
  if (t?.type === 'checkbox' && (e.type === 'change' || e.type === 'input'))
    return `checked: ${t.checked}`;
  if (e.type === 'input' || e.type === 'change') return `value: ${q(t?.value ?? '')}`;
  if (e instanceof MouseEvent && e.type === 'click')
    return e.detail === 0
      ? 'from the keyboard'
      : `clientX: ${Math.round(e.clientX)}, clientY: ${Math.round(e.clientY)}`;
  return '';
}
