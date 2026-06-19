<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	let {
		size = 20,
		class: className,
		...rest
	}: HTMLAttributes<HTMLDivElement> & { size?: number; class?: string } = $props();
</script>

<div role="status" class={cn('inline-flex text-primary', className)} {...rest}>
	<svg
		class="animate-spin"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<circle
			class="opacity-20"
			cx="12"
			cy="12"
			r="9"
			stroke="currentColor"
			stroke-width="3"
		/>
		<path
			class="stroke-current"
			d="M21 12a9 9 0 0 0-9-9"
			stroke-width="3"
			stroke-linecap="round"
		/>
	</svg>
	<span class="sr-only">Loading</span>
</div>
