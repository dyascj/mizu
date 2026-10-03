<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Link from '@lucide/svelte/icons/link';
	import Mail from '@lucide/svelte/icons/mail';
	import Share from '@lucide/svelte/icons/share';
	import X from '@lucide/svelte/icons/x';
	import { onMount, tick, untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { prefersReducedMotion } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The link to share. */
		url: string;
		/** What is being shared. Names the targets group and fills the post and email. */
		title: string;
		/** The trigger's label. */
		label?: string;
		/** Whether the targets are showing. */
		open?: boolean;
		/** Called with the link after the clipboard accepts it. */
		onCopy?: (url: string) => void;
		/** How long "Copied" shows, in milliseconds. */
		timeout?: number;
		/** Name of the targets group. Defaults to "Share" and the title. */
		groupLabel?: string;
		/** Name of the copy button. */
		copyLabel?: string;
		/** Name of the copy button once the link is copied. Also announced. */
		copiedLabel?: string;
		/** The word that grows beside the check after copying. */
		copiedText?: string;
		/** Announced when the clipboard refuses. */
		failedLabel?: string;
		/** Name of the link that posts on X. */
		postLabel?: string;
		/** Name of the email link. */
		emailLabel?: string;
		/** Name of the button that opens the system share sheet, where there is one. */
		moreLabel?: string;
		/** Name of the button that folds the targets away. */
		closeLabel?: string;
		/** The pill element. */
		ref?: HTMLDivElement | null;
		/** Classes for the pill. */
		class?: string;
	};

	let {
		url,
		title,
		label = 'Share',
		open = $bindable(false),
		onCopy,
		timeout = 1800,
		groupLabel,
		copyLabel = 'Copy link',
		copiedLabel = 'Link copied',
		copiedText = 'Copied',
		failedLabel = "Couldn't copy the link",
		postLabel = 'Post on X',
		emailLabel = 'Email',
		moreLabel = 'More ways to share',
		closeLabel = 'Close',
		ref = $bindable(null),
		class: className,
		...restProps
	}: Props = $props();

	const uid = $props.id();
	const groupId = `${uid}-targets`;

	let copied = $state(false);
	let failed = $state(false);
	/** The system share sheet, where the platform has one. Read after mount, so SSR stays stable. */
	let native = $state(false);
	let trigger = $state<HTMLButtonElement | null>(null);
	let first = $state<HTMLButtonElement | null>(null);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		native = typeof navigator.share === 'function';
	});

	/** Opens or closes, keeping focus with the pill when it was already inside. */
	async function toggle(next: boolean) {
		const hadFocus = !!ref && ref.contains(document.activeElement);
		open = next;
		copied = false;
		failed = false;
		clearTimeout(copyTimer);
		await tick();
		if (hadFocus) (next ? first : trigger)?.focus();
	}

	// Closes on Escape or a press anywhere else.
	$effect(() => {
		if (!open) return;
		const onpointerdown = (event: PointerEvent) => {
			if (!ref?.contains(event.target as Node)) toggle(false);
		};
		const onkeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') toggle(false);
		};
		document.addEventListener('pointerdown', onpointerdown);
		document.addEventListener('keydown', onkeydown);
		return () => {
			document.removeEventListener('pointerdown', onpointerdown);
			document.removeEventListener('keydown', onkeydown);
		};
	});

	async function copy() {
		clearTimeout(copyTimer);
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			failed = false;
			onCopy?.(url);
		} catch {
			copied = false;
			failed = true;
		}
		copyTimer = setTimeout(() => {
			copied = false;
			failed = false;
		}, timeout);
	}

	function shareNatively() {
		navigator.share({ title, url }).catch(() => {});
	}

	// The pill reshapes around whichever face is showing. It pins its current
	// width, lets the new face size it, and eases between the two on a spring
	// with no bounce, so its clipped edge never swings past the icons.
	let from = 0;
	let reshaped = false;
	$effect.pre(() => {
		void open;
		untrack(() => (from = ref?.offsetWidth ?? 0));
	});
	$effect(() => {
		void open;
		untrack(() => {
			const node = ref;
			if (!node || !reshaped) {
				reshaped = true;
				return;
			}
			node.style.width = '';
			const to = node.offsetWidth;
			if (prefersReducedMotion() || !from || from === to) return;
			node.style.width = `${from}px`;
			void node.offsetWidth;
			node.style.width = `${to}px`;
		});
	});

	$effect(() => () => clearTimeout(copyTimer));

	const text = $derived(encodeURIComponent(title));
	const link = $derived(encodeURIComponent(url));

	// The arriving face resolves out of a blur a beat after the pill starts to
	// move; the leaving one drops out of the flow at once and fades faster.
	const faceShown =
		'relative opacity-100 blur-none transition-[opacity,filter] delay-(--stagger) duration-(--duration-base) ease-out';
	const faceHidden =
		'pointer-events-none absolute top-0 start-0 opacity-0 blur-[4px] transition-[opacity,filter] duration-(--duration-instant) ease-in';
	const target =
		'text-foreground hover:bg-control focus-visible:ring-ring inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full transition-[background-color,color,scale] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2 focus-visible:ring-inset active:scale-[0.96] [&_svg]:size-4';
