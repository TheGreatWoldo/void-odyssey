export function isNullOrEmpty(s: string | null | undefined): boolean {
  return s == null || s.length === 0;
}

export function isNullOrWhiteSpace(s: string | null | undefined): boolean {
  return s == null || s.trim().length === 0;
}
