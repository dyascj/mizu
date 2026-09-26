<script lang="ts">
	import { Slider as SliderPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { SpringValue, prefersReducedMotion, springPresets } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = WithoutChildrenOrChild<SliderPrimitive.RootProps> & {
		/** Classes for the root. */
		class?: string;
		/**
		 * Pulling past either end stretches the track like a rubber band, and it
		 * springs back on release. An arrow key pressed at an end gives it a small
		 * nudge instead.
		 */
		elastic?: boolean;
		/**
		 * Called on every frame of an elastic stretch with how far the stretched
		 * end has moved on screen, in pixels along the track (negative is left or
		 * up). Use it to carry neighbouring content, such as icons, along.
		 */
		onStretch?: (offset: number) => void;
		/**
		 * Shows each thumb's value in a bubble above it while it is dragged or
		 * focused from the keyboard.
		 */
		showValue?: boolean;
		/** Formats a value for the bubble and for screen readers (`aria-valuetext`). */
		format?: (value: number) => string;
		/**
		 * With several thumbs, whether a thumb dragged past its neighbour trades
		 * places with it. `false` stops each thumb one step short of the next, so
		 * moving one bound never quietly changes the other.
		 */
		autoSort?: boolean;
		/**
		 * Accessible names for each thumb, such as `['Minimum price', 'Maximum
		 * price']`. Without them, thumbs take the slider's `aria-label` and a
		 * number when there are several.
		 */
		thumbLabels?: string[];
	};

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		min = 0,
		max = 100,
		step = 1,
		orientation = 'horizontal',
		dir = 'ltr',
		disabled = false,
		autoSort = true,
		elastic = false,
		onStretch,
		showValue = false,
		format,
		thumbLabels,
		onValueChange,
		onpointerdown: userPointerDown,
		onkeydowncapture: userKeydownCapture,
		class: className,
		...restProps
	}: Props = $props();

	/** The furthest the track stretches past an end, in pixels. */
	const maxStretch = 24;
	/** How far an arrow key at an end nudges the track, in pixels. */
	const keyNudge = 6;

	const direction = $derived(
		orientation === 'vertical' ? (dir === 'rtl' ? 'tb' : 'bt') : dir === 'rtl' ? 'rl' : 'lr'
	);
	/** The inline style property that places a thumb, and the range's two edges. */
	const startEdge = $derived(
		({ lr: 'left', rl: 'right', bt: 'bottom', tb: 'top' } as const)[direction]
	);
	const endEdge = $derived(
		({ lr: 'right', rl: 'left', bt: 'top', tb: 'bottom' } as const)[direction]
	);

	let track = $state<HTMLSpanElement | null>(null);

	// Thumbs and the range glide to new values on a spring, written straight to
	// CSS variables so a moving thumb never re-renders the component. Until a
	// spring first moves, each part falls back to the position bits-ui computed.
	const springs: SpringValue[] = [];
	const lastValues: number[] = [];
	/** Set while a thumb is dragged by hand, which must stay under the pointer. */
	let heldThumb = false;

	/** Thumbs on show; springs past this belong to thumbs that were removed. */
	const thumbCount = $derived(type === 'single' ? 1 : Array.isArray(value) ? value.length : 0);

	function writePositions() {
		if (!ref) return;
		const positions = springs.slice(0, thumbCount).map((spring) => spring.current);
		positions.forEach((position, index) =>
			ref?.style.setProperty(`--slider-thumb-${index}`, `${position}%`)
		);
		if (positions.length === 0) return;
		const multiple = positions.length > 1;
		ref.style.setProperty('--slider-range-start', `${multiple ? Math.min(...positions) : 0}%`);
		ref.style.setProperty('--slider-range-end', `${100 - Math.max(...positions)}%`);
	}

	/** Follows the position bits-ui gives a thumb, gliding whenever its value changed. */
	function follow(index: number, position: number, thumbValue: number) {
		return () => {
			const spring = (springs[index] ??= new SpringValue(position, {
				preset: springPresets.snappy,
				onUpdate: writePositions
			}));
			const moved = lastValues[index] !== undefined && lastValues[index] !== thumbValue;
			lastValues[index] = thumbValue;
			// Resizes and first measurements move the thumb without a new value; those jump.
			if (moved && !heldThumb) spring.set(position);
			else if (spring.target !== position || spring.moving) spring.jump(position);
		};
	}

	/** The percentage bits-ui placed a part at along `edge`, from its inline style. */
	function percentAt(style: unknown, edge: string) {
		const text = typeof style === 'string' ? style : '';
		const match = text.match(new RegExp(`(?:^|;)\\s*${edge}:\\s*(-?[\\d.]+)%`));
		return match ? Number(match[1]) : 0;
	}

	// Elastic ends. `pull` is signed along the value axis: positive past the
	// maximum, negative past the minimum.
	let pulledThumb: HTMLElement | null = null;
	/** Removes the window listeners of a drag in progress. */
	let endDrag: (() => void) | undefined;
	let pullSign = 1;
	const pull = new SpringValue(0, {
		preset: springPresets.bouncy,
		onUpdate: (amount) => applyPull(amount)
	});

	/** Gives freely at first, then stiffens so it never passes `maxStretch`. */
	function resist(overflow: number) {
		return maxStretch * Math.tanh(overflow / (maxStretch * 4));
	}

	function applyPull(amount: number) {
		if (!track) return;
		const horizontal = orientation === 'horizontal';
		const screen = direction === 'lr' || direction === 'tb' ? amount : -amount;
		onStretch?.(screen);
		if (amount === 0) {
			track.style.removeProperty('transform');
			track.style.removeProperty('transform-origin');
			pulledThumb?.style.removeProperty('transform');
			return;
		}
		// Along the pull the track stretches from its far end, which stays put;
		// the overshoot on release briefly squeezes it. Across, it thins a
		// little, like a rubber band.
		const along = pullSign * amount;
		const size = horizontal ? track.offsetWidth : track.offsetHeight;
		const stretch = 1 + along / Math.max(size, 1);
		const thin = 1 - along / (maxStretch * 6);
		const farEnd = pullSign > 0 ? startEdge : endEdge;
		track.style.transformOrigin = farEnd;
		track.style.transform = horizontal
			? `scale(${stretch}, ${thin})`
			: `scale(${thin}, ${stretch})`;
		// The thumb rides the stretched end.
		if (pulledThumb) {
			pulledThumb.style.transform = horizontal
				? `translateX(${screen}px)`
				: `translateY(${screen}px)`;
		}
	}

	function release() {
		pull.set(0, { preset: springPresets.bouncy });
	}

	function bump(thumb: HTMLElement, sign: 1 | -1) {
		if (prefersReducedMotion()) return;
		if (pull.current === 0) pulledThumb = thumb;
		pullSign = sign;
		pull.jump(sign * keyNudge);
		release();
	}

	/** Signed distance the pointer has travelled past the ends, along the value axis. */
	function overflowAt(event: PointerEvent) {
		if (!ref) return 0;
		const box = ref.getBoundingClientRect();
		const past = (point: number, low: number, high: number) =>
			point < low ? point - low : point > high ? point - high : 0;
		switch (direction) {
			case 'lr':
				return past(event.clientX, box.left, box.right);
			case 'rl':
				return -past(event.clientX, box.left, box.right);
			case 'bt':
				return -past(event.clientY, box.top, box.bottom);
			case 'tb':
				return past(event.clientY, box.top, box.bottom);
		}
	}

	/** Which end a key pushes toward, following bits-ui's key handling. */
	function keySign(key: string): 1 | -1 | 0 {
		if (key === 'Home') return -1;
		if (key === 'End') return 1;
		const horizontal = orientation === 'horizontal';
		const signs: Record<string, number> = {
			ArrowUp: direction === 'tb' ? -1 : 1,
			ArrowDown: direction === 'tb' ? 1 : -1,
			ArrowRight: horizontal ? (direction === 'rl' ? -1 : 1) : 0,
			ArrowLeft: horizontal ? (direction === 'rl' ? 1 : -1) : 0
		};
		return (Math.sign(signs[key] ?? 0) as 1 | -1 | 0) || 0;
	}

	// Removed thumbs take their springs with them, so the range spans only the thumbs left.
	$effect(() => {
		const count = thumbCount;
		for (const spring of springs.splice(count)) spring.stop();
		lastValues.length = Math.min(lastValues.length, count);
		for (let index = count; ref && index < count + 8; index++) {
			ref.style.removeProperty(`--slider-thumb-${index}`);
		}
		writePositions();
	});

	function onpointerdown(event: Parameters<NonNullable<typeof userPointerDown>>[0]) {
		userPointerDown?.(event);
		if (event.button !== 0 || disabled) return;
		const thumb = (event.target as Element | null)?.closest<HTMLElement>('[data-slider-thumb]');
		// A thumb grabbed by hand follows the pointer exactly; a press on the track
		// glides the nearest thumb over and keeps it gliding as the drag goes on.
		heldThumb = !!thumb;
		pulledThumb = null;
		endDrag?.();
		const move = (moveEvent: PointerEvent) => {
			if (!elastic || prefersReducedMotion()) return;
			const overflow = overflowAt(moveEvent);
			const active = ref?.querySelector<HTMLElement>('[data-slider-thumb][data-active]');
			const at = Number(active?.getAttribute('aria-valuenow'));
			// Only a thumb that has reached the end it is pulled toward stretches it.
			const atEnd = overflow > 0 ? at >= max : overflow < 0 ? at <= min : false;
			if (!active || !atEnd) {
				if (pull.current !== 0 && !pull.moving) release();
				return;
			}
			if (pull.current === 0) pulledThumb = active;
			pullSign = overflow > 0 ? 1 : -1;
			pull.jump(resist(overflow));
		};
		const up = () => {
			endDrag = undefined;
			heldThumb = false;
			if (pull.current !== 0) release();
			window.removeEventListener('pointermove', move, true);
			window.removeEventListener('pointerup', up, true);
			window.removeEventListener('pointercancel', up, true);
		};
		// Captured, because bits-ui stops pointer moves from bubbling past the document.
		window.addEventListener('pointermove', move, true);
		window.addEventListener('pointerup', up, true);
		window.addEventListener('pointercancel', up, true);
		endDrag = up;
	}

	function onkeydowncapture(event: Parameters<NonNullable<typeof userKeydownCapture>>[0]) {
		userKeydownCapture?.(event);
		if (!elastic || disabled) return;
		const thumb = (event.target as Element | null)?.closest<HTMLElement>('[data-slider-thumb]');
		const sign = keySign(event.key);
		if (!thumb || !sign) return;
		const at = Number(thumb.getAttribute('aria-valuenow'));
		if ((sign > 0 && at >= max) || (sign < 0 && at <= min)) bump(thumb, sign);
	}

	/** One step, so stopped thumbs never stack and can always be pulled apart. */
	const gap = $derived(typeof step === 'number' ? step : 0);

	function writeValue(next: number | number[] | undefined) {
		const previous = value;
		if (Array.isArray(next) && !autoSort && Array.isArray(previous)) {
			next = next.map((thumbValue, index) => {
				if (thumbValue === previous[index]) return thumbValue;
				const low = index > 0 ? previous[index - 1] + gap : -Infinity;
				const high = index < previous.length - 1 ? previous[index + 1] - gap : Infinity;
				return Math.min(high, Math.max(low, thumbValue));
			});
			if (next.every((thumbValue, index) => thumbValue === previous[index])) return;
		}
		value = next;
		(onValueChange as ((value: unknown) => void) | undefined)?.(next);
	}

	$effect(() => () => {
		endDrag?.();
		pull.stop();
		for (const spring of springs) spring.stop();
	});

	const text = (thumbValue: number) => (format ? format(thumbValue) : String(thumbValue));
