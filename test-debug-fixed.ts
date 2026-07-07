import { PGLiteEngine } from './src/core/pglite-engine.ts';
import { resetPgliteState } from './test/helpers/reset-pglite.ts';
import { resetGateway } from './src/core/ai/gateway.ts';
import { operations } from './src/core/operations.ts';
import type { OperationContext } from './src/core/operations.ts';

const engine = new PGLiteEngine();
await engine.connect({});
await engine.initSchema();
await resetPgliteState(engine);
resetGateway();
await engine.setConfig('sync.repo_path', '/tmp/test-brain');
import * as fs from 'fs';
fs.mkdirSync('/tmp/test-brain', { recursive: true });

const slug = 'inbox/verify-putpage-desync';
const content = '---\ntitle: Desync\n---\n\n# Body';

const slugCallCount = new Map<string, number>();
const originalGetPage = engine.getPage.bind(engine);
const interceptingGetPage = async (s: string, opts?: { sourceId?: string }) => {
  const count = (slugCallCount.get(s) ?? 0) + 1;
  slugCallCount.set(s, count);
  console.error(`getPage called for '${s}', count=${count}`);
  if (s === slug && count === 2) {
    console.error('  -> returning null (simulate index miss)');
    return null;
  }
  const result = await originalGetPage(s, opts);
  console.error(`  -> returning ${result ? 'page' : 'null'}`);
  return result;
};
engine.getPage = interceptingGetPage as typeof engine.getPage;

const putPage = operations.find((o) => o.name === 'put_page')!;
const ctx = {
  engine,
  config: { engine: 'pglite' as const },
  logger: { info: (m: string) => console.error(`INFO: ${m}`), warn: (m: string) => console.error(`WARN: ${m}`), error: (m: string) => console.error(`ERROR: ${m}`) },
  dryRun: false,
  remote: false,
  sourceId: 'default',
  agentIdentity: { name: 'Test Agent', email: 'test-agent@example.com' },
} as OperationContext;

try {
  const result = await putPage.handler(ctx, { slug, content });
  console.error(`Handler returned: ${JSON.stringify(result).slice(0, 200)}`);
} catch (e) {
  console.error(`Handler threw: ${e instanceof Error ? e.message : String(e)}`);
}

await engine.disconnect();
fs.rmSync('/tmp/test-brain', { recursive: true, force: true });
