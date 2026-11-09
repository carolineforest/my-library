import { describe, expect, it } from 'vitest';
import { summarizePeople } from './people';

describe('summarizePeople', () => {
  it('groups loans per person, current first', () => {
    const people = summarizePeople([
      { id: '1', bookId: 'a', person: 'Sam', personKey: 'sam', lentDate: '2024-01-01', returnedDate: '2024-02-01' },
      { id: '2', bookId: 'b', person: 'Kim', personKey: 'kim', lentDate: '2024-03-01' },
      { id: '3', bookId: 'c', person: 'sam', personKey: 'sam', lentDate: '2024-04-01', returnedDate: '2024-04-10' },
    ]);
    expect(people.map((p) => p.name)).toEqual(['Kim', 'sam']);
    expect(people[1].past).toHaveLength(2);
    expect(people[0].current).toHaveLength(1);
  });
});
