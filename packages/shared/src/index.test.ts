import { describe, it, expect } from 'vitest';
import { normalizeSessionId } from './index.js';

describe('normalizeSessionId', () => {
  it('trims whitespace and converts to uppercase', () => {
    expect(normalizeSessionId('  sec301-r1  ')).toBe('SEC301-R1');
  });

  it('keeps already uppercase normalized strings unchanged', () => {
    expect(normalizeSessionId('KEY001')).toBe('KEY001');
  });
});
