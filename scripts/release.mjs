import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const root = join(dirname(scriptPath), '..');
const requiredSections = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];

function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

export function releaseNotes(changelog, version) {
	const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const match = new RegExp(`^## \\[${escaped}\\][^\\n]*$`, 'm').exec(changelog);
	if (!match) throw new Error(`CHANGELOG.md has no release entry for ${version}.`);

	const remainder = changelog.slice(match.index + match[0].length);
	const nextRelease = remainder.search(/^## \[/m);
	const notes = remainder.slice(0, nextRelease < 0 ? undefined : nextRelease).trim();
	const missing = requiredSections.filter(
		(section) => !new RegExp(`^### ${section}\\s*$`, 'm').test(notes)
	);
	if (missing.length > 0) {
		throw new Error(`CHANGELOG.md release ${version} is missing sections: ${missing.join(', ')}.`);
	}
	return notes;
}

function assertCommitExists(commit) {
	const result = spawnSync('git', ['cat-file', '-e', `${commit}^{commit}`], {
		cwd: root,
		stdio: 'ignore'
	});
	if (result.status !== 0) {
		throw new Error(`Registry generation commit ${commit} is not present in the repository.`);
	}
}

export function verifyRelease(version) {
	if (!/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i.test(version)) {
		throw new Error(`Release version "${version}" is not a semantic version.`);
	}

	const packageJson = readJson(join(root, 'package.json'));
	const release = readJson(join(root, 'registry-release.json'));
	const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
	const versionDir = join(root, 'static/r', `v${version}`);
	const manifestPath = join(versionDir, 'manifest.json');

	if (packageJson.version !== version || release.version !== version) {
		throw new Error(
			`Release ${version} does not match package.json ${packageJson.version} and registry-release.json ${release.version}.`
		);
	}
	releaseNotes(changelog, version);
	if (!existsSync(manifestPath)) {
		throw new Error(`Immutable registry release static/r/v${version} is missing.`);
	}

	const manifest = readJson(manifestPath);
	if (
		manifest.version !== version ||
		manifest.channel !== 'versioned' ||
		manifest.generationCommit !== release.generationCommit
	) {
		throw new Error(`static/r/v${version}/manifest.json does not match release metadata.`);
	}
	assertCommitExists(release.generationCommit);

	return {
		manifest,
		tag: `v${version}`,
		version,
		versionDir
	};
}

function run() {
	const [command, version] = process.argv.slice(2);
	if (!command || !version) {
		throw new Error('Usage: node scripts/release.mjs <verify|notes> <version>');
	}

	const release = verifyRelease(version);
	if (command === 'verify') {
		console.log(
			`Release ${release.tag} is consistent with ${release.manifest.files.length} manifest entries.`
		);
		return;
	}
	if (command === 'notes') {
		process.stdout.write(
			releaseNotes(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'), version) + '\n'
		);
		return;
	}
	throw new Error(`Unknown release command "${command}".`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	run();
}
