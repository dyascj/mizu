import assert from 'node:assert/strict';
import test from 'node:test';

import { auditRepositoryState, protectionPayload } from './github-repository.mjs';

const policy = {
	defaultBranch: 'main',
	requiredChecks: ['verify', 'browser', 'analyze'],
	requireBranchesUpToDate: true,
	requirePullRequests: true,
	requiredApprovingReviewCount: 0,
	requireConversationResolution: true,
	enforceAdmins: false,
	allowForcePushes: false,
	allowDeletions: false,
	mergeCommitAllowed: true,
	squashMergeAllowed: false,
	rebaseMergeAllowed: false,
	deleteBranchOnMerge: true,
	allowUpdateBranch: true,
	privateVulnerabilityReporting: true,
	vulnerabilityAlerts: true,
	dependabotSecurityUpdates: true,
	secretScanning: true,
	secretScanningPushProtection: true
};

const state = {
	repository: {
		default_branch: 'main',
		allow_merge_commit: true,
		allow_squash_merge: false,
		allow_rebase_merge: false,
		delete_branch_on_merge: true,
		allow_update_branch: true,
		security_and_analysis: {
			dependabot_security_updates: { status: 'enabled' },
			secret_scanning: { status: 'enabled' },
			secret_scanning_push_protection: { status: 'enabled' }
		}
	},
	protection: {
		required_status_checks: { strict: true, contexts: ['analyze', 'browser', 'verify'] },
		enforce_admins: { enabled: false },
		required_pull_request_reviews: { required_approving_review_count: 0 },
		required_conversation_resolution: { enabled: true },
		allow_force_pushes: { enabled: false },
		allow_deletions: { enabled: false }
	},
	privateVulnerabilityReporting: { enabled: true },
	vulnerabilityAlerts: true
};

test('repository policy accepts the intended remote state', () => {
	assert.deepEqual(auditRepositoryState(policy, state), []);
});

test('repository policy reports missing protection and unsafe settings', () => {
	const unsafe = structuredClone(state);
	unsafe.repository.allow_squash_merge = true;
	unsafe.protection = null;
	assert.deepEqual(auditRepositoryState(policy, unsafe), [
		'squash merges: expected false, received true',
		'main branch protection is missing'
	]);
});

test('branch protection payload preserves the single-maintainer bypass policy', () => {
	assert.deepEqual(protectionPayload(policy), {
		required_status_checks: {
			strict: true,
			contexts: ['verify', 'browser', 'analyze']
		},
		enforce_admins: false,
		required_pull_request_reviews: {
			dismiss_stale_reviews: false,
			require_code_owner_reviews: false,
			required_approving_review_count: 0,
			require_last_push_approval: false
		},
		restrictions: null,
		required_conversation_resolution: true,
		required_linear_history: false,
		allow_force_pushes: false,
		allow_deletions: false,
		block_creations: false,
		lock_branch: false,
		allow_fork_syncing: true
	});
});
