<script lang="ts" module>
	export type PlanStep = {
		label: string;
		detail?: string;
		state: 'pending' | 'active' | 'done';
	};
</script>

<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { Spinner } from '$lib/components/ui/spinner';
	import { cn } from '$lib/utils.js';

	type Props = {
		/** The agent's steps, in order. */
		steps: PlanStep[];
		class?: string;
	};

	let { steps, class: className }: Props = $props();
</script>

<ol class={cn('flex w-fit flex-col gap-1 text-sm', className)}>
	{#each steps as step (step.label)}
		<li
			class={cn(
				'flex items-center gap-2.5 rounded-lg py-1 transition-colors duration-300',
				step.state === 'pending' && 'text-muted-foreground/60'
			)}
		>
			{#if step.state === 'done'}
				<span
					class="plan-check grid size-4 shrink-0 place-items-center rounded-full bg-success text-success-foreground"
				>
					<Check class="size-3" strokeWidth={3} />
				</span>
			{:else if step.state === 'active'}
				<Spinner size={16} class="shrink-0" />
			{:else}
				<span class="grid size-4 shrink-0 place-items-center">
					<span class="size-1.5 rounded-full bg-muted-foreground/40"></span>
				</span>
			{/if}
			<span class="min-w-0">
				<span class={cn('block truncate', step.state === 'active' && 'plan-shimmer font-medium')}
					>{step.label}</span
				>
				{#if step.detail}
					<span class="block truncate text-xs text-muted-foreground">{step.detail}</span>
				{/if}
			</span>
		</li>
	{/each}
</ol>

<style>
	.plan-check {
		animation: plan-pop 240ms ease-out both;
	}

	.plan-shimmer {
		background: linear-gradient(
			90deg,
			var(--foreground) 0%,
			var(--foreground) 35%,
			var(--muted-foreground) 50%,
			var(--foreground) 65%,
			var(--foreground) 100%
		);
		background-size: 200% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		animation: plan-sweep 2s linear infinite;
	}

	@keyframes plan-pop {
		from {
			transform: scale(0.5);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	@keyframes plan-sweep {
		from {
			background-position: 200% 0;
		}
		to {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.plan-check,
		.plan-shimmer {
			animation: none;
		}
	}
</style>
