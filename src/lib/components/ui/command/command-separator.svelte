<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CommandPrimitive.SeparatorProps & { class?: string } = $props();
</script>

<CommandPrimitive.Separator
	bind:ref
	class={cn('-mx-1 my-1 h-px bg-border', className)}
	{...restProps}
/>
