export function formatShortDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.slice(0, 10).split('-');
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  return `${d}/${m}/${y.slice(2)}`;
}

export function formatMoney(val: number | undefined | null): string {
  if (val === undefined || val === null || Number.isNaN(val)) return '0';
  const num = Number(val);
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(2);
}

export function formatMoneyBlankZero(val: number | undefined | null): string {
  if (!val || Number(val) === 0) return '';
  return formatMoney(val);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
