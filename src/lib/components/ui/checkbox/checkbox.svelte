<script lang="ts">
	import { Checkbox as CheckboxPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { untrack } from 'svelte';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = WithoutChildrenOrChild<CheckboxPrimitive.RootProps> & {
		/** Classes for the box. */
		class?: string;
	};

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: Props = $props();

	type State = 'checked' | 'indeterminate' | 'unchecked';
	let fill: HTMLSpanElement | null = null;

	/**
	 * The box's color in a state, read from a hidden copy of the box so a
	 * consumer's `data-[state=checked]:bg-*` counts as much as the default.
	 */
	function boxColor(root: HTMLElement, name: State) {
		const probe = document.createElement('span');
		probe.className = root.className;
		probe.dataset.state = name;
		probe.setAttribute('aria-hidden', 'true');
		probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;transition:none';
		root.after(probe);
		const color = getComputedStyle(probe).backgroundColor;
		probe.remove();
		return color;
	}

	function release() {
		ref?.style.removeProperty('background-color');
		fill?.style.removeProperty('background-color');
	}

	// At rest the fill inherits the box's own state color. While it grows in,
	// the box holds its empty color underneath so the growth shows; while it
	// shrinks away, the fill keeps the color it had. Driven by the state bits-ui
	// renders, so boxes inside a CheckboxGroup follow it too.
	let shown: State | null = null;
	function follow(node: HTMLSpanElement, next: State) {
		fill = node;
		const previous = shown;
		shown = next;
		if (previous === null || previous === next) return;
		release();
		if (!ref || prefersReducedMotion()) return;
		const was = previous !== 'unchecked';
		const is = next !== 'unchecked';
		if (was === is) return;
		node.style.backgroundColor = boxColor(ref, is ? next : previous);
		if (is) ref.style.backgroundColor = boxColor(ref, 'unchecked');
	}

	// Drawing is the confirmation, so it gets time to be seen. Undrawing only
	// gets out of the way, so it is quicker. Opacity snaps on at the start of a
	// draw and off at the end of an undraw, because a round cap at zero length
	// still leaves a dot behind.
	const drawn =
		'opacity-100 [stroke-dashoffset:0] [transition:stroke-dashoffset_var(--duration-base)_var(--ease-out),opacity_0s]';
	const undrawn =
		'opacity-0 [stroke-dashoffset:1] [transition:stroke-dashoffset_var(--duration-instant)_var(--ease-in),opacity_0s_var(--duration-instant)]';
</script>

<CheckboxPrimitive.Root
	bind:ref
	bind:checked
	bind:indeterminate
	data-value={restProps.value}
	class={cn(
		'bg-control border-input focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:text-primary-foreground relative flex size-5 shrink-0 items-center justify-center rounded-xs border transition-[border-color,box-shadow,scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-transparent data-[state=checked]:shadow-sm data-[state=indeterminate]:border-transparent data-[state=indeterminate]:shadow-sm',
		className
	)}
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		{@const filled = checked || indeterminate}
		<!-- Covers the border too, so a filled box is exactly the box. It lands on
		     a bouncy spring and leaves faster, on a plain curve. Its color is the
		     box's own, so state classes on the box decide it. -->
		<span
			{@attach (node) => {
				const next = indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked';
				untrack(() => follow(node, next));
			}}
			aria-hidden="true"
			data-slot="checkbox-fill"
			ontransitionend={(event) => {
				if (event.target === event.currentTarget && event.propertyName === 'scale') release();
			}}
			ontransitioncancel={(event) => {
				if (event.target === event.currentTarget && event.propertyName === 'scale') release();
			}}
			class={cn(
				'pointer-events-none absolute -inset-px rounded-[inherit] bg-inherit',
				filled
					? 'scale-100 opacity-100 [transition:scale_var(--duration-spring-bouncy)_var(--ease-spring-bouncy),opacity_var(--duration-instant)_var(--ease-out)]'
					: 'scale-[0.8] opacity-0 transition-[scale,opacity] duration-(--duration-instant) ease-in'
			)}
		></span>
		<svg
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="2.25"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			class="relative size-3.5"
		>
			<!-- Each mark draws itself in from its first point, like a pen stroke. -->
			<path
				d="m3.25 8.5 3 3 6.5-7"
				pathLength="1"
				data-slot="checkbox-check"
				class={cn('[stroke-dasharray:1]', checked && !indeterminate ? drawn : undrawn)}
			/>
			<path
				d="M4 8h8"
				pathLength="1"
				data-slot="checkbox-dash"
				class={cn('[stroke-dasharray:1]', indeterminate ? drawn : undrawn)}
			/>
		</svg>
	{/snippet}
</CheckboxPrimitive.Root>
