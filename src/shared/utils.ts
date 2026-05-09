import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/** Generates a stable unique identifier. Use this instead of calling crypto.randomUUID() directly in domain code. */
export function generateId(): string {
  return crypto.randomUUID();
}