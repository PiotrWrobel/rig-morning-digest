import { sortRows } from '../digest/read.js';
import type { Digest } from '../digest/types.js';

const dash = '—';

export function DigestPage({ digest }: { digest: Digest }) {
  const rows = sortRows(digest.rows);
  return (
    <>
      <h1>digest · {digest.night}</h1>
      {rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last</th>
              <th>error</th>
              <th>first</th>
              <th>last at</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr>
                <td>{r.job}</td>
                <td>{r.owner ?? dash}</td>
                <td>{r.runs}</td>
                <td class={r.retries >= 3 ? 'warn' : undefined}>
                  {r.retries}
                  {r.retries >= 3 ? ' ⚠' : ''}
                </td>
                <td class={r.lastStatus === 'fail' ? 'warn' : undefined}>
                  {r.lastStatus}
                  {r.lastStatus === 'fail' ? ' ⚠' : ''}
                </td>
                <td>{r.lastError ?? dash}</td>
                <td>{r.firstAt}</td>
                <td>{r.lastAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {digest.badLines > 0 ? <p class="mute">{digest.badLines} unreadable line(s) skipped</p> : null}
    </>
  );
}
