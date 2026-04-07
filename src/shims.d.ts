declare module '@jota-one/replacer' {
  export function replace(value: string, params: unknown, source?: unknown): string
  export function extractPlaceholders(value: string): string[]
}
