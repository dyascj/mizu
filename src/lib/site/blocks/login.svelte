<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { VoiceOrb } from '$lib/components/ui/voice-orb';

	let email = $state('');
	let password = $state('');
</script>

<div
	class="mx-auto flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl bg-card p-8 shadow-md"
>
	<div class="flex flex-col items-center gap-3 text-center">
		<VoiceOrb state="idle" size={44} />
		<div>
			<h2 class="text-lg font-semibold tracking-tight">Welcome back</h2>
			<p class="mt-1 text-sm text-muted-foreground">She remembers where you left off.</p>
		</div>
	</div>

	<div class="flex w-full flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<Label for="login-email">Email</Label>
			<Input id="login-email" type="email" placeholder="you@water.com" bind:value={email} />
		</div>
		<div class="flex flex-col gap-1.5">
			<div class="flex items-center justify-between">
				<Label for="login-password">Password</Label>
				<a href="##" class="text-xs text-muted-foreground transition-colors hover:text-primary">
					Forgot it?
				</a>
			</div>
			<Input id="login-password" type="password" placeholder="••••••••" bind:value={password} />
		</div>
	</div>

	<div class="flex w-full flex-col gap-2">
		<Button class="w-full">Sign in</Button>
		<Button variant="outline" class="w-full">
			<svg viewBox="0 0 24 24" fill="currentColor" class="size-4" aria-hidden="true"
				><path
					d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.5 18 4.8 18 4.8c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"
				/></svg
			>
			Continue with GitHub
		</Button>
	</div>

	<p class="text-xs text-muted-foreground">
		New here? <a href="##" class="font-medium text-primary hover:underline">Create an account</a>
	</p>
</div>
