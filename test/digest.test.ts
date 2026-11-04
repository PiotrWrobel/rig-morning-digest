import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('readNight', () => {
  const digest = readNight('runs', '2026-10-28');
  const byJob = Object.fromEntries(digest.rows.map((r) => [r.job, r]));

  it('finds 5 jobs and 1 bad line', () => {
    expect(digest.rows).toHaveLength(5);
    expect(digest.badLines).toBe(1);
  });

  it('counts runs, retries and keeps the final status and error', () => {
    expect(byJob['fixtures/refresh']).toMatchObject({
      runs: 4,
      retries: 3,
      lastStatus: 'ok',
      lastError: null,
      firstAt: '2026-10-29T01:30:00+01:00',
      lastAt: '2026-10-29T01:37:00+01:00',
    });
    expect(byJob['notes/backup']).toMatchObject({ lastStatus: 'fail', lastError: 'quota exceeded' });
  });

  it('keeps jobs with a null owner', () => {
    expect(byJob['digest/render']?.owner).toBeNull();
  });
});
