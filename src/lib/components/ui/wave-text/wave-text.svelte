<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import {
		duration,
		easeOut,
		prefersReducedMotion,
		SpringValue,
		springPresets
	} from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
		/** The text. Assistive technology reads it once, as plain text. */
		text: string;
		/** The element to render. */
		as?: 'span' | 'p' | 'h1' | 'h2' | 'h3';
		/** The root element. */
		ref?: HTMLElement | null;
		/** Classes for the root. */
		class?: string;
	};

	let {
		text,
		as = 'span',
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const words = $derived(text.split(' ').map((word) => Array.from(word)));

	/** How high the crest lifts a letter, in em, so it scales with the type. */
	const LIFT = 0.18;
	/** How much the crest grows a letter. */
	const GROW = 0.08;
	/** How far the wave reaches either side of the pointer, in em: about two letters. */
	const SPREAD = 1;
	/** How far letters away from the pointer fade toward muted for reduced motion, in percent. */
	const DIM = 45;
	/** A tap ripple has to cross the whole line, so it runs longer than UI motion. */
	const RIPPLE = duration.slow + duration.deliberate;

	const bell = (distance: number) => Math.exp(-(distance * distance));

	// Everything runs outside Svelte's state: springs and the ripple write
	// straight to each letter's style, once per frame, and sleep at rest.
	const wave: Attachment<HTMLElement> = (root) => {
		void words;
		const letters = Array.from(root.querySelectorAll<HTMLElement>('[data-letter]'));
		const reduce = prefersReducedMotion();
		const centers: { x: number; y: number; h: number }[] = [];
		let em = 16;
		let frame = 0;
		let rippleFrame = 0;
		let ripple = 1;
		let rippleFrom = 0;
		let rippleWidth = 1;

		// Measured on mount and resize, never per frame. Offsets ignore
		// transforms, so a lifted letter still reports where it rests.
		const measure = () => {
			em = parseFloat(getComputedStyle(root).fontSize) || 16;
			letters.forEach((letter, i) => {
				centers[i] = {
					x: letter.offsetLeft + letter.offsetWidth / 2,
					y: letter.offsetTop + letter.offsetHeight / 2,
					h: letter.offsetHeight || em
				};
			});
		};

		const paint = () => {
			frame = 0;
			const px = pointerX.current;
			const py = pointerY.current;
			const h = hover.current;
			letters.forEach((letter, i) => {
				const c = centers[i];
				if (!c) return;
				// The crest follows the pointer along the line it is on.
				const near = bell((px - c.x) / (SPREAD * em)) * bell((py - c.y) / c.h) * h;
				let strength = near;
				if (ripple < 1) {
					// The ring's radius grows with progress while its height fades out.
					const ring = Math.abs(c.x - rippleFrom) - ripple * rippleWidth;
					strength = Math.max(near, bell(ring / (SPREAD * em)) * (1 - ripple));
				}
				if (reduce) {
					const dim = Math.round(DIM * Math.max(0, h - strength));
					letter.style.color = dim
						? `color-mix(in oklab, currentColor, var(--muted-foreground) ${dim}%)`
						: '';
				} else if (strength < 0.001) {
					letter.style.removeProperty('translate');
					letter.style.removeProperty('scale');
				} else {
					letter.style.translate = `0 ${(-LIFT * strength).toFixed(4)}em`;
					letter.style.scale = `${(1 + GROW * strength).toFixed(4)}`;
				}
			});
		};
		const schedule = () => {
			frame ||= requestAnimationFrame(paint);
		};

		// Soft enough that the crest trails the pointer a little, with no
		// overshoot, so letters never dip below the baseline.
		const pointerX = new SpringValue(0, { preset: springPresets.smooth, onUpdate: schedule });
		const pointerY = new SpringValue(0, { preset: springPresets.smooth, onUpdate: schedule });
		const hover = new SpringValue(0, { preset: springPresets.smooth, onUpdate: schedule });

		const local = (event: PointerEvent) => {
			const box = root.getBoundingClientRect();
			// Rects are after transforms; a scaled ancestor would double the offset.
			const scale = box.width / root.offsetWidth || 1;
			return { x: (event.clientX - box.left) / scale, y: (event.clientY - box.top) / scale };
		};

		const enter = (event: PointerEvent) => {
			if (event.pointerType === 'touch') return;
			// Fresh positions for this visit, in case the line reflowed.
			measure();
			// Start the crest under the pointer instead of sweeping in from the edge.
			const { x, y } = local(event);
			pointerX.jump(x);
			pointerY.jump(y);
		};
		const move = (event: PointerEvent) => {
			if (event.pointerType === 'touch') return;
			const { x, y } = local(event);
			pointerX.set(x);
			pointerY.set(y);
			hover.set(1);
		};
		const leave = () => hover.set(0);
		const down = (event: PointerEvent) => {
			if (event.pointerType !== 'touch' || reduce) return;
			rippleFrom = local(event).x;
			rippleWidth = root.offsetWidth || 1;
			cancelAnimationFrame(rippleFrame);
			let start: number | undefined;
			const step = (now: number) => {
				start ??= now;
				const t = Math.min(1, (now - start) / RIPPLE);
				ripple = easeOut(t);
				paint();
				rippleFrame = t < 1 ? requestAnimationFrame(step) : 0;
			};
			rippleFrame = requestAnimationFrame(step);
		};

		measure();
		const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
		observer?.observe(root);
		root.addEventListener('pointerenter', enter);
		root.addEventListener('pointermove', move);
		root.addEventListener('pointerleave', leave);
		root.addEventListener('pointerdown', down);
		return () => {
			observer?.disconnect();
			cancelAnimationFrame(frame);
			cancelAnimationFrame(rippleFrame);
			for (const spring of [pointerX, pointerY, hover]) spring.stop();
			root.removeEventListener('pointerenter', enter);
			root.removeEventListener('pointermove', move);
			root.removeEventListener('pointerleave', leave);
			root.removeEventListener('pointerdown', down);
			for (const letter of letters) {
				letter.style.removeProperty('translate');
				letter.style.removeProperty('scale');
				letter.style.removeProperty('color');
			}
		};
	};
</script>

<svelte:element
	this={as}
	{...restProps}
	bind:this={ref}
	{@attach wave}
	class={cn('relative cursor-default select-none', className)}
>
	<span class="sr-only">{text}</span>
	<span aria-hidden="true"
		>{#each words as word, w (w)}{w > 0 ? ' ' : ''}<span class="inline-block whitespace-nowrap"
				>{#each word as char, c (c)}<span data-letter class="inline-block origin-bottom"
						>{char}</span
					>{/each}</span
			>{/each}</span
	>
</svelte:element>
