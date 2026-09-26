<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui';
	import { untrack, type Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	import { setRadioGroupState } from './context.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		class: className,
		children,
		...restProps
	}: RadioGroupPrimitive.RootProps & {
		class?: string;
		children?: Snippet;
	} = $props();

	let previousRing: DOMRect | null = null;

	setRadioGroupState({
		get previousRing() {
			return previousRing;
		}
	});

	// Before the new card draws its ring, note where the old one was, so the
	// ring can glide over from there instead of jumping.
	$effect.pre(() => {
		void value;
		untrack(() => {
			const group = ref;
			const ring = [
				...(group?.querySelectorAll<HTMLElement>('[data-slot="radio-card-ring"]') ?? [])
			].find((node) => node.closest('[data-radio-group-root]') === group);
			previousRing = ring?.getBoundingClientRect() ?? null;
		});
	});
</script>

<RadioGroupPrimitive.Root bind:ref bind:value class={cn('grid gap-2', className)} {...restProps}>
	{@render children?.()}
</RadioGroupPrimitive.Root>
