import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const root = join(dirname(scriptPath), '..');

function sorted(values) {
	return [...values].sort((left, right) => left.localeCompare(right));
}

function pushMismatch(mismatches, label, actual, expected) {
	if (JSON.stringify(actual) !== JSON.stringify(expected)) {
		mismatches.push(
			`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
		);
	}
}

export function auditRepositoryState(policy, state) {
	const mismatches = [];
	const protection = state.protection;
	const security = state.repository.security_and_analysis ?? {};

	pushMismatch(mismatches, 'default branch', state.repository.default_branch, policy.defaultBranch);
	pushMismatch(
		mismatches,
		'merge commits',
		state.repository.allow_merge_commit,
		policy.mergeCommitAllowed
	);
	pushMismatch(
		mismatches,
		'squash merges',
		state.repository.allow_squash_merge,
		policy.squashMergeAllowed
	);
	pushMismatch(
		mismatches,
		'rebase merges',
		state.repository.allow_rebase_merge,
		policy.rebaseMergeAllowed
	);
	pushMismatch(
		mismatches,
		'delete branch on merge',
		state.repository.delete_branch_on_merge,
		policy.deleteBranchOnMerge
	);
	pushMismatch(
		mismatches,
		'allow pull request branches to update',
		state.repository.allow_update_branch,
		policy.allowUpdateBranch
	);
	pushMismatch(
		mismatches,
		'private vulnerability reporting',
		state.privateVulnerabilityReporting.enabled,
		policy.privateVulnerabilityReporting
	);
	pushMismatch(
		mismatches,
		'Dependabot security updates',
		security.dependabot_security_updates?.status,
		policy.dependabotSecurityUpdates ? 'enabled' : 'disabled'
	);
	pushMismatch(
		mismatches,
		'secret scanning',
		security.secret_scanning?.status,
		policy.secretScanning ? 'enabled' : 'disabled'
	);
	pushMismatch(
		mismatches,
		'secret scanning push protection',
		security.secret_scanning_push_protection?.status,
		policy.secretScanningPushProtection ? 'enabled' : 'disabled'
	);

	if (!protection) {
		mismatches.push(`${policy.defaultBranch} branch protection is missing`);
		return mismatches;
	}

	pushMismatch(
		mismatches,
		'required checks',
		sorted(protection.required_status_checks?.contexts ?? []),
		sorted(policy.requiredChecks)
	);
	pushMismatch(
		mismatches,
		'require branches up to date',
		protection.required_status_checks?.strict,
		policy.requireBranchesUpToDate
	);
	pushMismatch(
		mismatches,
		'require pull requests',
		Boolean(protection.required_pull_request_reviews),
		policy.requirePullRequests
	);
	pushMismatch(
		mismatches,
		'required approving reviews',
		protection.required_pull_request_reviews?.required_approving_review_count,
		policy.requiredApprovingReviewCount
	);
	pushMismatch(
		mismatches,
		'require conversation resolution',
		protection.required_conversation_resolution?.enabled,
		policy.requireConversationResolution
	);
	pushMismatch(
		mismatches,
		'enforce for administrators',
		protection.enforce_admins?.enabled,
		policy.enforceAdmins
	);
	pushMismatch(
		mismatches,
		'allow force pushes',
		protection.allow_force_pushes?.enabled,
		policy.allowForcePushes
	);
	pushMismatch(
		mismatches,
		'allow deletions',
		protection.allow_deletions?.enabled,
		policy.allowDeletions
	);

	return mismatches;
}

export function protectionPayload(policy) {
	return {
		required_status_checks: {
			strict: policy.requireBranchesUpToDate,
			contexts: policy.requiredChecks
		},
		enforce_admins: policy.enforceAdmins,
		required_pull_request_reviews: policy.requirePullRequests
			? {
					dismiss_stale_reviews: false,
					require_code_owner_reviews: false,
					required_approving_review_count: policy.requiredApprovingReviewCount,
					require_last_push_approval: false
				}
			: null,
		restrictions: null,
		required_conversation_resolution: policy.requireConversationResolution,
		required_linear_history: false,
		allow_force_pushes: policy.allowForcePushes,
		allow_deletions: policy.allowDeletions,
		block_creations: false,
		lock_branch: false,
		allow_fork_syncing: true
	};
}

function runGh(args, input) {
	const result = spawnSync('gh', args, {
		cwd: root,
		encoding: 'utf8',
		input
	});
	return {
		ok: result.status === 0,
		stdout: result.stdout.trim(),
		stderr: result.stderr.trim()
	};
}

function api(path, { body, method = 'GET', optional = false } = {}) {
	const args = ['api', path, '--method', method];
	if (body !== undefined) args.push('--input', '-');
	const result = runGh(args, body === undefined ? undefined : JSON.stringify(body));
	if (!result.ok) {
		if (optional) return null;
		throw new Error(result.stderr || `GitHub API request failed: ${method} ${path}`);
	}
	return result.stdout ? JSON.parse(result.stdout) : {};
}

function readPolicy() {
	return JSON.parse(readFileSync(join(root, 'repository-policy.json'), 'utf8'));
}

function readState(policy) {
	return {
		repository: api(`repos/${policy.repository}`),
		protection: api(`repos/${policy.repository}/branches/${policy.defaultBranch}/protection`, {
			optional: true
		}),
		privateVulnerabilityReporting: api(`repos/${policy.repository}/private-vulnerability-reporting`)
	};
}

function applyPolicy(policy) {
	api(`repos/${policy.repository}`, {
		method: 'PATCH',
		body: {
			delete_branch_on_merge: policy.deleteBranchOnMerge,
			allow_merge_commit: policy.mergeCommitAllowed,
			allow_squash_merge: policy.squashMergeAllowed,
			allow_rebase_merge: policy.rebaseMergeAllowed,
			allow_update_branch: policy.allowUpdateBranch
		}
	});
	api(`repos/${policy.repository}/branches/${policy.defaultBranch}/protection`, {
		method: 'PUT',
		body: protectionPayload(policy)
	});
	if (policy.privateVulnerabilityReporting) {
		api(`repos/${policy.repository}/private-vulnerability-reporting`, { method: 'PUT' });
	}
	if (policy.dependabotSecurityUpdates) {
		api(`repos/${policy.repository}/automated-security-fixes`, { method: 'PUT' });
	}
}

function run() {
	const command = process.argv[2];
	if (!['apply', 'audit'].includes(command)) {
		throw new Error('Usage: node scripts/github-repository.mjs <audit|apply>');
	}

	const policy = readPolicy();
	if (command === 'apply') applyPolicy(policy);

	const mismatches = auditRepositoryState(policy, readState(policy));
	if (mismatches.length > 0) {
		throw new Error(`Repository policy mismatches:\n- ${mismatches.join('\n- ')}`);
	}
	console.log(`Repository policy verified for ${policy.repository}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	run();
}
