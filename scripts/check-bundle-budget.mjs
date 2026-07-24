import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const defaultBudget = {
	largestFileBytes: 100_000,
	totalBytes: 2_100_000
};

function javascriptFiles(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) return javascriptFiles(path);
		return entry.isFile() && entry.name.endsWith('.js') ? [path] : [];
	});
}

export function measureBundle(clientDir) {
	if (!existsSync(clientDir)) {
		throw new Error(`Client build output is missing at ${clientDir}. Run "pnpm build" first.`);
	}

	const files = javascriptFiles(clientDir).map((path) => ({
		path: relative(clientDir, path),
		bytes: statSync(path).size
	}));

	if (files.length === 0) {
		throw new Error(`No JavaScript files were found in ${clientDir}.`);
	}

	files.sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));

	return {
		files,
		largest: files[0],
		totalBytes: files.reduce((total, file) => total + file.bytes, 0)
	};
}

export function assertBundleBudget(measurement, budget = defaultBudget) {
	const failures = [];

	if (measurement.largest.bytes > budget.largestFileBytes) {
		failures.push(
			`largest client chunk is ${measurement.largest.bytes.toLocaleString()} bytes ` +
				`(${measurement.largest.path}); budget is ${budget.largestFileBytes.toLocaleString()} bytes`
		);
	}

	if (measurement.totalBytes > budget.totalBytes) {
		failures.push(
			`total client JavaScript is ${measurement.totalBytes.toLocaleString()} bytes; ` +
				`budget is ${budget.totalBytes.toLocaleString()} bytes`
		);
	}

	if (failures.length > 0) {
		throw new Error(`Client bundle budget exceeded:\n- ${failures.join('\n- ')}`);
	}
}

function run() {
	const root = join(dirname(fileURLToPath(import.meta.url)), '..');
	const clientDir = join(root, '.svelte-kit/output/client/_app/immutable');
	const measurement = measureBundle(clientDir);

	assertBundleBudget(measurement);
	console.log(
		`Bundle budget passed: largest ${measurement.largest.bytes.toLocaleString()} bytes ` +
			`(${measurement.largest.path}), total ${measurement.totalBytes.toLocaleString()} bytes.`
	);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	run();
}
