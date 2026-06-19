<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { Ellipsis } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLSpanElement> & { class?: string };
	let { class: className, ...rest }: Props = $props();
</script>

<span
	role="presentation"
	aria-hidden="true"
	class={cn('flex size-9 items-center justify-center', className)}
	{...rest}
>
	<Ellipsis class="size-4" />
	<span class="sr-only">More</span>
</span>
