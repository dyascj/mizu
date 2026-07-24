import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createHash } from 'node:crypto';

import { verifyDeployedRegistry } from './verify-deployed-registry.mjs';

function integrity(content) {
	return `sha256-${createHash('sha256').update(content).digest('base64')}`;
}

function fixture(context) {
	const localDir = mkdtempSync(join(tmpdir(), 'mizu-deploy-verify-'));
	context.after(() => rmSync(localDir, { recursive: true, force: true }));
	const item = Buffer.from('{"name":"button"}\n');
	const manifest = {
		registryBase: 'https://example.test/r/v1.0.0',
		files: [{ path: 'button.json', bytes: item.byteLength, integrity: integrity(item) }]
	};
	const manifestBytes = Buffer.from(`${JSON.stringify(manifest)}\n`);
	mkdirSync(localDir, { recursive: true });
	writeFileSync(join(localDir, 'button.json'), item);
	writeFileSync(join(localDir, 'manifest.json'), manifestBytes);
	return { item, localDir, manifest, manifestBytes };
}

function response(content, status = 200) {
	return new Response(content, { status });
}

test('verifies the deployed manifest and every declared item', async (context) => {
	const data = fixture(context);
	const fetchImpl = async (url) =>
		url.endsWith('/manifest.json') ? response(data.manifestBytes) : response(data.item);

	await assert.doesNotReject(() =>
		verifyDeployedRegistry({
			base: data.manifest.registryBase,
			fetchImpl,
			localDir: data.localDir,
			manifest: data.manifest
		})
	);
});

test('rejects a deployed item with different bytes', async (context) => {
	const data = fixture(context);
	const fetchImpl = async (url) =>
		url.endsWith('/manifest.json') ? response(data.manifestBytes) : response('changed');

	await assert.rejects(
		() =>
			verifyDeployedRegistry({
				base: data.manifest.registryBase,
				fetchImpl,
				localDir: data.localDir,
				manifest: data.manifest
			}),
		/failed release integrity verification/
	);
});
