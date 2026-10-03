<script lang="ts" module>
	import { getContext, setContext } from 'svelte';

	const DIR = Symbol('menubar-dir');

	/** The menubar's reading direction, for parts that place themselves by it. */
	export function getMenubarDir() {
		return getContext<{ readonly current: 'ltr' | 'rtl' } | undefined>(DIR);
	}
</script>

<script lang="ts">
	import { Menubar as MenubarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		dir,
		class: className,
		...restProps
	}: MenubarPrimitive.RootProps = $props();

	// bits-ui assumes left to right unless told, and stamps that on the menus it
	// portals out, so the bar reads the direction it sits in.
	let inherited = $state<'ltr' | 'rtl'>('ltr');
	$effect(() => {
		if (ref) inherited = getComputedStyle(ref).direction === 'rtl' ? 'rtl' : 'ltr';
	});
	const resolved = $derived(dir ?? inherited);
	setContext(DIR, {
		get current() {
			return resolved;
		}
	});
</script>

<MenubarPrimitive.Root
	bind:ref
	bind:value
	dir={resolved}
	class={cn('bg-card flex h-10 items-center gap-1 rounded-full p-1 shadow-xs', className)}
	{...restProps}
/>
