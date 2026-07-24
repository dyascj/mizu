import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const root = join(dirname(scriptPath), '..');

function integrity(content) {
	return `sha256-${createHash('sha256').update(content).digest('base64')}`;
}

async function fetchBytes(url, fetchImpl) {
	const response = await fetchImpl(url, {
		headers: { 'Cache-Control': 'no-cache' }
	});
	if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
	return Buffer.from(await response.arrayBuffer());
}

export async function verifyDeployedRegistry({ base, fetchImpl = fetch, localDir, manifest }) {
	const localManifest = readFileSync(join(localDir, 'manifest.json'));
	const remoteManifest = await fetchBytes(`${base}/manifest.json`, fetchImpl);
	if (!localManifest.equals(remoteManifest)) {
		throw new Error(`${base}/manifest.json does not match the release artifact.`);
	}

	for (let offset = 0; offset < manifest.files.length; offset += 10) {
		const batch = manifest.files.slice(offset, offset + 10);
		await Promise.all(
			batch.map(async (entry) => {
				const content = await fetchBytes(`${base}/${entry.path}`, fetchImpl);
				if (content.byteLength !== entry.bytes || integrity(content) !== entry.integrity) {
					throw new Error(`${base}/${entry.path} failed release integrity verification.`);
				}
			})
		);
	}
}

async function run() {
	const version = process.argv[2];
	if (!version) {
		throw new Error('Usage: node scripts/verify-deployed-registry.mjs <version>');
	}

	const localDir = join(root, 'static/r', `v${version}`);
	const manifest = JSON.parse(readFileSync(join(localDir, 'manifest.json'), 'utf8'));
	const base = manifest.registryBase;
	const attempts = Number(process.env.MIZU_DEPLOY_VERIFY_ATTEMPTS ?? 12);
	const interval = Number(process.env.MIZU_DEPLOY_VERIFY_INTERVAL_MS ?? 10_000);
	let lastError;

	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		try {
			await verifyDeployedRegistry({ base, localDir, manifest });
			console.log(
				`Deployed registry verified: ${manifest.files.length} files at ${base} (${version}).`
			);
			return;
		} catch (error) {
			lastError = error;
			if (attempt < attempts) {
				console.log(`Deployment verification attempt ${attempt}/${attempts} is not ready.`);
				await new Promise((resolveWait) => setTimeout(resolveWait, interval));
			}
		}
	}

	throw lastError;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	await run();
}
