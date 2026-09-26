<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Skeleton, SkeletonSwap } from '$lib/components/ui/skeleton';
	import Bot from '@lucide/svelte/icons/bot';
	import RotateCw from '@lucide/svelte/icons/rotate-cw';

	const week = [0.35, 0.5, 0.3, 0.65, 0.55, 0.8, 1];

	let loading = $state(true);
	let timer: ReturnType<typeof setTimeout> | undefined;

	function load() {
		loading = true;
		clearTimeout(timer);
		// Long enough for the shimmer to make one pass.
		timer = setTimeout(() => (loading = false), 1400);
	}

	$effect(() => {
		load();
		return () => clearTimeout(timer);
	});
</script>

<div class="flex w-full max-w-sm flex-col items-center gap-4">
	<div class="bg-card flex w-full flex-col gap-4 rounded-2xl p-5 shadow-sm">
		<!-- Every skeleton is sized to the box its content fills: a 48px avatar,
		     24px and 20px line boxes with a shorter bar centered in each, a
		     two-line paragraph, and a 72px stat block. -->
		<SkeletonSwap {loading} index={0}>
			{#snippet skeleton()}
				<div class="flex items-center gap-4">
					<Skeleton class="size-12 shrink-0 rounded-full" />
					<div class="flex flex-col">
						<div class="flex h-6 items-center"><Skeleton class="h-3.5 w-28 rounded-full" /></div>
						<div class="flex h-5 items-center"><Skeleton class="h-3 w-40 rounded-full" /></div>
					</div>
				</div>
			{/snippet}
			<div class="flex items-center gap-4">
				<span
					class="bg-secondary text-foreground grid size-12 shrink-0 place-items-center rounded-full"
				>
					<Bot class="size-5" />
				</span>
				<div class="flex min-w-0 flex-col">
					<p class="truncate text-base leading-6 font-semibold tracking-tight">Scout</p>
					<p class="text-muted-foreground truncate text-sm leading-5">Research agent · 3 tools</p>
				</div>
			</div>
		</SkeletonSwap>

		<SkeletonSwap {loading} index={1}>
			{#snippet skeleton()}
				<div class="flex flex-col">
					<div class="flex h-6 items-center"><Skeleton class="h-3.5 w-full rounded-full" /></div>
					<div class="flex h-6 items-center"><Skeleton class="h-3.5 w-2/3 rounded-full" /></div>
				</div>
			{/snippet}
			<p class="line-clamp-2 h-12 text-sm leading-6">
				Reads the sources you pick, checks every claim against them, and writes a cited brief.
			</p>
		</SkeletonSwap>

		<SkeletonSwap {loading} index={2}>
			{#snippet skeleton()}
				<Skeleton class="h-18 rounded-xl" />
			{/snippet}
			<div class="bg-secondary flex h-18 items-center justify-between rounded-xl px-4">
				<div class="flex flex-col">
					<span class="text-xl leading-7 font-semibold tracking-tight tabular-nums">1,284</span>
					<span class="text-muted-foreground text-sm leading-5 whitespace-nowrap"
						>Runs this week</span
					>
				</div>
				<div aria-hidden="true" class="flex h-8 items-end gap-1 sm:gap-1.5">
					{#each week as value, i (i)}
						<span
							class={i === week.length - 1
								? 'bg-primary w-1.5 rounded-full sm:w-2'
								: 'bg-primary/20 w-1.5 rounded-full sm:w-2'}
							style:height="{Math.max(value, 0.15) * 100}%"
						></span>
					{/each}
				</div>
			</div>
		</SkeletonSwap>
		<span class="sr-only" aria-live="polite">{loading ? 'Loading agent' : 'Agent loaded'}</span>
	</div>

	<Button variant="secondary" size="sm" onclick={load}>
		<RotateCw class="size-4" />
		Reload
	</Button>
</div>
