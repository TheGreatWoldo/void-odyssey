import { describe, expect, it } from 'vitest';

import { err, ok, type Result } from '@/shared/result';

describe('ok', () => {

  it('sets ok to true', () => {
    const result = ok(42);

    expect(result.ok).toBe(true);
  });

  it('carries the supplied value', () => {
    const result = ok('hello');

    expect(result.ok && result.value).toBe('hello');
  });

  it('works with undefined value', () => {
    const result = ok(undefined);

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toBeUndefined();
  });

  it('works with object value', () => {
    const payload = { x: 1 };
    const result = ok(payload);

    expect(result.ok && result.value).toBe(payload);
  });

});

describe('err', () => {

  it('sets ok to false', () => {
    const result = err('something went wrong');

    expect(result.ok).toBe(false);
  });

  it('carries the supplied error', () => {
    const result = err('bad input');

    expect(!result.ok && result.error).toBe('bad input');
  });

  it('works with a non-string error', () => {
    const result = err(404);

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toBe(404);
  });

});

describe('Result type narrowing', () => {

  it('ok branch is accessible after truthy ok check', () => {
    const result: Result<number, string> = ok(7);

    if (result.ok) {
      expect(result.value).toBe(7);
    } else {
      throw new Error('should not reach err branch');
    }
  });

  it('err branch is accessible after falsy ok check', () => {
    const result: Result<number, string> = err('oops');

    if (!result.ok) {
      expect(result.error).toBe('oops');
    } else {
      throw new Error('should not reach ok branch');
    }
  });

});
