<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type Props = HTMLAttributes<HTMLDivElement> & {
		class?: string;
		ref?: HTMLDivElement | null;
		children?: Snippet;
	};
	let { class: className, ref = $bindable(null), children, ...rest }: Props = $props();
</script>

<div
	bind:this={ref}
	class={cn(
		'glass-strong gloss relative overflow-hidden rounded-2xl border border-[color:var(--glass-border)] text-card-foreground shadow-glass',
		className
	)}
	{...rest}
>
	<div class="relative z-10 flex flex-col">{@render children?.()}</div>
</div>
