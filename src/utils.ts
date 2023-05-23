export function dedupe<T = any>(arr: T[], primary: (item: T) => string | number | symbol): T[] {
  return Object.values(arr.reduce((p, c) => {
    p[primary(c)] = c
    return p
  }, {} as Record<string | number | symbol, T>))
}
