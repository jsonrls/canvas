/** A query value if it is one of the choices, otherwise the first choice. */
export function readChoice<T extends string>(
  value: string | null,
  choices: readonly [T, ...T[]],
): T {
  return choices.find((choice) => choice === value) ?? choices[0];
}

/** A query string with some values set, or removed when null. */
export function withQuery(
  search: string,
  values: Record<string, string | null>,
): string {
  const params = new URLSearchParams(search);
  for (const [key, value] of Object.entries(values)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  return params.size > 0 ? `?${params}` : "";
}

/** Changes the address without a navigation, so a refresh comes back here. */
export function replaceQuery(values: Record<string, string | null>): void {
  const { pathname, search } = window.location;
  const next = withQuery(search, values);
  if (next !== search) window.history.replaceState(null, "", pathname + next);
}
