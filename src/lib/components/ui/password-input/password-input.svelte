<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { tick, untrack } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { duration as durations, prefersReducedMotion, stagger } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';
	import Eye from './password-input-eye.svelte';
	import { passwordStrength, textMeasurer } from './strength.js';

	type Requirement = {
		/** What the password needs, such as "A number". */
		label: string;
		/** True once the password meets it. */
		test: (password: string) => boolean;
	};

	type Props = Omit<HTMLInputAttributes, 'type' | 'value' | 'children' | 'class'> & {
		/** The password. Bindable. */
		value?: string;
		/** Shows the password as text. Bindable. */
		revealed?: boolean;
		/** Called when the eye button shows or hides the password. */
		onRevealedChange?: (revealed: boolean) => void;
		/** Called with every edit. */
		onValueChange?: (value: string) => void;
		/**
		 * Shows a four-step meter and a verdict (Weak, Good, Strong) under the
		 * field. The verdict is announced once typing pauses.
		 */
		strength?: boolean;
		/** A checklist under the field that ticks off as the password meets each item. */
		requirements?: Requirement[];
		/** Warns, with a keycap in the field and a line under it, while Caps Lock is on. */
		capsLockWarning?: boolean;
		/** Marks the field invalid. */
		invalid?: boolean;
		/** The input element. */
		ref?: HTMLInputElement | null;
		/** Classes for the wrapper around the field and its extras. */
		class?: string;
	};

	let {
		value = $bindable(''),
		revealed = $bindable(false),
		onRevealedChange,
		onValueChange,
		strength = false,
		requirements,
		capsLockWarning = true,
		invalid = false,
		ref = $bindable(null),
		id,
		disabled,
		autocomplete,
		class: className,
		...restProps
	}: Props = $props();

	const uid = $props.id();
	const inputId = $derived(id ?? `${uid}-input`);
	const capsId = `${uid}-caps`;
	const requirementsId = `${uid}-requirements`;

	/** A burst of typing settles before the verdict is read out. */
	const announceDelay = durations.ambient / 2;
	/** The reveal wave across the word never takes longer than this, however long the password. */
	const waveSpan = durations.fast;

	// Caps Lock. Every key and pointer event carries the lock state, including
	// the Caps Lock key's own, so the field stays right without polling.
	let caps = $state(false);
	let focused = $state(false);
	const warnCaps = $derived(capsLockWarning && caps && focused);

	function readCaps(event: KeyboardEvent | PointerEvent) {
		caps = event.getModifierState?.('CapsLock') ?? false;
	}

	// The reveal: each dot slides out to where its letter sits and resolves
	// into it, left to right like reading; hiding runs it back from the right
	// and the dots close ranks.
	type Morph = {
		id: number;
		reveal: boolean;
		chars: string[];
		/** Left edge of each character as text, and as a password dot. */
		letterX: number[];
		dotX: number[];
	};
	let morph = $state<Morph | null>(null);
	let morphTimer: ReturnType<typeof setTimeout> | undefined;
	let morphs = 0;

	function startMorph(reveal: boolean) {
		clearTimeout(morphTimer);
		morph = null;
		const input = ref;
		const chars = [...value];
		// The overlay only knows where characters sit when the field starts at
		// its first one and nothing is scrolled out of view.
		if (
			!input ||
			prefersReducedMotion() ||
			chars.length === 0 ||
			input.scrollWidth > input.clientWidth ||
			input.scrollLeft > 0
		)
			return;
		const measure = textMeasurer(input);
		if (!measure) return;
		const dot = measure('•');
		const letterX = chars.map((_, index) => measure(chars.slice(0, index).join('')));
		morph = { id: ++morphs, reveal, chars, letterX, dotX: chars.map((_, index) => index * dot) };
		morphTimer = setTimeout(() => (morph = null), durations.base + waveSpan);
	}

	const waveStep = $derived(
		morph ? Math.min(stagger / 2, waveSpan / Math.max(morph.chars.length - 1, 1)) : 0
	);

	async function toggle() {
		const input = ref;
		const selection =
			input && input.selectionStart !== null && input.selectionEnd !== null
				? ([input.selectionStart, input.selectionEnd] as const)
				: null;
		const next = !revealed;
		revealed = next;
		onRevealedChange?.(next);
		startMorph(next);
		// Switching the type can reset the caret in some browsers; put it back.
		await tick();
		if (input && selection && document.activeElement === input) {
			input.setSelectionRange(selection[0], selection[1]);
		}
	}

	// Strength.
	const score = $derived(passwordStrength(value));
	const verdicts = ['Weak', 'Good', 'Strong'] as const;
	const verdict = $derived((['', 'Weak', 'Good', 'Good', 'Strong'] as const)[score]);
	/** Weak is the one level worth alarm; past that, the meter just gets bolder. */
	const levelColors = ['', 'bg-destructive', 'bg-primary/35', 'bg-primary/65', 'bg-primary'];
	/**
	 * The score before the latest change, so only segments that change are
	 * staggered: left to right as the meter fills, right to left as it drains.
	 */
	let scoreFrom = $state(untrack(() => score));
	let scoreNow = untrack(() => score);
	$effect.pre(() => {
		const next = score;
		untrack(() => {
			if (next === scoreNow) return;
			scoreFrom = scoreNow;
			scoreNow = next;
		});
	});

	function segmentDelay(segment: number) {
		const step =
			score > scoreFrom ? segment - scoreFrom - 1 : segment > score ? scoreFrom - segment : 0;
		return Math.max(0, step) * ((stagger * 2) / 3);
	}

	let announced = $state('');
	$effect(() => {
		if (!strength) return;
		const word = verdict;
		const timer = setTimeout(
			() => (announced = word ? `Password strength: ${word}` : ''),
			announceDelay
		);
		return () => clearTimeout(timer);
	});

	$effect(() => () => clearTimeout(morphTimer));

	const describedBy = $derived(
		[restProps['aria-describedby'], warnCaps && capsId, requirements?.length && requirementsId]
			.filter(Boolean)
			.join(' ') || undefined
	);

	// Icons arriving spring up out of a blur; leaving ones drop away faster.
	const iconShown =
		'scale-100 opacity-100 blur-none [transition:scale_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-fast)_var(--ease-out),filter_var(--duration-fast)_var(--ease-out)]';
	const iconHidden =
		'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-instant) ease-in motion-reduce:scale-100 motion-reduce:blur-none';
