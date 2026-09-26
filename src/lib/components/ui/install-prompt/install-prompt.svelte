<script lang="ts" module>
	/** Chromium's install event. Not in the DOM typings because it is not standardized. */
	export type BeforeInstallPromptEvent = Event & {
		prompt(): Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
	};

	function isStandalone() {
		return (
			window.matchMedia?.('(display-mode: standalone)').matches ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true
		);
	}

	// iPadOS reports itself as a Mac, so touch support tells them apart.
	function isIos() {
		const ua = navigator.userAgent;
		return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
	}

	// Storage throws in some private modes and sandboxed iframes; treat that as
	// "never dismissed" rather than failing to render.
	function wasDismissed(key: string) {
		try {
			return localStorage.getItem(key) !== null;
		} catch {
			return false;
		}
	}

	function rememberDismissal(key: string) {
		try {
			// A timestamp lets the app decide to ask again later.
			localStorage.setItem(key, String(Date.now()));
		} catch {
			// Dismissal still applies for this visit.
		}
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade } from 'svelte/transition';
	import Download from '@lucide/svelte/icons/download';
	import Share from '@lucide/svelte/icons/share';
	import { Button } from '$lib/components/ui/button';
	import { duration, easeIn, pop } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Props = {
		/** Headline, usually "Install" and the app name. */
		title?: string;
		/** One line on why installing helps. */
		description?: string;
		/** The app icon. Defaults to a neutral download tile. */
		icon?: Snippet;
		/** Remember a dismissal in localStorage under this key and stay hidden on later visits. */
		storageKey?: string;
		/** Called after the browser's install dialog closes, with the person's choice. */
		onInstall?: (outcome: 'accepted' | 'dismissed') => void;
		/** Called when the person chooses "Not now". */
		onDismiss?: () => void;
		/** Show the card even when the browser has not offered installation, for previews and docs. */
		forceVisible?: boolean;
		class?: string;
	};

	let {
		title = 'Install the app',
		description = 'Open it from your home screen, like any other app.',
		icon,
		storageKey,
		onInstall,
		onDismiss,
		forceVisible = false,
		class: className
	}: Props = $props();

	const id = $props.id();

	// Everything below is decided in the browser. The server renders nothing,
	// so the card never flashes before hydration can check eligibility.
	let mounted = $state(false);
	let standalone = $state(false);
	let ios = $state(false);
	let remembered = $state(false);
	let closed = $state(false);
	let deferred = $state<BeforeInstallPromptEvent | null>(null);

	const eligible = $derived(!standalone && !remembered && (deferred !== null || ios));
	const visible = $derived(mounted && !closed && (forceVisible || eligible));
	const instructions = $derived(ios && !deferred);

	$effect(() => {
		standalone = isStandalone();
		ios = isIos();
		remembered = storageKey ? wasDismissed(storageKey) : false;
		mounted = true;

		const capture = (event: Event) => {
			// Keep the browser's mini-infobar away; the card is the invitation.
			event.preventDefault();
			deferred = event as BeforeInstallPromptEvent;
		};
		const installed = () => {
			deferred = null;
			closed = true;
		};
		window.addEventListener('beforeinstallprompt', capture);
		window.addEventListener('appinstalled', installed);
		return () => {
			window.removeEventListener('beforeinstallprompt', capture);
			window.removeEventListener('appinstalled', installed);
		};
	});

	async function install() {
		const event = deferred;
		// A captured prompt can only be shown once.
		deferred = null;
		closed = true;
		if (!event) return;
		try {
			await event.prompt();
			const { outcome } = await event.userChoice;
			onInstall?.(outcome);
		} catch {
			// The browser refused to show the dialog; the card is already gone.
		}
	}

	function dismiss() {
		closed = true;
		if (storageKey) rememberDismissal(storageKey);
		onDismiss?.();
	}
</script>

{#if visible}
	<section
		aria-labelledby="{id}-title"
		aria-describedby="{id}-description"
		class={cn('bg-card w-full max-w-sm rounded-3xl p-4 shadow-lg', className)}
		in:pop
		out:fade={{ duration: duration.fast, easing: easeIn }}
	>
		<div class="flex items-start gap-3.5">
			<div class="shrink-0">
				{#if icon}
					{@render icon()}
				{:else}
					<span
						class="bg-secondary text-foreground flex size-12 items-center justify-center rounded-[0.875rem]"
						aria-hidden="true"
					>
						<Download class="size-5" />
					</span>
				{/if}
			</div>
			<div class="min-w-0 flex-1 pt-0.5">
				<p id="{id}-title" class="text-foreground text-[0.9375rem] font-semibold tracking-tight">
					{title}
				</p>
				<p id="{id}-description" class="text-muted-foreground mt-0.5 text-sm leading-snug">
					{description}
				</p>
			</div>
		</div>
		{#if instructions}
			<p
				class="bg-secondary text-muted-foreground mt-4 rounded-2xl px-3.5 py-3 text-sm leading-snug"
			>
				Tap
				<span class="text-foreground font-medium whitespace-nowrap"
					><Share class="mx-0.5 inline size-4 -translate-y-px" aria-hidden="true" /> Share</span
				>, then
				<span class="text-foreground font-medium whitespace-nowrap">Add to Home Screen</span>.
			</p>
		{/if}
		<div class="mt-4 flex justify-end gap-2">
			<Button variant="ghost" size="sm" onclick={dismiss}>Not now</Button>
			{#if !instructions}
				<Button size="sm" onclick={install}>Install</Button>
			{/if}
		</div>
	</section>
{/if}
