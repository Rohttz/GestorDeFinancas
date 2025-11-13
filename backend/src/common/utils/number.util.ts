export function coerceToDecimal(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  const raw = String(value).trim();
  if (!raw) {
    return undefined;
  }

  const normalized = raw
    .replace(/\s+/g, '')
    .replace(/\.(?=\d{3}(?:[^\d]|$))/g, '')
    .replace(/,/g, '.');

  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return undefined;
  }

  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}
