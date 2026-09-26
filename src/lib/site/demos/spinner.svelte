<script lang="ts">
	import { Spinner } from '$lib/components/ui/spinner';
	import { duration } from '$lib/components/ui/motion';

	type Tile = {
		variant: 'ring' | 'dots' | 'bar' | 'pixel';
		working: string;
		finished: string;
	};

	const tiles: Tile[] = [
		{ variant: 'ring', working: 'Searching', finished: '12 sources' },
		{ variant: 'dots', working: 'Thinking', finished: 'Answered' },
		{ variant: 'bar', working: 'Indexing', finished: 'Indexed' },
		{ variant: 'pixel', working: 'Rendering', finished: 'Rendered' }
	];

	let done = $state<boolean[]>(tiles.map(() => false));
	const timers: ReturnType<typeof setTimeout>[] = [];

	function finish(i: number) {
		if (done[i]) return;
		done[i] = true;
		// Long enough to take the finish in, then it starts over.
		clearTimeout(timers[i]);
		timers[i] = setTimeout(() => (done[i] = false), duration.ambient);
	}

	$effect(() => () => timers.forEach(clearTimeout));
</script>

<div class="flex w-full max-w-xl flex-col items-center gap-3">
	<ul class="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
		{#each tiles as tile, i (tile.variant)}
			<li
				class="bg-card has-[button:hover]:bg-secondary relative flex h-32 flex-col items-center rounded-2xl shadow-sm transition-colors duration-(--duration-fast) ease-out"
			>
				<div class="flex flex-1 items-center justify-center">
					<Spinner
						variant={tile.variant}
						size={tile.variant === 'bar' ? 16 : 24}
						done={done[i]}
						label={tile.working}
						doneLabel={tile.finished}
					/>
				</div>
				<span
					aria-hidden="true"
					class="text-muted-foreground w-full truncate px-3 pb-4 text-center text-sm"
				>
					{done[i] ? tile.finished : tile.working}
				</span>
				<!-- Over the whole tile but outside the status, so its live text is
				     never swallowed by the button's name. -->
				<button
					type="button"
					aria-label="Finish {tile.working.toLowerCase()}"
					aria-disabled={done[i]}
					onclick={() => finish(i)}
					class="focus-visible:ring-ring focus-visible:ring-offset-background absolute inset-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2 aria-disabled:cursor-default"
				></button>
			</li>
		{/each}
	</ul>
	<p class="text-muted-foreground text-sm">Select a tile to see how it finishes</p>
</div>
