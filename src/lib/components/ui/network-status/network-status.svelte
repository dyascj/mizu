<script lang="ts">
	import { untrack } from 'svelte';
	import { fade } from 'svelte/transition';
	import Wifi from '@lucide/svelte/icons/wifi';
	import WifiOff from '@lucide/svelte/icons/wifi-off';
	import { duration, easeIn, rise } from '$lib/components/ui/motion';
	import { cn } from '$lib/utils.js';

	type Status = 'online' | 'offline';

	type Props = {
		/** `pill` floats at the top center of its container; `inline` sits in the flow as a banner. */
		variant?: 'pill' | 'inline';
		/** Pin the pill to the top of the viewport, clear of the notch. */
		fixed?: boolean;
		/** Shown while the device has no connection. */
		offlineLabel?: string;
		/** Shown briefly when the connection returns. */
		onlineLabel?: string;
		/** Milliseconds the online message stays before hiding. */
		resetAfter?: number;
		/** Override the detected status, for previews and tests. */
		forceStatus?: 'online' | 'offline';
		class?: string;
	};

	let {
		variant = 'pill',
		fixed = false,
		offlineLabel = "You're offline. Changes will sync when you reconnect.",
		onlineLabel = 'Back online',
		resetAfter = 3000,
		forceStatus,
		class: className
	}: Props = $props();

	// Assume online until the browser says otherwise, so the server renders an
	// empty live region instead of a false alarm.
	let online = $state(true);
	let recovered = $state(false);

	const status = $derived<Status>(forceStatus ?? (online ? 'online' : 'offline'));
	const message = $derived(
		status === 'offline' ? offlineLabel : recovered ? onlineLabel : undefined
	);

	$effect(() => {
		online = navigator.onLine;
		const update = () => (online = navigator.onLine);
		window.addEventListener('online', update);
		window.addEventListener('offline', update);
		return () => {
			window.removeEventListener('online', update);
			window.removeEventListener('offline', update);
		};
	});

	// Coming back from offline shows the online message, then hides it.
	let wasOffline = false;
	$effect(() => {
		if (status === 'offline') {
			wasOffline = true;
			recovered = false;
			return;
		}
		if (!wasOffline) return;
		wasOffline = false;
		recovered = true;
		const timer = setTimeout(
			() => (recovered = false),
			untrack(() => resetAfter)
		);
		return () => clearTimeout(timer);
	});
</script>

<!-- The live region stays mounted so screen readers hear every change. -->
<div
	role="status"
	aria-live="polite"
	aria-atomic="true"
	class={cn(
		variant === 'pill' &&
			'pt-safe px-safe pointer-events-none inset-x-0 top-0 z-50 flex justify-center',
		variant === 'pill' && (fixed ? 'fixed' : 'absolute'),
		className
	)}
>
	{#if message}
		<div
			class={cn(
				'text-sm',
				variant === 'pill'
					? 'glass pointer-events-auto max-w-md rounded-3xl border py-2 pr-4 pl-3 shadow-lg'
					: 'bg-secondary rounded-2xl px-4 py-3'
			)}
			in:rise={{ y: variant === 'pill' ? -8 : 4, duration: duration.slow }}
			out:fade={{ duration: duration.fast, easing: easeIn }}
		>
			<!-- Swapping between offline and online crossfades in place. -->
			{#key status}
				<span class="flex items-center gap-2.5" in:fade={{ duration: duration.fast }}>
					{#if status === 'offline'}
						<WifiOff class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
					{:else}
						<Wifi class="size-4 shrink-0 text-[color:var(--success)]" aria-hidden="true" />
					{/if}
					<span class="text-foreground leading-snug text-balance">{message}</span>
				</span>
			{/key}
		</div>
	{/if}
</div>
