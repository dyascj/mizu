<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Stepper } from '$lib/components/ui/stepper';
	import { cn } from '$lib/utils.js';

	const steps = [
		{ label: 'Plan', description: 'Scope the ask' },
		{ label: 'Search', description: 'Read sources' },
		{ label: 'Draft', description: 'Write it up' },
		{ label: 'Review', description: 'Check claims' }
	];
	const last = steps.length - 1;

	let current = $state(1);
	let finished = $state(false);

	const primary = $derived(finished ? 'Start over' : current === last ? 'Finish' : 'Continue');

	function next() {
		if (finished) {
			finished = false;
			current = 0;
		} else if (current === last) finished = true;
		else current += 1;
	}

	function back() {
		if (finished) finished = false;
		else if (current > 0) current -= 1;
	}
</script>

<div class="flex w-full max-w-lg flex-col gap-8">
	<Stepper {steps} {current} complete={finished} aria-label="Research run" />
	<div class="flex items-center justify-between gap-3">
		<!-- aria-disabled rather than disabled, so a keyboard reader who backs up
		     to the start keeps focus on the button. -->
		<Button
			variant="secondary"
			aria-disabled={current === 0 && !finished}
			class="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
			onclick={back}
		>
			Back
		</Button>
		<Button onclick={next}>
			<!-- Every label shares one cell, so the button keeps one width. -->
			<span class="grid">
				{#each ['Continue', 'Finish', 'Start over'] as label (label)}
					<span
						aria-hidden={label !== primary}
						class={cn(
							'col-start-1 row-start-1 transition-[opacity,filter] duration-(--duration-base) ease-out',
							label !== primary && 'opacity-0 blur-[4px]'
						)}
					>
						{label}
					</span>
				{/each}
			</span>
		</Button>
	</div>
</div>
