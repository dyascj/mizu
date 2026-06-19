<script lang="ts">
	import { Minus } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';

	let { class: className, ...restProps }: { class?: string } = $props();
</script>

<div role="separator" class={cn('text-muted-foreground', className)} {...restProps}>
	<Minus class="size-4" />
</div>
