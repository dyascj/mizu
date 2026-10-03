<script lang="ts">
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';
	import DrawerPortal from './drawer-portal.svelte';
	import DrawerOverlay from './drawer-overlay.svelte';
	import { cn } from '$lib/utils.js';
	import type { ComponentProps } from 'svelte';
	import type { WithoutChildrenOrChild } from '$lib/utils.js';
	import { SpringValue, springPresets } from '$lib/components/ui/motion';
	import { setDrawerLayer } from './context.js';

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		children,
		...restProps
	}: DrawerPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DrawerPortal>>;
	} = $props();

	/** Upward overdrag tops out here; the surface continues below the edge, so no gap opens. */
	const RUBBER = 36;
	/** Half the cap is reached after this much pull, so resistance builds slowly. */
	const RUBBER_HALF = 120;

	// Pulled away from its edge, the drawer still gives, less the further you
	// pull, like stretching something that wants to snap back. The drag library
	// handles every other direction; this covers the one it leaves still. On
	// release a spring carries the finger's speed home.
	const pull = new SpringValue(0, {
		preset: springPresets.snappy,
		onUpdate: (value) => {
			if (ref) ref.style.translate = value ? `0 ${value}px` : '';
		}
	});

	$effect(() => {
		const node = ref;
		if (!node) return;
		let start: { pointer: number; y: number } | null = null;
		let last = { value: 0, time: 0, velocity: 0 };

		const pullable = (target: EventTarget | null) => {
			let el = target instanceof Element ? target : null;
			if (!el || el.closest('input, textarea, select, [data-vaul-no-drag]')) return false;
			// Content that scrolls keeps its own gesture.
			for (; el && el !== node; el = el.parentElement) {
				if (el.scrollHeight > el.clientHeight + 1) return false;
			}
			return true;
		};
		const move = (event: PointerEvent) => {
			if (!start || event.pointerId !== start.pointer) return;
			const side = node.dataset.vaulDrawerDirection;
			const away = (event.clientY - start.y) * (side === 'bottom' ? -1 : 1);
			const band =
				away <= 0 || node.classList.contains('vaul-dragging')
					? 0
					: RUBBER * (1 - 1 / (1 + away / RUBBER_HALF));
			const value = side === 'bottom' ? -band : band;
			const now = performance.now();
			// Units per 60fps frame, the spring's own measure.
			last = {
				value,
				time: now,
				velocity: last.time ? ((value - last.value) * 1000) / 60 / Math.max(now - last.time, 1) : 0
			};
			pull.jump(value);
		};
		const end = () => {
			start = null;
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', end);
			window.removeEventListener('pointercancel', end);
			if (pull.current) pull.set(0, { velocity: last.velocity });
		};
		const down = (event: PointerEvent) => {
			const side = node.dataset.vaulDrawerDirection;
			if (side !== 'bottom' && side !== 'top') return;
			if ((event.pointerType === 'mouse' && event.button !== 0) || !pullable(event.target)) return;
			start = { pointer: event.pointerId, y: event.clientY };
			last = { value: pull.current, time: 0, velocity: 0 };
			pull.stop();
			window.addEventListener('pointermove', move);
			window.addEventListener('pointerup', end);
			window.addEventListener('pointercancel', end);
		};
		node.addEventListener('pointerdown', down);
		return () => {
			node.removeEventListener('pointerdown', down);
			end();
			pull.stop();
		};
	});

	// While a nested drawer is dragged, the scrim over this one follows the
	// finger; written straight to the element so dragging never re-renders.
	setDrawerLayer({
		setNestedDrag(progress) {
			if (!ref) return;
			if (progress === null) {
				ref.style.removeProperty('--drawer-nested-drag');
				ref.style.removeProperty('--drawer-scrim-transition');
			} else {
				ref.style.setProperty('--drawer-nested-drag', String(Math.min(Math.max(progress, 0), 1)));
				ref.style.setProperty('--drawer-scrim-transition', 'none');
			}
		}
	});
</script>

<DrawerPortal {...portalProps}>
	<DrawerOverlay />
	<DrawerPrimitive.Content
		bind:ref
		data-slot="drawer-content"
		class={cn(
			'group/drawer-content bg-popover fixed z-50 flex h-auto flex-col shadow-xl',
			// Pushed back behind a nested drawer, this one dims under a scrim that
			// scales and rounds with it. Black dims both themes the same way.
			"before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-[inherit] before:bg-black before:opacity-0 before:content-[''] before:[transition:var(--drawer-scrim-transition,opacity_var(--duration-slow)_var(--ease-out))]",
			'data-nested-open:before:opacity-[calc(0.2*(1-var(--drawer-nested-drag,0)))]',
			'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-3xl',
			'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-3xl',
			// vaul's left and right are physical: it slides and drags along the screen's
			// x axis whatever the text direction, so the panel is pinned the same way.
			'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:rounded-l-3xl data-[vaul-drawer-direction=right]:sm:max-w-sm',
			'data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:rounded-r-3xl data-[vaul-drawer-direction=left]:sm:max-w-sm',
			className
		)}
		{...restProps}
	>
		<div
			class="bg-border-strong mx-auto mt-4 hidden h-1.5 w-12 shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block"
		></div>
		{@render children?.()}
	</DrawerPrimitive.Content>
</DrawerPortal>