</script>

<!--
	`value` + `type` are forwarded together so bits-ui's discriminated union
	(single `number` vs multiple `number[]`) resolves correctly downstream.
-->
<SliderPrimitive.Root
	bind:ref
	bind:value={() => value as never, (next: never) => writeValue(next)}
	type={type as never}
	{min}
	{max}
	{step}
	{orientation}
	{dir}
	{disabled}
	{autoSort}
	class={cn(
		'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
		className
	)}
	{onpointerdown}
	{onkeydowncapture}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			bind:this={track}
			data-orientation={orientation}
			class="bg-muted relative h-2 w-full grow overflow-hidden rounded-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2"
		>
			<SliderPrimitive.Range>
				{#snippet child({ props })}
					<span
						{...props}
						class="bg-primary absolute h-full data-[orientation=vertical]:h-auto data-[orientation=vertical]:w-full"
						style="{props.style}; {startEdge}: var(--slider-range-start, {percentAt(
							props.style,
							startEdge
						)}%); {endEdge}: var(--slider-range-end, {percentAt(props.style, endEdge)}%)"
					></span>
				{/snippet}
			</SliderPrimitive.Range>
		</span>
		{#each thumbItems as { index, value: thumbValue } (index)}
			<SliderPrimitive.Thumb
				{index}
				aria-label={thumbLabels?.[index] ??
					(restProps['aria-label']
						? `${restProps['aria-label']}${thumbItems.length > 1 ? ` ${index + 1}` : ''}`
						: undefined)}
				aria-labelledby={thumbLabels?.[index] ? undefined : restProps['aria-labelledby']}
				aria-valuetext={format ? format(thumbValue) : undefined}
			>
				{#snippet child({ props })}
					{@const position = percentAt(props.style, startEdge)}
					<span
						{...props}
						{@attach follow(index, position, thumbValue)}
						class="group/thumb focus-visible:ring-ring focus-visible:ring-offset-background border-input bg-control block size-5 shrink-0 rounded-full border shadow-sm transition-[scale] duration-(--duration-base) ease-out outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] disabled:pointer-events-none data-active:z-10"
						style="{props.style}; {startEdge}: var(--slider-thumb-{index}, {position}%)"
					>
						{#if showValue}
							<!-- In as it is grabbed or focused from the keyboard, out faster, so
							     it never lingers behind the thumb. -->
							<span
								aria-hidden="true"
								class={cn(
									'bg-primary text-primary-foreground pointer-events-none absolute rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap tabular-nums shadow-sm',
									'opacity-0 transition-[opacity,translate,scale] duration-(--duration-instant) ease-in motion-reduce:transition-opacity',
									'group-focus-visible/thumb:scale-100 group-focus-visible/thumb:opacity-100 group-focus-visible/thumb:duration-(--duration-fast) group-focus-visible/thumb:ease-out',
									'group-data-active/thumb:scale-100 group-data-active/thumb:opacity-100 group-data-active/thumb:duration-(--duration-fast) group-data-active/thumb:ease-out',
									'scale-[0.97] motion-reduce:scale-100',
									orientation === 'vertical'
										? 'top-1/2 right-full mr-2.5 origin-right translate-x-1 -translate-y-1/2 group-focus-visible/thumb:translate-x-0 group-data-active/thumb:translate-x-0 motion-reduce:translate-x-0'
										: 'bottom-full left-1/2 mb-2.5 origin-bottom -translate-x-1/2 translate-y-1 group-focus-visible/thumb:translate-y-0 group-data-active/thumb:translate-y-0 motion-reduce:translate-y-0'
								)}
							>
								{text(thumbValue)}
							</span>
						{/if}
					</span>
				{/snippet}
			</SliderPrimitive.Thumb>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
