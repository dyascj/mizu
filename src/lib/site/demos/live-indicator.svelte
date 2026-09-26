<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { LiveIndicator } from '$lib/components/ui/live-indicator';
	import AudioLines from '@lucide/svelte/icons/audio-lines';

	let viewers = $state(1284);
	let reconnecting = $state(false);
	let card = $state<HTMLElement | null>(null);
	let visible = $state(true);

	// Real audiences drift: mostly small steps, a slight lean toward growth,
	// and now and then a bigger jump when a link gets shared.
	function drift(n: number) {
		const size =
			Math.random() < 0.08 ? 8 + Math.floor(Math.random() * 12) : 1 + Math.floor(Math.random() * 4);
		return Math.max(1, n + (Math.random() < 0.56 ? 1 : -1) * size);
	}

	$effect(() => {
		if (!card) return;
		const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
		observer.observe(card);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (reconnecting || !visible) return;
		let timer: ReturnType<typeof setTimeout>;
		// Irregular gaps: a count ticking on a metronome looks fake.
		const next = () => {
			timer = setTimeout(
				() => {
					if (document.visibilityState === 'visible') viewers = drift(viewers);
					next();
				},
				900 + Math.random() * 1800
			);
		};
		next();
		return () => clearTimeout(timer);
	});
</script>

<div class="flex w-full max-w-sm flex-col items-center gap-5">
	<div bind:this={card} class="bg-card flex w-full flex-col gap-4 rounded-2xl p-5 shadow-sm">
		<div class="flex items-start justify-between gap-3">
			<span
				class="bg-secondary text-muted-foreground grid size-10 shrink-0 place-items-center rounded-full"
			>
				<AudioLines class="size-4" />
			</span>
			<LiveIndicator {viewers} {reconnecting} />
		</div>
		<div class="min-w-0">
			<p class="font-semibold tracking-tight">Launch keynote · live captions</p>
			<p class="text-muted-foreground mt-1 text-sm">
				The assistant transcribes and translates into 12 languages as the talk happens.
			</p>
		</div>
	</div>
	<Button variant="ghost" size="sm" onclick={() => (reconnecting = !reconnecting)}>
		<!-- Both labels share a cell, so the button never changes width. -->
		<span class="grid">
			<span class={['col-start-1 row-start-1', reconnecting && 'invisible']}>Drop connection</span>
			<span class={['col-start-1 row-start-1', !reconnecting && 'invisible']}
				>Restore connection</span
			>
		</span>
	</Button>
</div>
