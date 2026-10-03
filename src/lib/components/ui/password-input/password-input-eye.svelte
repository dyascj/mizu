<script lang="ts">
	import {
		SpringValue,
		hasFinePointer,
		prefersReducedMotion,
		springPresets
	} from '$lib/components/ui/motion';
	import { untrack } from 'svelte';
	import { textMeasurer } from './strength.js';

	let {
		open,
		input
	}: {
		/** True while the password shows as text. */
		open: boolean;
		/** The field it reveals; while open, the eye reads along with its caret. */
		input: HTMLInputElement | null;
	} = $props();

	// Eye geometry in a 24 unit box. The upper lid's control points travel from
	// 5 (open) down to 19, where it lies on the lower lid and the eye is shut.
	const openY = 5;
	const shutY = 19;
	/** How far the iris may wander from centre before it would clip the lids. */
	const gazeX = 4;
	const gazeY = 2;
	/** Distance in pixels at which the gaze reaches its limit. */
	const gazeReach = 160;

	const uid = $props.id();
	const clipId = `${uid}-aperture`;

	let lidPath = $state<SVGPathElement | null>(null);
	let aperturePath = $state<SVGPathElement | null>(null);
	let iris = $state<SVGGElement | null>(null);
	let svg = $state<SVGSVGElement | null>(null);

	const topLid = (lid: number) => {
		const y = Math.round((openY + (shutY - openY) * lid) * 100) / 100;
		return `M2 12C6 ${y} 18 ${y} 22 12`;
	};

	function drawLid(lid: number) {
		lidPath?.setAttribute('d', topLid(lid));
		aperturePath?.setAttribute('d', `${topLid(lid)}C18 19 6 19 2 12Z`);
	}

	/** The lid from the first render on belongs to the spring, never to the markup. */
	const startsOpen = untrack(() => open);
	const firstLid = topLid(startsOpen ? 0 : 1);
	const lid = new SpringValue(startsOpen ? 0 : 1, { onUpdate: drawLid });
	const irisX = new SpringValue(0, { preset: springPresets.snappy, onUpdate: drawIris });
	const irisY = new SpringValue(0, { preset: springPresets.snappy, onUpdate: drawIris });

	function drawIris() {
		iris?.setAttribute('transform', `translate(${irisX.current} ${irisY.current})`);
	}

	/** Glances toward a point on the page, further the further away it is. */
	function lookAt(x: number, y: number) {
		if (!svg) return;
		const box = svg.getBoundingClientRect();
		const dx = x - (box.left + box.width / 2);
		const dy = y - (box.top + box.height / 2);
		const distance = Math.hypot(dx, dy);
		if (distance < 1) {
			irisX.set(0);
			irisY.set(0);
			return;
		}
		const reach = Math.min(1, distance / gazeReach);
		irisX.set((dx / distance) * reach * gazeX);
		irisY.set((dy / distance) * reach * gazeY);
	}

	// Opening springs up with a whisper of overshoot; closing is a quicker,
	// flatter fall. Shutting also brings the gaze home.
	$effect(() => {
		if (open) {
			lid.set(0, { preset: springPresets.smooth });
		} else {
			lid.set(1, { preset: springPresets.snappy });
			irisX.set(0);
			irisY.set(0);
		}
	});

	// While open, the pupil follows a mouse or pen. Touch has no cursor to follow.
	$effect(() => {
		if (!open || prefersReducedMotion() || !hasFinePointer()) return;
		const move = (event: PointerEvent) => {
			if (event.pointerType !== 'touch') lookAt(event.clientX, event.clientY);
		};
		window.addEventListener('pointermove', move, { passive: true });
		return () => window.removeEventListener('pointermove', move);
	});

	// While typing, the eye reads along with the caret.
	$effect(() => {
		const field = input;
		if (!field || !open || prefersReducedMotion()) return;
		const follow = () => {
			const measure = textMeasurer(field);
			if (!measure) return;
			const style = getComputedStyle(field);
			const upto = field.value.slice(0, field.selectionEnd ?? field.value.length);
			const box = field.getBoundingClientRect();
			// Right to left, the text hugs the right edge, so its start sits one text-width in from there.
			const x =
				style.direction === 'rtl'
					? box.right - parseFloat(style.paddingRight) - measure(field.value) + measure(upto)
					: box.left + parseFloat(style.paddingLeft) + measure(upto) - field.scrollLeft;
			lookAt(Math.max(box.left, Math.min(x, box.right)), box.top + box.height / 2);
		};
		const events = ['input', 'keyup', 'click', 'select', 'focus'] as const;
		for (const type of events) field.addEventListener(type, follow);
		return () => {
			for (const type of events) field.removeEventListener(type, follow);
		};
	});

	$effect(() => () => {
		lid.stop();
		irisX.stop();
		irisY.stop();
	});
</script>

<svg
	bind:this={svg}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.75"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	class="size-[1.125rem] overflow-visible"
>
	<defs>
		<clipPath id={clipId}>
			<path bind:this={aperturePath} d="{firstLid}C18 19 6 19 2 12Z" />
		</clipPath>
	</defs>
	<g clip-path="url(#{clipId})">
		<g bind:this={iris}>
			<circle cx="12" cy="12" r="3.4" />
			<circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
		</g>
	</g>
	<path d="M2 12C6 19 18 19 22 12" />
	<path bind:this={lidPath} d={firstLid} />
	<!-- Lashes hang from the shut lid. They belong to "hidden", not to the lid's
	     travel, so they arrive once it has landed and leave at once. -->
	<g
		class={open
			? '-translate-y-[1.5px] opacity-0 transition-[opacity,translate] duration-(--duration-instant) ease-in motion-reduce:translate-y-0'
			: 'translate-y-0 opacity-100 transition-[opacity,translate] delay-(--duration-instant) duration-(--duration-fast) ease-out motion-reduce:delay-0'}
	>
		<path d="M5.2 15.4 3.9 17.4" />
		<path d="M12 17.3V19.8" />
		<path d="M18.8 15.4 20.1 17.4" />
	</g>
</svg>
