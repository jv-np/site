import { describe, expect, test } from 'bun:test';
import {
  MAX_HISTORY_ENTRIES,
  normalizeAliases,
  normalizeHistory,
  resolveAlias,
} from '../src/terminal';

describe('resolveAlias', () => {
  test('expands the first token and preserves arguments', () => {
    expect(resolveAlias('g --featured', { g: 'showcase' })).toBe('showcase --featured');
  });

  test('follows alias chains without losing the tail', () => {
    expect(resolveAlias('g latest', { g: 'p', p: 'projects' })).toBe('projects latest');
  });

  test('stops on cycles', () => {
    expect(resolveAlias('a now', { a: 'b', b: 'a' })).toBe('a now');
  });
});

describe('persistent state normalization', () => {
  test('keeps history bounded and string-backed', () => {
    const rawHistory = Array.from({ length: MAX_HISTORY_ENTRIES + 5 }, (_, index) => index);
    const normalized = normalizeHistory(rawHistory);

    expect(normalized).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(normalized?.[0]).toBe('5');
    expect(normalized?.at(-1)).toBe(String(MAX_HISTORY_ENTRIES + 4));
  });

  test('rejects invalid history payloads', () => {
    expect(normalizeHistory({ latest: 'showcase' })).toBeUndefined();
  });

  test('normalizes alias values without dropping stored keys', () => {
    expect(normalizeAliases({ g: 'showcase', old: 42 })).toEqual({ g: 'showcase', old: '42' });
  });

  test('rejects invalid alias payloads', () => {
    expect(normalizeAliases(['showcase'])).toBeUndefined();
  });
});