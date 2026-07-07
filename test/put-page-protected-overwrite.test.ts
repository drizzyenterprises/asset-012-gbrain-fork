/**
 * put_page protected-overwrite and identity stamping guards.
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execFileSync } from 'node:child_process';
import { PGLiteEngine } from '../src/core/pglite-engine.ts';
import { resetPgliteState } from './helpers/reset-pglite.ts';
import { OperationError, operations } from '../src/core/operations.ts';
import type { OperationContext } from '../src/core/operations.ts';
import { resetGateway } from '../src/core/ai/gateway.ts';

let engine: PGLiteEngine;
let tmpRoot: string;
let brainDir: string;

const identity = { name: 'Forge Test Agent', email: 'forge-test@example.com' };
const putPage = operations.find((o) => o.name === 'put_page')!;

beforeAll(async () => {
  engine = new PGLiteEngine();
  await engine.connect({});
  await engine.initSchema();
});

afterAll(async () => {
  await engine.disconnect();
  resetGateway();
});

beforeEach(async () => {
  await resetPgliteState(engine);
  resetGateway();
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gbrain-protected-'));
  brainDir = path.join(tmpRoot, 'brain');
  fs.mkdirSync(brainDir, { recursive: true });
  execFileSync('git', ['-C', brainDir, 'init'], { stdio: ['ignore', 'ignore', 'ignore'] });
  execFileSync('git', ['-C', brainDir, 'config', 'user.name', 'Repo User'], { stdio: ['ignore', 'ignore', 'ignore'] });
  execFileSync('git', ['-C', brainDir, 'config', 'user.email', 'repo-user@example.com'], { stdio: ['ignore', 'ignore', 'ignore'] });
  await engine.setConfig('sync.repo_path', brainDir);
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

const captureLogger = () => {
  const messages: Array<{ level: string; msg: string }> = [];
  return {
    logger: {
      info: (msg: string) => messages.push({ level: 'info', msg }),
      warn: (msg: string) => messages.push({ level: 'warn', msg }),
      error: (msg: string) => messages.push({ level: 'error', msg }),
    },
    messages,
  };
};

function makeCtx(overrides: Partial<OperationContext> = {}): OperationContext {
  const { logger } = captureLogger();
  return {
    engine,
    config: { engine: 'pglite' as const },
    logger,
    dryRun: false,
    remote: false,
    agentIdentity: identity,
    sourceId: 'default',
    ...overrides,
  };
}

async function put(slug: string, body: string, params: Record<string, unknown> = {}, ctx = makeCtx()) {
  return putPage.handler(ctx, {
    slug,
    content: `---\ntitle: ${slug}\n---\n\n${body}`,
    ...params,
  });
}

describe('put_page protected overwrite guard', () => {
  test('blocks protected decisions/ overwrite without override', async () => {
    await put('decisions/test-decision', 'original');

    let err: unknown;
    try {
      await put('decisions/test-decision', 'changed');
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(OperationError);
    expect((err as OperationError).code).toBe('permission_denied');
    const page = await engine.getPage('decisions/test-decision', { sourceId: 'default' });
    expect(page?.compiled_truth).toContain('original');
    expect(page?.compiled_truth).not.toContain('changed');
  });

  test('allows protected decisions/ overwrite with override and reason', async () => {
    await put('decisions/test-decision', 'original');

    await put('decisions/test-decision', 'changed', { override: true, reason: 'testing override' });

    const page = await engine.getPage('decisions/test-decision', { sourceId: 'default' });
    expect(page?.compiled_truth).toContain('changed');
  });

  test('blocks overwrite of a page linked from decisions/', async () => {
    await put('decisions/test-tombstone', 'tombstone');
    await put('wiki/linked-page', 'original');
    await engine.addLink('decisions/test-tombstone', 'wiki/linked-page', 'closed by decision', 'mentions', 'manual');

    let err: unknown;
    try {
      await put('wiki/linked-page', 'changed');
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(OperationError);
    expect((err as OperationError).code).toBe('permission_denied');
    const page = await engine.getPage('wiki/linked-page', { sourceId: 'default' });
    expect(page?.compiled_truth).toContain('original');
    expect(page?.compiled_truth).not.toContain('changed');
  });

  test('unprotected page overwrite is unaffected', async () => {
    await put('inbox/test-normal', 'original');

    await put('inbox/test-normal', 'changed');

    const page = await engine.getPage('inbox/test-normal', { sourceId: 'default' });
    expect(page?.compiled_truth).toContain('changed');
  });
});

describe('put_page identity stamping', () => {
  test('writes identity to frontmatter', async () => {
    const result = (await put('inbox/identity-frontmatter', 'body')) as { write_through?: { path?: string } };

    const onDisk = fs.readFileSync(result.write_through!.path!, 'utf8');
    expect(onDisk).toMatch(/written_by:\s*['"]?Forge Test Agent <forge-test@example\.com>['"]?/);
  });

  test('uses identity as git commit author', async () => {
    await put('inbox/identity-commit', 'body');

    const author = execFileSync('git', ['-C', brainDir, 'log', '-1', '--format=%an <%ae>'], {
      encoding: 'utf-8',
    }).trim();
    expect(author).toBe('Forge Test Agent <forge-test@example.com>');
    expect(author).not.toBe('gbrain <gbrain@localhost>');
  });

  test('refuses writes without identity', async () => {
    const ctx = makeCtx({ agentIdentity: undefined });

    let err: unknown;
    try {
      await put('inbox/no-identity', 'body', {}, ctx);
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(OperationError);
    expect((err as OperationError).code).toBe('permission_denied');
    expect(await engine.getPage('inbox/no-identity', { sourceId: 'default' })).toBeNull();
  });
});
