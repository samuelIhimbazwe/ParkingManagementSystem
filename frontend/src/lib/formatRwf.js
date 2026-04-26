/** Rwandan francs — whole units for display (hourly rates and totals). */
export function formatRwf(amount) {
  const n = Number(amount)
  if (Number.isNaN(n)) return 'RWF —'
  return `RWF ${Math.round(n).toLocaleString()}`
}

export function formatRwfPerHour(amount) {
  return `${formatRwf(amount)}/hr`
}