</script>

<div class={cn('flex w-full flex-col', className)}>
	<div class="relative">
		<input
			{...restProps}
			bind:this={ref}
			bind:value
			id={inputId}
			type={revealed ? 'text' : 'password'}
			autocomplete={autocomplete ??
				(strength || requirements?.length ? 'new-password' : 'current-password')}
			autocapitalize="off"
			spellcheck={false}
			{disabled}
			aria-invalid={invalid || restProps['aria-invalid'] || undefined}
			aria-describedby={describedBy}
			oninput={(event) => {
				// Typing wins over the flourish: the real text shows at once.
				clearTimeout(morphTimer);
				morph = null;
				onValueChange?.(event.currentTarget.value);
				restProps.oninput?.(event);
			}}
			onkeydown={(event) => {
				readCaps(event);
				restProps.onkeydown?.(event);
			}}
			onkeyup={(event) => {
				readCaps(event);
				restProps.onkeyup?.(event);
			}}
			onpointerdown={(event) => {
				readCaps(event);
				restProps.onpointerdown?.(event);
			}}
			onfocus={(event) => {
				focused = true;
				restProps.onfocus?.(event);
			}}
			onblur={(event) => {
				focused = false;
				restProps.onblur?.(event);
			}}
			class={cn(
				'bg-control text-foreground placeholder:text-muted-foreground focus-visible:ring-ring aria-invalid:ring-destructive caret-foreground flex h-10 w-full rounded-full pl-4 text-base transition-[box-shadow] duration-(--duration-base) outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 sm:text-sm',
				// Room for the eye, and the keycap when it can appear, so the text
				// never shifts when the keycap arrives.
				capsLockWarning ? 'pr-[4.75rem]' : 'pr-11',
				// The overlay draws the characters while it runs; the caret stays.
				morph && 'text-transparent'
			)}
		/>

		{#if morph}
			{#key morph.id}
				<span
					aria-hidden="true"
					class={cn(
						'text-foreground pointer-events-none absolute inset-y-0 left-4 overflow-hidden text-base whitespace-pre sm:text-sm',
						capsLockWarning ? 'right-[4.75rem]' : 'right-11'
					)}
				>
					{#each morph.chars as char, index (index)}
						{@const order = morph.reveal ? index : morph.chars.length - 1 - index}
						<!-- Left-aligned, so the dot and the letter share the left edge the
						     measurements describe. -->
						<span
							class="pw-glyph"
							style:--pw-from="{morph.reveal ? morph.dotX[index] : morph.letterX[index]}px"
							style:--pw-to="{morph.reveal ? morph.letterX[index] : morph.dotX[index]}px"
							style:--pw-delay="{order * waveStep}ms"
						>
							<span class={morph.reveal ? 'pw-show' : 'pw-hide'}>{char}</span>
							<span class={morph.reveal ? 'pw-hide' : 'pw-show'}>•</span>
						</span>
					{/each}
				</span>
			{/key}
		{/if}

		{#if capsLockWarning}
			<!-- A little Caps Lock key slides in beside the eye, its light on. -->
			<span
				aria-hidden="true"
				class={cn(
					'bg-muted pointer-events-none absolute top-1/2 right-10 flex h-[1.375rem] w-[1.875rem] -translate-y-1/2 flex-col justify-between rounded-[0.3125rem] px-1 py-[0.1875rem] shadow-[0_1.5px_0_0_var(--border-strong)]',
					warnCaps
						? 'translate-x-0 opacity-100 blur-none [transition:translate_var(--duration-spring)_var(--ease-spring),opacity_var(--duration-fast)_var(--ease-out),filter_var(--duration-fast)_var(--ease-out)]'
						: 'translate-x-2 opacity-0 blur-[3px] transition-[translate,opacity,filter] duration-(--duration-fast) ease-in motion-reduce:translate-x-0 motion-reduce:blur-none'
				)}
			>
				<span
					class={cn(
						'block size-1 rounded-full transition-[background-color,box-shadow] duration-(--duration-slow) ease-out',
						warnCaps ? 'bg-success shadow-[0_0_4px_1px_var(--success)]' : 'bg-muted-foreground/30'
					)}
				></span>
				<svg
					viewBox="0 0 12 10"
					fill="none"
					stroke="currentColor"
					stroke-width="1.1"
					stroke-linejoin="round"
					stroke-linecap="round"
					class="text-foreground/70 h-[0.5625rem] w-[0.6875rem] self-center"
				>
					<path d="M6 1 2 5h2v1.5h4V5h2L6 1Z" />
					<path d="M4 8.75h4" />
				</svg>
			</span>
		{/if}

		<button
			type="button"
			aria-label="Show password"
			aria-pressed={revealed}
			aria-controls={inputId}
			{disabled}
			onpointerdown={(event) => {
				// A mouse click keeps focus, and the caret, in the field so typing
				// carries on. Keyboard users keep focus on the button.
				if (event.pointerType === 'mouse') event.preventDefault();
			}}
			onclick={toggle}
			class={cn(
				'text-muted-foreground hover:text-foreground hover:bg-foreground/8 focus-visible:ring-ring absolute top-1 right-1 inline-grid size-8 touch-manipulation place-items-center rounded-full transition-[background-color,color,scale] duration-(--duration-fast) ease-out outline-none select-none focus-visible:ring-2 active:scale-[0.92] disabled:pointer-events-none motion-reduce:transition-[background-color,color]',
				revealed && 'text-foreground'
			)}
		>
			<Eye open={revealed} input={ref} />
		</button>
	</div>

	{#if capsLockWarning}
		<!-- Grid rows from 0fr to 1fr give a real height change without measuring. -->
		<div
			class={cn(
				'grid transition-[grid-template-rows] ease-out motion-reduce:transition-none',
				warnCaps
					? 'grid-rows-[1fr] duration-(--duration-base)'
					: 'grid-rows-[0fr] duration-(--duration-fast)'
			)}
		>
			<div class="min-h-0 overflow-hidden">
				<p
					id={capsId}
					class={cn(
						'text-muted-foreground pt-1.5 pl-4 text-xs transition-[opacity,translate] ease-out motion-reduce:transition-opacity',
						warnCaps
							? 'translate-y-0 opacity-100 duration-(--duration-base)'
							: '-translate-y-0.5 opacity-0 duration-(--duration-fast) motion-reduce:translate-y-0'
					)}
				>
					Caps Lock is on
				</p>
			</div>
		</div>
		<span class="sr-only" aria-live="polite">{warnCaps ? 'Caps Lock is on' : ''}</span>
	{/if}

	{#if strength}
		<div class="mt-3 flex items-center gap-3 px-1" aria-hidden="true">
			<div class="flex flex-1 gap-1.5">
				{#each [1, 2, 3, 4] as segment (segment)}
					<span class="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
						<span
							style:transition-delay={prefersReducedMotion() ? '0ms' : `${segmentDelay(segment)}ms`}
							class={cn(
								'block h-full origin-left rounded-full transition-[scale,opacity,background-color] duration-(--duration-base) ease-out motion-reduce:transition-[opacity,background-color]',
								segment <= score
									? cn('scale-x-100 opacity-100', levelColors[score])
									: 'scale-x-0 opacity-0 motion-reduce:scale-x-100'
							)}
						></span>
					</span>
				{/each}
			</div>
			<!-- Every verdict shares one cell, so the row keeps the width of the
			     longest and never jumps. -->
			<span class="grid w-14 text-right text-sm font-medium">
				{#each verdicts as word (word)}
					<span
						class={cn(
							'col-start-1 row-start-1 transition-[opacity,filter] ease-out',
							word === verdict
								? 'opacity-100 blur-none duration-(--duration-base)'
								: 'opacity-0 blur-[4px] duration-(--duration-fast) ease-in',
							word === 'Weak' ? 'text-destructive' : 'text-foreground'
						)}>{word}</span
					>
				{/each}
			</span>
		</div>
		<span class="sr-only" aria-live="polite">{announced}</span>
	{/if}

	{#if requirements?.length}
		<ul id={requirementsId} class="mt-3 flex flex-col gap-2 px-1">
			{#each requirements as requirement (requirement.label)}
				{@const met = requirement.test(value)}
				<li
					class={cn(
						'flex items-center gap-2 text-sm transition-colors duration-(--duration-fast) ease-out',
						met ? 'text-foreground' : 'text-muted-foreground'
					)}
				>
					<span class="grid size-4 shrink-0 place-items-center" aria-hidden="true">
						<span
							class={cn(
								'col-start-1 row-start-1 size-1 rounded-full bg-current',
								met ? iconHidden : iconShown
							)}
						></span>
						<Check class={cn('col-start-1 row-start-1 size-4', met ? iconShown : iconHidden)} />
					</span>
					<span>{requirement.label}<span class="sr-only">{met ? ', met' : ', not met'}</span></span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	/* Per character a quick swap; the wave across the word is capped, so the
	   whole gesture reads as one sweep. */
	.pw-glyph {
		position: absolute;
		inset-block: 0;
		left: 0;
		display: grid;
		align-items: center;
		justify-items: start;
		animation: pw-slide var(--duration-base) var(--ease-out) var(--pw-delay) both;
	}
	.pw-glyph > * {
		grid-area: 1 / 1;
	}
	.pw-show {
		animation: pw-show var(--duration-base) var(--ease-out) var(--pw-delay) both;
	}
	.pw-hide {
		animation: pw-hide var(--duration-base) var(--ease-out) var(--pw-delay) both;
	}

	@keyframes pw-slide {
		from {
			translate: var(--pw-from) 0;
		}
		to {
			translate: var(--pw-to) 0;
		}
	}
	@keyframes pw-show {
		from {
			opacity: 0;
			filter: blur(4px);
			scale: 0.6;
		}
	}
	@keyframes pw-hide {
		to {
			opacity: 0;
			filter: blur(4px);
			scale: 0.6;
		}
	}
</style>
