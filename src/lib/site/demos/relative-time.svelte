<script lang="ts">
	import { onMount } from 'svelte';
	import FastForward from '@lucide/svelte/icons/fast-forward';
	import { Button } from '$lib/components/ui/button';
	import { RelativeTime } from '$lib/components/ui/relative-time';

	const MIN = 60_000;

	// Anchored to the reader's clock after mount, so the server renders no times.
	let anchor = $state<number | null>(null);
	let skipped = $state(0);
	onMount(() => {
		anchor = Date.now();
	});

	const ago = (ms: number) => (anchor === null ? null : anchor - skipped - ms);
</script>

<div class="flex w-full max-w-md flex-col items-start gap-4">
	<div class="bg-card flex w-full flex-col gap-1 rounded-2xl p-4 shadow-sm">
		<p class="font-medium">Refactor billing webhooks</p>
		<p class="text-muted-foreground text-sm leading-6">
			<!-- Each clause wraps as a unit, so a narrow line never starts on a dot. -->
			<span class="whitespace-nowrap">
				Agent started <RelativeTime date={ago(2 * 60 * MIN + 14 * MIN)} />
				<span aria-hidden="true" class="px-1">·</span>
			</span>
			<span class="whitespace-nowrap">
				last step <RelativeTime date={ago(4 * MIN + 51_000)} />
				<span aria-hidden="true" class="px-1">·</span>
			</span>
			<span class="whitespace-nowrap">synced <RelativeTime date={ago(12_000)} /></span>
		</p>
	</div>
	<Button variant="ghost" size="sm" onclick={() => (skipped += MIN)}>
		<FastForward class="size-3.5" />
		Skip ahead a minute
	</Button>
</div>
