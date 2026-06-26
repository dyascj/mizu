<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	// The icon tint + bar color all derive from one `--toast` channel per variant,
	// mirroring how alert.svelte themes itself from `--alert`.
	export const toastVariants = tv({
		base: 'group glass-strong gloss pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border border-[color:var(--glass-border)] py-3.5 pl-4 pr-10 shadow-glass-lg',
		variants: {
			variant: {
				info: '[--toast:var(--info)]',
				success: '[--toast:var(--success)]',
				warning: '[--toast:var(--warning)]',
				error: '[--toast:var(--destructive)]'
			}
		},
		defaultVariants: { variant: 'info' }
	});

	export type ToastCardVariant = VariantProps<typeof toastVariants>['variant'];
</script>

<script lang="ts">
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import XCircleIcon from '@lucide/svelte/icons/circle-x';
	import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
	import InfoIcon from '@lucide/svelte/icons/info';
	import XIcon from '@lucide/svelte/icons/x';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils.js';
	import { toaster, type ToastData } from './toast-state.svelte.js';

	let { toast }: { toast: ToastData } = $props();

	const icons = {
		info: InfoIcon,
		success: CheckCircleIcon,
		warning: AlertTriangleIcon,
		error: XCircleIcon
	};
	const Icon = $derived(icons[toast.variant]);
</script>

<div
	role={toast.variant === 'error' ? 'alert' : 'status'}
	aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
	class={cn(toastVariants({ variant: toast.variant }))}
	onpointerenter={() => toaster.pause(toast.id)}
	onpointerleave={() => toaster.resume(toast.id)}
>
	<Icon class="relative z-10 mt-0.5 size-5 shrink-0 text-[color:var(--toast)]" />

	<div class="relative z-10 flex-1 pt-0.5">
		<p class="text-sm font-semibold text-foreground">{toast.title}</p>
		{#if toast.description}
			<p class="mt-0.5 text-sm text-muted-foreground">{toast.description}</p>
		{/if}
		{#if toast.action}
			<button
				class={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-2.5 h-7 px-3 text-xs')}
				onclick={() => {
					toast.action?.onclick();
					toaster.dismiss(toast.id);
				}}
			>
				<span class="relative z-10">{toast.action.label}</span>
			</button>
		{/if}
	</div>

	<button
		class="absolute right-2.5 top-2.5 z-20 inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground outline-none transition-[scale,background-color] duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96]"
		onclick={() => toaster.dismiss(toast.id)}
	>
		<XIcon class="size-3.5" />
		<span class="sr-only">Dismiss</span>
	</button>

	{#if toast.duration > 0}
		<!-- Remaining-time bar. Pauses with the dismiss timer on hover. -->
		<div
			class="mizu-toast-bar absolute inset-x-0 bottom-0 z-10 h-0.5 origin-left bg-[color:var(--toast)] opacity-70 group-hover:[animation-play-state:paused]"
			style="animation-duration: {toast.duration}ms;"
			aria-hidden="true"
		></div>
	{/if}
</div>

<style>
	.mizu-toast-bar {
		animation-name: mizu-toast-deplete;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
	}
	@keyframes mizu-toast-deplete {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.mizu-toast-bar {
			animation: none;
			opacity: 0;
		}
	}
</style>
