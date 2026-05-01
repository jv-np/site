export const MAX_HISTORY_ENTRIES = 200;
export const MAX_ALIAS_EXPANSIONS = 16;

export function normalizeHistory(raw: unknown): string[] | undefined {
  return Array.isArray(raw)
    ? raw.map(String).slice(-MAX_HISTORY_ENTRIES)
    : undefined;
}

export function normalizeAliases(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  return Object.fromEntries(
    Object.entries(raw).map(([name, value]) => [name, String(value)]),
  );
}

export function resolveAlias(line: string, aliases: Record<string, string>): string {
  let current = line.trim();
  const seen = new Set<string>();

  for (let iteration = 0; iteration < MAX_ALIAS_EXPANSIONS; iteration++) {
    const space = current.search(/\s/);
    const head = space === -1 ? current : current.slice(0, space);
    const tail = space === -1 ? '' : current.slice(space);
    const expanded = aliases[head];

    if (!expanded || seen.has(head)) return current;
    seen.add(head);
    current = (expanded + tail).trim();
  }

  return current;
}