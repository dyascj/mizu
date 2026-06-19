<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLFieldsetAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLFieldsetAttributes & { class?: string; children?: Snippet };
	let { class: className, children, ...rest }: Props = $props();
</script>

<fieldset class={cn('flex flex-col gap-4', className)} {...rest}>
	{@render children?.()}
</fieldset>
