import { describe, expect, it } from 'vitest';
import { applyStatus, lastFinished } from './reading';

describe('applyStatus', () => {
  it('starts and finishes a read', () => {
    const a = applyStatus({ status: 'want', reads: [] }, 'reading', '2024-01-01');
    expect(a.reads).toHaveLength(1);
    expect(a.reads[0].started).toBe('2024-01-01');
    const b = applyStatus({ ...a }, 'read', '2024-01-20');
    expect(b.reads).toHaveLength(1);
    expect(b.reads[0].finished).toBe('2024-01-20');
    expect(lastFinished(b)).toBe('2024-01-20');
  });
  it('marking Read with no log adds a finished read', () => {
    expect(applyStatus({ status: 'none', reads: [] }, 'read', '2024-02-02').reads[0].finished).toBe('2024-02-02');
  });
  it('re-reading starts a second read', () => {
    const first = applyStatus({ status: 'none', reads: [] }, 'read', '2023-01-01');
    const again = applyStatus(first, 'reading', '2024-03-03');
    expect(again.reads).toHaveLength(2);
  });
});
