<script lang="ts">
	import { LinkPreview as HoverCardPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<HoverCardPrimitive.TriggerProps> & {
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<HoverCardPrimitive.Trigger bind:ref class={cn(className)} {...restProps}>
	{#snippet child({ props })}
		<a {...props} role={restProps.role ?? 'link'}>{@render children?.()}</a>
	{/snippet}
</HoverCardPrimitive.Trigger>
