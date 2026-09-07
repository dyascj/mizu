<script lang="ts">
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let agreed = $state(false);
	let submitted = $state(false);
</script>

<form
	onsubmit={(event) => {
		event.preventDefault();
		submitted = true;
	}}
	class="bg-card mx-auto flex w-full max-w-sm flex-col gap-6 rounded-3xl p-5 shadow-md sm:p-8"
>
	<div>
		<h2 class="text-lg font-semibold tracking-tight">Create your account</h2>
		<p class="text-muted-foreground mt-1 text-sm">Set up your workspace.</p>
	</div>

	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<Label for="signup-name">Name</Label>
			<Input
				id="signup-name"
				autocomplete="name"
				required
				placeholder="Ada Rivers"
				bind:value={name}
			/>
		</div>
		<div class="flex flex-col gap-1.5">
			<Label for="signup-email">Email</Label>
			<Input
				id="signup-email"
				type="email"
				autocomplete="email"
				required
				placeholder="you@example.com"
				bind:value={email}
			/>
		</div>
		<div class="flex flex-col gap-1.5">
			<Label for="signup-password">Password</Label>
			<Input
				id="signup-password"
				type="password"
				autocomplete="new-password"
				required
				minlength={8}
				placeholder="8+ characters"
				bind:value={password}
			/>
		</div>
		<div class="flex items-center gap-2.5">
			<Checkbox id="signup-terms" bind:checked={agreed} />
			<Label for="signup-terms" class="text-muted-foreground text-xs font-normal">
				I agree to the terms and the privacy policy.
			</Label>
		</div>
	</div>

	<Button type="submit" variant="primary" class="w-full" disabled={!agreed}>
		<Sparkles class="size-4" />
		Create account
	</Button>
	<p role="status" class="text-muted-foreground text-xs">
		{submitted
			? 'Preview complete. No account was created.'
			: 'Preview only. Your details stay in this browser.'}
	</p>
</form>
