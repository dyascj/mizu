<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';
	import { easeOut, prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { getHoldButtonState } from './context.js';

	type Props = Omit<SVGAttributes<SVGSVGElement>, 'children'> & {
		/** Classes for the icon. */
		class?: string;
	};

	let { class: className, ...restProps }: Props = $props();

	const hold = getHoldButtonState();

	// Delay the confirmation until the lid has landed.
	$effect(() => hold?.register());

	/** How far the lid swings open at the end of a full hold, in degrees. */
	const OPEN = 38;

	// The lid follows the fill, eased out, so it cracks open the moment the
	// press is heard and then creeps wider while the hold is decided. Letting
	// go lowers it with the fill. Confirming slams it shut on a bouncy spring.
	const opening = $derived(
		!!hold && !hold.confirmed && (hold.phase === 'holding' || hold.phase === 'retracting')
	);
	const angle = $derived(opening && hold && !prefersReducedMotion() ? easeOut(hold.progress) : 0);
</script>

<svg
	{...restProps}
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	class={cn('size-4 shrink-0 overflow-visible', className)}
>
	<!-- Hinged at the lid's right end, in view-box units. -->
	<g
		class={cn(
			'[transform-origin:21px_6px] [transform-box:view-box]',
			hold?.phase === 'done' &&
				'transition-[rotate,translate] duration-(--duration-spring-bouncy) ease-(--ease-spring-bouncy)'
		)}
		style:rotate="{angle * OPEN}deg"
		style:translate="0 {angle * -1.5}px"
	>
		<path d="M3 6h18" />
		<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
	</g>
	<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
	<path d="M10 11v6" />
	<path d="M14 11v6" />
</svg>