</script>

<div
	{...restProps}
	bind:this={ref}
	data-state={open ? 'open' : 'closed'}
	ontransitionend={(event) => {
		if (event.currentTarget === event.target && event.propertyName === 'width')
			event.currentTarget.style.width = '';
	}}
	class={cn(
		'bg-secondary text-secondary-foreground relative inline-flex h-11 max-w-full items-center overflow-hidden rounded-full [transition:width_var(--duration-spring-snappy)_var(--ease-spring-snappy)]',
		className
	)}
>
	<button
		bind:this={trigger}
		type="button"
		aria-expanded={open}
		aria-controls={groupId}
		inert={open}
		onclick={() => toggle(true)}
		class={cn(
			'focus-visible:ring-ring flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-inset active:scale-[0.96] [&_svg]:size-4',
			open ? faceHidden : faceShown
		)}
	>
		<Share aria-hidden="true" />
		{label}
	</button>

	<div
		id={groupId}
		role="group"
		aria-label={groupLabel ?? `Share ${title}`}
		inert={!open}
		class={cn('flex shrink-0 items-center gap-0.5 p-1', open ? faceShown : faceHidden)}
	>
		<!-- Copy grows a word when it lands, inside the pill. -->
		<button
			bind:this={first}
			type="button"
			aria-label={copied ? copiedLabel : copyLabel}
			onclick={copy}
			class={cn(target, 'px-2.5')}
		>
			<span class="grid place-items-center [&>*]:col-start-1 [&>*]:row-start-1">
				<Link
					aria-hidden="true"
					class={copied
						? 'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in'
						: 'scale-100 opacity-100 blur-none transition-[scale,opacity,filter] duration-(--duration-base) ease-out'}
				/>
				<Check
					aria-hidden="true"
					class={copied
						? 'scale-100 opacity-100 blur-none transition-[scale,opacity,filter] duration-(--duration-base) ease-out'
						: 'scale-25 opacity-0 blur-[4px] transition-[scale,opacity,filter] duration-(--duration-fast) ease-in'}
				/>
			</span>
			<span
				aria-hidden="true"
				class={cn(
					'grid [transition:grid-template-columns_var(--duration-spring-snappy)_var(--ease-spring-snappy),opacity_var(--duration-base)_var(--ease-out),filter_var(--duration-base)_var(--ease-out)]',
					copied ? 'grid-cols-[1fr] opacity-100 blur-none' : 'grid-cols-[0fr] opacity-0 blur-[4px]'
				)}
			>
				<span class="min-w-0 overflow-hidden text-sm font-medium whitespace-nowrap">
					<span class="ps-1.5">{copiedText}</span>
				</span>
			</span>
		</button>
		<a
			href="https://x.com/intent/post?text={text}&url={link}"
			target="_blank"
			rel="noreferrer"
			aria-label={postLabel}
			class={target}
		>
			<!-- The brand's own mark, filled and a touch smaller so its weight sits with the strokes. -->
			<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="size-3.5!">
				<path
					d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
				/>
			</svg>
		</a>
		<a href="mailto:?subject={text}&body={link}" aria-label={emailLabel} class={target}>
			<Mail aria-hidden="true" />
		</a>
		{#if native}
			<button type="button" aria-label={moreLabel} onclick={shareNatively} class={target}>
				<Ellipsis aria-hidden="true" />
			</button>
		{/if}
		<button
			type="button"
			aria-label={closeLabel}
			onclick={() => toggle(false)}
			class={cn(target, 'text-muted-foreground hover:text-foreground ms-1')}
		>
			<X aria-hidden="true" />
		</button>
	</div>
	<span class="sr-only" aria-live="polite">
		{copied ? copiedLabel : failed ? failedLabel : ''}
	</span>
</div>
