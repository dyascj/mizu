<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import { pop, prefersReducedMotion, springs } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import { clamp, fromHex, hsvToRgb, keyStep, toHex, type Hsva } from './color.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/**
		 * The color as uppercase hex: `#RRGGBB`, or `#RRGGBBAA` once it is
		 * translucent. Accepts any of `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`.
		 */
		value?: string;
		/** Called with the new hex on every change, including each frame of a drag. */
		onValueChange?: (hex: string) => void;
		/**
		 * Called once a change settles: a drag ends, a nudged slider loses focus,
		 * the hex field is applied, or a recent color is used.
		 */
		onValueCommit?: (hex: string) => void;
		/**
		 * Recently used colors, newest first. Each committed color joins the
		 * front. Leave it out to hide the row.
		 */
		recent?: string[];
		/** How many recent colors to keep. */
		maxRecent?: number;
		/** Shows the opacity slider. Without it the color stays opaque. */
		alpha?: boolean;
		/** The root element. */
		ref?: HTMLDivElement | null;
		/** Classes for the root. */
		class?: string;
	};

	let {
		value = $bindable('#5B8DEF'),
		onValueChange,
		onValueCommit,
		recent = $bindable(),
		maxRecent = 8,
		alpha = true,
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const uid = $props.id();

	const fallback: Hsva = { h: 220, s: 0.6, v: 0.9, a: 1 };
	let color = $state<Hsva>(
		untrack(() => {
			const parsed = fromHex(value, fallback) ?? fallback;
			return alpha ? parsed : { ...parsed, a: 1 };
		})
	);
	const hex = $derived(toHex(color));
	const rgb = $derived(hsvToRgb(color.h, color.s, color.v).join(' '));
	/** The recent swatch that matches the color, when it came from one. */
	let active = $state<string | null>(null);

	// A parent changing the value from outside moves the picker too.
	$effect.pre(() => {
		const next = value;
		untrack(() => {
			if (next.toUpperCase() === hex) return;
			const parsed = fromHex(next, color);
			if (parsed) color = alpha ? parsed : { ...parsed, a: 1 };
		});
	});

	function update(patch: Partial<Hsva>) {
		color = { ...color, ...patch };
		if (active !== hex) active = null;
		if (value !== hex) {
			value = hex;
			onValueChange?.(hex);
		}
	}

	/** Keeps the first of each color, however its hex is cased. */
	function unique(colors: string[]) {
		const keys = colors.map((c) => c.toUpperCase());
		return colors.filter((_, i) => keys.indexOf(keys[i]) === i);
	}
	const swatches = $derived(recent ? unique(recent) : undefined);

	/** Set by a key that moved a slider and not yet committed. */
	let nudged = false;

	// Recents update when a change settles, so a drag adds one swatch rather than one per frame.
	function commit() {
		// Whatever was nudged by keys settles here too, so a blur does not commit it again.
		nudged = false;
		if (recent) {
			const next = unique([hex, ...recent]).slice(0, maxRecent);
			if (next.join() !== recent.join()) recent = next;
		}
		active = hex;
		onValueCommit?.(hex);
	}

	/**
	 * Pointer capture keeps a drag alive outside the element, and only the
	 * first pointer counts, so a second finger cannot make the thumb jump.
	 */
	function drag(onPoint: (x: number, y: number) => void, inset = 0): Attachment<HTMLElement> {
		return (node) => {
			let pointer: number | null = null;
			let rect: DOMRect | null = null;
			const point = (event: PointerEvent) => {
				if (!rect) return;
				onPoint(
					clamp((event.clientX - rect.left - inset) / (rect.width - inset * 2)),
					clamp((event.clientY - rect.top) / rect.height)
				);
			};
			const down = (event: PointerEvent) => {
				if (pointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
				pointer = event.pointerId;
				node.setPointerCapture?.(event.pointerId);
				// Read once per drag rather than on every move.
				rect = node.getBoundingClientRect();
				point(event);
			};
			const move = (event: PointerEvent) => {
				if (event.pointerId === pointer) point(event);
			};
			const end = (event: PointerEvent) => {
				if (event.pointerId !== pointer) return;
				pointer = null;
				commit();
			};
			node.addEventListener('pointerdown', down);
			node.addEventListener('pointermove', move);
			node.addEventListener('pointerup', end);
			node.addEventListener('pointercancel', end);
			return () => {
				node.removeEventListener('pointerdown', down);
				node.removeEventListener('pointermove', move);
				node.removeEventListener('pointerup', end);
				node.removeEventListener('pointercancel', end);
			};
		};
	}

	/** Keyboard changes commit when the slider loses focus, like a drag that ends. */
	function settle() {
		if (nudged) commit();
		nudged = false;
	}

	function onPadKey(event: KeyboardEvent) {
		const delta = keyStep(event, 0.01);
		if (delta === null) return;
		event.preventDefault();
		nudged = true;
		// Left and right move saturation, the rest brightness, matching the axes on screen.
		if (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
			update({ s: clamp(color.s + delta) });
		else update({ v: clamp(color.v + delta) });
	}

	function channelKey(
		event: KeyboardEvent,
		fraction: number,
		step: number,
		set: (f: number) => void
	) {
		const delta = keyStep(event, step);
		if (delta === null) return;
		event.preventDefault();
		nudged = true;
		set(clamp(fraction + delta));
	}

	// The hex field: free to type in, applied on Enter or when you leave it.
	let draft = $state<string | null>(null);
	let invalid = $state(false);

	function applyHex(leaving: boolean) {
		if (draft === null) return;
		const next = fromHex(draft, color);
		if (!next) {
			// Enter keeps the text so it can be fixed; leaving puts the real value back.
			invalid = !leaving;
			if (leaving) draft = null;
			return;
		}
		invalid = false;
		// The same color leaves the precise channels alone rather than rounding
		// them through 8-bit hex.
		if (toHex(alpha ? next : { ...next, a: 1 }) === hex) {
			draft = leaving ? null : hex.slice(1);
			return;
		}
		update(alpha ? next : { ...next, a: 1 });
		draft = leaving ? null : hex.slice(1);
		commit();
	}

	function useRecent(swatch: string) {
		const next = fromHex(swatch, color);
		if (!next) return;
		// Applies without reordering, so the swatch under the pointer stays put.
		update(alpha ? next : { ...next, a: 1 });
		active = hex;
		invalid = false;
		draft = null;
		onValueCommit?.(hex);
	}

	// New recents spring in and the rest shuffle along. Environments without the
	// Web Animations API, such as jsdom, skip both.
	const canAnimate = (node: Element) => typeof (node as HTMLElement).animate === 'function';
	function enter(node: Element) {
		return canAnimate(node) ? pop(node, { scale: 0.6, spring: springs.snappy }) : {};
	}
	// When a color joins the front, the others glide along on a spring.
	let row = $state<HTMLDivElement | null>(null);
	let before = new Map<Element, DOMRect>();

	$effect.pre(() => {
		void recent?.join();
		untrack(() => {
			before = new Map([...(row?.children ?? [])].map((s) => [s, s.getBoundingClientRect()]));
		});
	});

	$effect(() => {
		void recent?.join();
		untrack(() => {
			if (prefersReducedMotion()) return;
			for (const swatch of [...(row?.children ?? [])] as HTMLElement[]) {
				const from = before.get(swatch);
				if (!from) continue;
				const dx = from.left - swatch.getBoundingClientRect().left;
				if (!dx) continue;
				swatch.style.transition = 'none';
				swatch.style.translate = `${dx}px 0`;
				void swatch.offsetWidth;
				swatch.style.transition = '';
				swatch.style.translate = '';
			}
		});
	});

	/** Brightness falls toward the bottom and saturation toward the left, over the hue. */
	const padShading =
		'linear-gradient(to top, black, transparent), linear-gradient(to right, white, transparent)';
	const hueStops = Array.from({ length: 7 }, (_, i) => `hsl(${i * 60} 100% 50%)`).join(', ');
	// Tokens rather than raw greys, so transparency reads right in both themes.
	const checker =
		'background-image: repeating-conic-gradient(var(--border) 0 25%, var(--background) 0 50%); background-size: 8px 8px';

	// A thumb sits on arbitrary colors, so it wears a white rim and a dark
	// hairline that contrast with all of them, not with the theme. It grows a
	// touch while held so you can tell you have hold of it.
	const thumb =
		'pointer-events-none absolute size-5 -translate-1/2 overflow-hidden rounded-full border-2 border-white shadow-sm ring-1 ring-black/15 transition-[scale] duration-(--duration-fast) ease-out group-active:scale-110 motion-reduce:transition-none';
	const focusRing =
		'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card';
	// Keeps a color's edge visible against a card of the same color.
	const hairline = 'ring-1 ring-inset ring-foreground/10';
</script>

{#snippet channel(
	label: string,
	max: number,
	fraction: number,
	track: string,
	thumbFill: string,
	valueText: string,
	set: (f: number) => void,
	step: number,
	checkered: boolean
)}
	<div
		role="slider"
		tabindex="0"
		aria-label={label}
		aria-valuemin={0}
		aria-valuemax={max}
		aria-valuenow={Math.round(fraction * max)}
		aria-valuetext={valueText}
		aria-orientation="horizontal"
		class={cn('group relative h-7 cursor-pointer touch-none rounded-full select-none', focusRing)}
		{@attach drag((x) => set(x), 10)}
		onkeydown={(event) => channelKey(event, fraction, step, set)}
		onblur={settle}
	>
		<span
			class="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-full"
			style={checkered ? checker : undefined}
		>
			<span class={cn('absolute inset-0 rounded-full', hairline)} style:background-image={track}
			></span>
		</span>
		<!-- The rail stops half a thumb from each end so the thumb never overhangs. -->
		<span class="pointer-events-none absolute inset-y-0 right-2.5 left-2.5">
			<span
				class={thumb}
				style:left="{fraction * 100}%"
				style:top="50%"
				style={checkered ? checker : undefined}
			>
				<span class="absolute inset-0" style:background-color={thumbFill}></span>
			</span>
		</span>
	</div>
{/snippet}

<div
	{...restProps}
	bind:this={ref}
	data-slot="color-picker"
	class={cn('bg-card flex w-full max-w-xs flex-col gap-3 rounded-2xl p-3 shadow-md', className)}
>
	<div
		role="slider"
		tabindex="0"
		aria-label="Saturation and brightness"
		aria-roledescription="2D slider"
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={Math.round(color.s * 100)}
		aria-valuetext="Saturation {Math.round(color.s * 100)}%, brightness {Math.round(
			color.v * 100
		)}%"
		class={cn('group relative h-44 cursor-crosshair touch-none rounded-xl select-none', focusRing)}
		style:background-color="hsl({color.h} 100% 50%)"
		style:background-image={padShading}
		{@attach drag((x, y) => update({ s: x, v: 1 - y }))}
		onkeydown={onPadKey}
		onblur={settle}
	>
		<span class={cn('pointer-events-none absolute inset-0 rounded-xl', hairline)}></span>
		<span
			class={thumb}
			style:left="{color.s * 100}%"
			style:top="{(1 - color.v) * 100}%"
			style:background-color="rgb({rgb})"
		></span>
	</div>

	<div class="flex items-center gap-3">
		<div class="flex min-w-0 flex-1 flex-col gap-1">
			{@render channel(
				'Hue',
				360,
				color.h / 360,
				`linear-gradient(to right, ${hueStops})`,
				`hsl(${color.h} 100% 50%)`,
				`${Math.round(color.h)} degrees`,
				(f) => update({ h: f * 360 }),
				1 / 360,
				false
			)}
			{#if alpha}
				{@render channel(
					'Opacity',
					100,
					color.a,
					`linear-gradient(to right, rgb(${rgb} / 0), rgb(${rgb}))`,
					`rgb(${rgb} / ${color.a})`,
					`${Math.round(color.a * 100)}%`,
					(f) => update({ a: f }),
					0.01,
					true
				)}
			{/if}
		</div>
		<span
			aria-hidden="true"
			class="relative size-11 shrink-0 overflow-hidden rounded-xl"
			style={checker}
		>
			<span
				class={cn('absolute inset-0 rounded-xl', hairline)}
				style:background-color="rgb({rgb} / {color.a})"
			></span>
		</span>
	</div>

	<div class="flex gap-2">
		<!-- Hex reads left to right in any language, with its # in front. -->
		<label
			for="{uid}-hex"
			dir="ltr"
			class={cn(
				'bg-control flex h-9 min-w-0 flex-1 cursor-text items-center rounded-full px-3 font-mono text-sm transition-[box-shadow] duration-(--duration-fast) ease-out focus-within:ring-2',
				invalid ? 'ring-destructive ring-2' : 'focus-within:ring-ring'
			)}
		>
			<span
				class={cn(
					'transition-[color] duration-(--duration-fast) ease-out select-none',
					invalid ? 'text-destructive' : 'text-muted-foreground'
				)}
			>
				#
			</span>
			<input
				id="{uid}-hex"
				aria-label="Hex color"
				aria-invalid={invalid}
				aria-describedby={invalid ? `${uid}-invalid` : undefined}
				value={draft ?? hex.slice(1)}
				maxlength={9}
				spellcheck={false}
				autocomplete="off"
				autocapitalize="characters"
				class="text-foreground min-w-0 flex-1 bg-transparent ps-0.5 outline-none"
				onfocus={(event) => {
					draft = hex.slice(1);
					event.currentTarget.select();
				}}
				oninput={(event) => {
					draft = event.currentTarget.value;
					invalid = false;
				}}
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						applyHex(false);
					} else if (event.key === 'Escape' && (draft !== hex.slice(1) || invalid)) {
						event.preventDefault();
						draft = hex.slice(1);
						invalid = false;
					}
				}}
				onblur={() => applyHex(true)}
			/>
		</label>
		{#if alpha}
			<span
				aria-hidden="true"
				class="bg-secondary text-muted-foreground flex h-9 w-14 shrink-0 items-center justify-center rounded-full font-mono text-sm tabular-nums select-none"
			>
				{Math.round(color.a * 100)}%
			</span>
		{/if}
	</div>
	<span id="{uid}-invalid" class="sr-only" aria-live="polite">
		{invalid ? 'Not a valid hex color' : ''}
	</span>

	{#if swatches}
		<div class="flex flex-col gap-2 pt-1">
			<p id="{uid}-recent" class="text-muted-foreground text-xs select-none">Recent</p>
			<div
				bind:this={row}
				role="group"
				aria-labelledby="{uid}-recent"
				class="relative flex flex-wrap gap-2"
			>
				{#each swatches as swatch (swatch.toUpperCase())}
					{@const pressed = active === swatch.toUpperCase()}
					<button
						type="button"
						aria-label="Use {swatch.toUpperCase()}"
						aria-pressed={pressed}
						class={cn(
							'ring-offset-card relative size-7 shrink-0 touch-manipulation rounded-full select-none active:scale-[0.96]',
							'[transition:translate_var(--duration-spring-snappy)_var(--ease-spring-snappy),scale_var(--duration-fast)_var(--ease-out),box-shadow_var(--duration-fast)_var(--ease-out)] motion-reduce:transition-[box-shadow]',
							'focus-visible:outline-ring outline-none focus-visible:outline-2 focus-visible:outline-offset-4',
							// A 36px hit area; with the 8px gap neighbours meet but never overlap.
							'after:absolute after:-inset-1 after:rounded-full',
							pressed ? 'ring-primary ring-2 ring-offset-2' : 'ring-0'
						)}
						style={checker}
						onclick={() => useRecent(swatch)}
						in:enter
					>
						<span
							class={cn('absolute inset-0 rounded-full', hairline)}
							style:background-color={swatch}
						></span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
