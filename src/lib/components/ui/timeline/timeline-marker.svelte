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
			'bg-card text-primary shadow-glow ring-background absolute start-[0.4375rem] top-0.5 z-10 flex size-[1.375rem] -translate-x-1/2 items-center justify-center rounded-full ring-4 rtl:translate-x-1/2',
			className
		)}
	>
		<Icon class="size-3" />
	</span>
{:else}
	<span
		aria-hidden="true"
		class={cn(
			'bg-primary shadow-glow ring-background absolute start-[0.4375rem] top-1 z-10 size-3 -translate-x-1/2 rounded-full ring-4 rtl:translate-x-1/2',
			className
		)}
	></span>
{/if}
