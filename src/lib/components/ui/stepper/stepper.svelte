<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import Check from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils.js';

	type Step = {
		label: string;
		description?: string;
	};

	type Props = Omit<HTMLAttributes<HTMLOListElement>, 'children'> & {
		steps: Step[];
		current?: number;
		orientation?: 'horizontal' | 'vertical';
		clickable?: boolean;
		onStepChange?: (i: number) => void;
		class?: string;
		ref?: HTMLOListElement | null;
	};

	let {
		steps,
		current = $bindable(0),
		orientation = 'horizontal',
		clickable = false,
		onStepChange,
		class: className,
		ref = $bindable(null),
		...rest
	}: Props = $props();

	const isVertical = $derived(orientation === 'vertical');

	function go(i: number) {
		if (!clickable) return;
		current = i;
		onStepChange?.(i);
	}
</script>

<ol
	bind:this={ref}
	class={cn('flex w-full', isVertical ? 'flex-col' : 'items-start', className)}
	{...rest}
>
	{#each steps as step, i (i)}
		{@const completed = i < current}
		{@const active = i === current}
		<li
			class={cn(
				'group relative flex min-w-0',
				isVertical ? 'gap-4 pb-6 last:pb-0' : 'flex-1 flex-col items-center last:flex-none'
			)}
			aria-current={active ? 'step' : undefined}
		>
			<!-- Connector: vertical runs down through the node column; horizontal spans the row. -->
			{#if i < steps.length - 1}
				<span
					aria-hidden="true"
					class={cn(
						'pointer-events-none absolute transition-[background] duration-300 ease-out',
						completed ? 'bg-primary' : 'bg-border',
						isVertical
							? 'top-10 bottom-1 left-[1.125rem] w-0.5 -translate-x-1/2'
							: 'top-[1.125rem] left-1/2 h-0.5 w-full -translate-y-1/2'
					)}
				></span>
			{/if}

			<!-- Node + label -->
			<div class={cn('relative z-10 flex', isVertical ? 'shrink-0' : 'flex-col items-center')}>
				{#if clickable}
					<button
						type="button"
						onclick={() => go(i)}
						aria-label={step.label}
						class={cn(
							'relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold outline-none transition-[background,color,box-shadow] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96]',
							completed && 'bg-primary text-primary-foreground shadow-sm',
							active &&
								'bg-primary text-primary-foreground shadow-glow ring-2 ring-[color:var(--primary)] ring-offset-2 ring-offset-background',
							!completed && !active && 'bg-secondary text-muted-foreground hover:bg-accent'
						)}
					>
						{#if completed}
							<Check class="relative z-10 size-4" />
						{:else}
							<span class="relative z-10">{i + 1}</span>
						{/if}
					</button>
				{:else}
					<span
						aria-hidden="true"
						class={cn(
							'relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold transition-[background,color,box-shadow] duration-200 ease-out',
							completed && 'bg-primary text-primary-foreground shadow-sm',
							active &&
								'bg-primary text-primary-foreground shadow-glow ring-2 ring-[color:var(--primary)] ring-offset-2 ring-offset-background',
							!completed && !active && 'bg-secondary text-muted-foreground'
						)}
					>
						{#if completed}
							<Check class="relative z-10 size-4" />
						{:else}
							<span class="relative z-10">{i + 1}</span>
						{/if}
					</span>
				{/if}
			</div>

			<div
				class={cn(
					'min-w-0',
					isVertical ? 'pt-1.5' : 'mt-2 flex flex-col items-center px-1 text-center'
				)}
			>
				<span
					class={cn(
						'block text-sm font-semibold transition-colors duration-200',
						active ? 'text-foreground' : completed ? 'text-foreground' : 'text-muted-foreground'
					)}
				>
					{step.label}
				</span>
				{#if step.description}
					<span class="mt-0.5 block text-xs text-muted-foreground">{step.description}</span>
				{/if}
			</div>
		</li>
	{/each}
</ol>
