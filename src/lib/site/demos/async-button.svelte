<script lang="ts">
	import { AsyncButton } from '$lib/components/ui/async-button';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	let saves = 0;
	let timers: ReturnType<typeof setTimeout>[] = [];

	$effect(() => () => timers.forEach(clearTimeout));

	// Every other save fails, so both endings are one click apart.
	function save() {
		const fail = saves++ % 2 === 1;
		return new Promise<void>((resolve, reject) => {
			const timer = setTimeout(() => {
				timers = timers.filter((other) => other !== timer);
				if (fail) reject(new Error('The workspace is read-only right now'));
				else resolve();
			}, 1200);
			timers.push(timer);
		});
	}
</script>

<div class="bg-card flex w-full max-w-sm flex-col gap-4 rounded-2xl p-5 shadow-sm">
	<div class="flex items-center gap-3">
		<span
			class="bg-secondary text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full"
		>
			<Sparkles class="size-4" />
		</span>
		<div class="min-w-0">
			<p class="truncate font-semibold tracking-tight">Support assistant</p>
			<p class="text-muted-foreground truncate text-sm">System prompt · edited just now</p>
		</div>
	</div>
	<p class="bg-secondary rounded-2xl px-4 py-3 text-sm leading-relaxed">
		You help customers with billing questions. Be brief, cite the relevant plan, and hand off to a
		person when a refund is involved.
	</p>
	<div class="flex justify-end">
		<AsyncButton
			action={save}
			pendingLabel="Saving the prompt"
			successLabel="Prompt saved"
			errorLabel="Couldn't save the prompt. Try again."
		>
			Save prompt
		</AsyncButton>
	</div>
</div>
