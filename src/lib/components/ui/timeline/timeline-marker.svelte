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
			'bg-card text-primary shadow-glow ring-background absolute top-0.5 left-[0.4375rem] z-10 flex size-[1.375rem] -translate-x-1/2 items-center justify-center rounded-full ring-4',
			className
		)}
	>
		<Icon class="size-3" />
	</span>
{:else}
	<span
		aria-hidden="true"
		class={cn(
			'bg-primary shadow-glow ring-background absolute top-1 left-[0.4375rem] z-10 size-3 -translate-x-1/2 rounded-full ring-4',
			className
		)}
	></span>
{/if}
