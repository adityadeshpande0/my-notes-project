/** Data helpers for CodeMorph (kept out of the component file). */
export interface MorphVersion {
  ids: string[];
  title?: string;
  caption: string;
}

/** The code text of one version. */
export const morphText = (tokens: Record<string, string>, ids: string[]) =>
  ids.map((id) => tokens[id]).join('');

/**
 * Build CodeMorph tokens for two (or more) versions of some code. Each
 * version is split into words, symbols, spaces and line breaks; a token in
 * the newer version that has the same text as an unused token in the older
 * one keeps its id, so it SLIDES to its new place instead of disappearing.
 */
export function morphBetween(
  codes: string[],
  captions: string[],
  titles: string[] = [],
): { tokens: Record<string, string>; versions: MorphVersion[] } {
  const tokens: Record<string, string> = {};
  const versions: MorphVersion[] = [];
  let prevIds: string[] = [];
  let next = 0;
  codes.forEach((code, v) => {
    const parts = code.match(/\n|[ \t]+|[A-Za-z_$][\w$]*|\d[\d_.]*|[^\s\w]/g) ?? [];
    const free = new Set(prevIds);
    const ids = parts.map((text) => {
      const reuse = text.trim() && [...free].find((id) => tokens[id] === text);
      if (reuse) {
        free.delete(reuse);
        return reuse;
      }
      const id = `t${next++}`;
      tokens[id] = text;
      return id;
    });
    versions.push({ ids, caption: captions[v] ?? '', title: titles[v] });
    prevIds = ids;
  });
  return { tokens, versions };
}
