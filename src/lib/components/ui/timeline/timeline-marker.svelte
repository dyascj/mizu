<script lang="ts">
	import type { Component } from 'svelte';
	import type { LucideProps } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		icon
	}: {
		class?: string;
		/** When set, renders a slightly larger card node holding the icon. */
		icon?: Component<LucideProps>;
	} = $props();
</script>

{#if icon}
	{@const Icon = icon}
	<span
		aria-hidden="true"
		class={cn(
			'bg-card absolute top-0.5 left-[0.4375rem] z-10 flex size-[1.375rem] -translate-x-1/2 items-center justify-center rounded-full text-primary shadow-glow ring-4 ring-background',
			className
		)}
	>
		<Icon class="size-3" />
	</span>
{:else}
	<span
		aria-hidden="true"
		class={cn(
			'bg-primary absolute top-1 left-[0.4375rem] z-10 size-3 -translate-x-1/2 rounded-full shadow-glow ring-4 ring-background',
			className
		)}
	></span>
{/if}
