export function formatDateToDisplay(value?: string | null): string {
  if (!value) return '';
  // Accept ISO YYYY-MM-DD or DD-MM-YYYY
  const parts = value.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // ISO -> YYYY-MM-DD
      const [y, m, d] = parts;
      return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
    } else {
      // Already DD-MM-YYYY
      const [d, m, y] = parts;
      return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
    }
  }
  // fallback try Date parse
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

export function formatCurrencyBR(value?: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9\-.,]/g, '').replace(',', '.')) : Number(value);
  if (isNaN(num)) return 'R$ 0,00';
  // Use Intl.NumberFormat for reliable grouping and decimals
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}

/**
 * Format a numeric-only digits string into a BRL currency string.
 * Example: '123456' -> 'R$ 1.234,56'
 */
export function formatCurrencyFromDigits(digits?: string): string {
  if (!digits) return '';
  const onlyDigits = String(digits).replace(/\D/g, '');
  if (!onlyDigits) return '';
  const cents = parseInt(onlyDigits, 10);
  const num = cents / 100;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}

/**
 * Parse a formatted currency string (e.g. 'R$ 1.234,56' or '1.234,56') into a number (1234.56).
 */
export function parseCurrencyToNumber(value?: string | number): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9,.-]/g, '').replace(/\.(?=\d{3,})/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}
