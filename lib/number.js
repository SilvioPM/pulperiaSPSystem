export function parseNumber(v) {
  if (v === null || v === undefined) return 0
  const s = String(v).replace(',', '.')
  return parseFloat(s) || 0
}
