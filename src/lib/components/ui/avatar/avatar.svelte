<script lang="ts">
	import { Avatar as AvatarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		loadingStatus = $bindable('loading'),
		children,
		...restProps
	}: AvatarPrimitive.RootProps = $props();
</script>

<AvatarPrimitive.Root
	bind:ref
	bind:loadingStatus
	class={cn(
		'relative flex size-10 shrink-0 overflow-hidden rounded-full border border-[color:var(--glass-border)] shadow-bevel',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</AvatarPrimitive.Root>
