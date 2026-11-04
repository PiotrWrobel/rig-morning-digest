import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const line = (job: string, status: string, owner: string | null, at: string) =>
  JSON.stringify({ at, job, status, owner });

let dir: string;
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
  writeFileSync(
    join(dir, '2026-01-01.jsonl'),
    [
      line('b/job', 'ok', 'rook', '2026-01-01T01:00:00+01:00'),
      line('a/job', 'ok', null, '2026-01-01T02:00:00+01:00'),
    ].join('\n') + '\n',
  );
  writeFileSync(join(dir, '2026-01-02.jsonl'), '');
  writeFileSync(
    join(dir, '2026-01-03.jsonl'),
    [line('a/job', 'ok', 'rook', '2026-01-03T01:00:00+01:00'), '{not json'].join('\n') + '\n',
  );
  app = createApp({ adapter: 'shim', installed: '2026-01-01T00:00:00+01:00', beatEverySeconds: 60, runsDir: dir });
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const rowsOf = (body: unknown) => (Array.isArray(body) ? body : (body as { rows: { job: string }[] }).rows);

describe.each([
  ['page', '/digest/'],
  ['json', '/api/digest/'],
])('%s route', (kind, prefix) => {
  const get = (night: string) => app.request(prefix + night);

  it('200 with the night jobs', async () => {
    const res = await get('2026-01-01');
    expect(res.status).toBe(200);
    if (kind === 'page') {
      const html = await res.text();
      expect(html).toContain('a/job');
      expect(html).toContain('b/job');
      expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
    } else {
      expect(rowsOf(await res.json()).map((r) => r.job)).toEqual(['a/job', 'b/job']);
    }
  });

  it('404 for a night with no file', async () => {
    expect((await get('2026-01-09')).status).toBe(404);
  });

  it('renders an empty night', async () => {
    const res = await get('2026-01-02');
    expect(res.status).toBe(200);
    if (kind === 'page') expect(await res.text()).toContain('nothing ran');
    else expect(rowsOf(await res.json())).toEqual([]);
  });

  it('still answers for a night with a bad line', async () => {
    const res = await get('2026-01-03');
    expect(res.status).toBe(200);
    if (kind === 'page') expect(await res.text()).toContain('a/job');
    else expect(rowsOf(await res.json()).map((r) => r.job)).toEqual(['a/job']);
  });
});
