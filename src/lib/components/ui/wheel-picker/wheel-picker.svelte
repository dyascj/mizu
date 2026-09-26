<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** Accessible name for the whole picker, such as "Briefing time". */
		label?: string;
		/** The group element. */
		ref?: HTMLDivElement | null;
		/** Classes for the group. */
		class?: string;
		/** One or more `WheelPickerColumn`s, side by side. */
		children: Snippet;
	};

	let { label, ref = $bindable(null), class: className, children, ...restProps }: Props = $props();
</script>

<div
	{...restProps}
	bind:this={ref}
	role="group"
	aria-label={label ?? restProps['aria-label']}
	data-slot="wheel-picker"
	class={cn('relative flex justify-center gap-2', className)}
>
	<!-- The band sits behind the transparent columns, so the middle row reads
	     as resting on it. -->
	<div
		aria-hidden="true"
		class="bg-secondary pointer-events-none absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 rounded-xl"
	></div>
	{@render children()}
</div>
