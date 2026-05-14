import { describe, expect, it } from 'vitest';

import { isNullOrWhiteSpace } from '@/shared/string-utils';

describe('isNullOrWhiteSpace', () => {

  it('returns true for null', () => {
    expect(isNullOrWhiteSpace(null)).toBe(true);
  });

  it('returns true for undefined', () => {
    expect(isNullOrWhiteSpace(undefined)).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(isNullOrWhiteSpace('')).toBe(true);
  });

  it('returns true for whitespace-only string', () => {
    expect(isNullOrWhiteSpace('   ')).toBe(true);
    expect(isNullOrWhiteSpace('\t')).toBe(true);
    expect(isNullOrWhiteSpace('\n')).toBe(true);
  });

  it('returns false for non-empty string', () => {
    expect(isNullOrWhiteSpace('a')).toBe(false);
  });

  it('returns false for string with leading/trailing whitespace around content', () => {
    expect(isNullOrWhiteSpace('  hello  ')).toBe(false);
  });

  it('returns false for single non-whitespace character', () => {
    expect(isNullOrWhiteSpace('x')).toBe(false);
  });

});
