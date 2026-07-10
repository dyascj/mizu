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
</script>

<div class="mx-auto flex w-full max-w-sm flex-col gap-6 rounded-3xl bg-card p-8 shadow-md">
	<div>
		<h2 class="text-lg font-semibold tracking-tight">Create your account</h2>
		<p class="mt-1 text-sm text-muted-foreground">A companion of your own, in about a minute.</p>
	</div>

	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<Label for="signup-name">Name</Label>
			<Input id="signup-name" placeholder="Ada Rivers" bind:value={name} />
		</div>
		<div class="flex flex-col gap-1.5">
			<Label for="signup-email">Email</Label>
			<Input id="signup-email" type="email" placeholder="you@water.com" bind:value={email} />
		</div>
		<div class="flex flex-col gap-1.5">
			<Label for="signup-password">Password</Label>
			<Input
				id="signup-password"
				type="password"
				placeholder="8+ characters"
				bind:value={password}
			/>
		</div>
		<div class="flex items-center gap-2.5">
			<Checkbox id="signup-terms" bind:checked={agreed} />
			<Label for="signup-terms" class="text-xs font-normal text-muted-foreground">
				I agree to the terms and the privacy policy.
			</Label>
		</div>
	</div>

	<Button variant="ai" class="w-full" disabled={!agreed}>
		<Sparkles class="size-4" />
		Create my companion
	</Button>
</div>
