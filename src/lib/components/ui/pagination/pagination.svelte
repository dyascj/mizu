<script lang="ts">
	import { Pagination as PaginationPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		page = $bindable(1),
		class: className,
		...restProps
	}: PaginationPrimitive.RootProps & { class?: string } = $props();
</script>

<PaginationPrimitive.Root
	bind:ref
	bind:page
	class={cn('mx-auto flex w-full flex-col items-center gap-3', className)}
	{...restProps}
/>
