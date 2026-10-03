<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const sheetVariants = tv({
		base: 'bg-popover fixed z-50 flex overflow-y-auto flex-col gap-4 border-border p-6 shadow-xl transition-[translate,opacity] duration-(--duration-base) ease-out data-ending-style:duration-(--duration-fast) data-ending-style:ease-in motion-reduce:transition-none',
		variants: {
			side: {
				top: 'inset-x-0 top-0 h-3/4 max-h-screen w-full border-b data-starting-style:-translate-y-full data-[state=closed]:-translate-y-full',
				right:
					'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-starting-style:translate-x-full data-[state=closed]:translate-x-full',
				bottom:
					'inset-x-0 bottom-0 h-3/4 max-h-screen w-full border-t data-starting-style:translate-y-full data-[state=closed]:translate-y-full',
				left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-starting-style:-translate-x-full data-[state=closed]:-translate-x-full'
			}
		},
		defaultVariants: { side: 'right' }
	});

	export type SheetSide = VariantProps<typeof sheetVariants>['side'];
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Dialog as SheetPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import XIcon from '@lucide/svelte/icons/x';
	import SheetOverlay from './sheet-overlay.svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		side = 'right',
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<SheetPrimitive.ContentProps> & {
		class?: string;
		side?: SheetSide;
		portalProps?: SheetPrimitive.PortalProps;
		children: Snippet;
	} = $props();
</script>

<SheetPrimitive.Portal {...portalProps}>
	<SheetOverlay />
	<SheetPrimitive.Content bind:ref class={cn(sheetVariants({ side }), className)} {...restProps}>
		{@render children?.()}
		<SheetPrimitive.Close
			class="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring focus-visible:ring-offset-background absolute end-4 top-4 inline-flex size-7 items-center justify-center rounded-lg transition-[scale,background-color] duration-(--duration-base) outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] disabled:pointer-events-none"
		>
			<XIcon class="size-4" />
			<span class="sr-only">Close</span>
		</SheetPrimitive.Close>
	</SheetPrimitive.Content>
</SheetPrimitive.Portal>
