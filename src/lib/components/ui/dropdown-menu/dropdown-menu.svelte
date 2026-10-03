<script lang="ts" module>
	import { getContext, setContext } from 'svelte';

	const key = Symbol('mizu-dropdown-menu');
	type MenuDirection = { trigger: HTMLElement | null; readonly rtl: boolean };
	export const getMenuDirection = () => getContext<MenuDirection | undefined>(key);
</script>

<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	let { open = $bindable(false), dir, ...restProps }: DropdownMenuPrimitive.RootProps = $props();

	// bits-ui lays a menu out left to right unless told otherwise. Without a
	// `dir`, the menu takes the direction its trigger reads in as it opens, so
	// it mirrors in right-to-left text and the arrow keys open submenus toward
	// where they appear. Closing keeps the last direction, so the exit never flips.
	let last: 'ltr' | 'rtl' = 'ltr';
	const resolved = $derived.by(() => {
		if (dir) return dir;
		if (open && direction.trigger)
			last = getComputedStyle(direction.trigger).direction === 'rtl' ? 'rtl' : 'ltr';
		return last;
	});
	const direction: MenuDirection = {
		trigger: null,
		get rtl() {
			return resolved === 'rtl';
		}
	};
	setContext(key, direction);
</script>

<DropdownMenuPrimitive.Root bind:open dir={resolved} {...restProps} />
