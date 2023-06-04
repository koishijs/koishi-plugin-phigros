export function dedupe<T = any>(arr: T[], primary?: (item: T) => any): T[] {
  if (!primary) return Array.from(new Set(arr))
  const map = new Map(arr.map(i => [primary(i), i]))
  return Array.from(map.values())
}
