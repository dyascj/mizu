<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { PasswordInput } from '$lib/components/ui/password-input';

	const requirements = [
		{ label: '8 or more characters', test: (password: string) => password.length >= 8 },
		{ label: 'A number', test: (password: string) => /\d/.test(password) },
		{ label: 'A symbol', test: (password: string) => /[^A-Za-z0-9\s]/.test(password) }
	];
</script>

<div class="flex w-full max-w-sm flex-col gap-2">
	<Label for="workspace-password">Workspace password</Label>
	<PasswordInput
		id="workspace-password"
		name="password"
		placeholder="Choose a password"
		strength
		{requirements}
	/>
</div>
