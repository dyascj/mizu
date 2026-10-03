<script lang="ts" module>
	import { getContext, setContext } from 'svelte';

	const key = Symbol('mizu-date-picker');
	type PickerDirection = { field: HTMLElement | null; readonly rtl: boolean };
	export const getPickerDirection = () => getContext<PickerDirection | undefined>(key);
</script>

<script lang="ts">
	import { DatePicker as DatePickerPrimitive } from 'bits-ui';

	let {
		value = $bindable(),
		placeholder = $bindable(),
		open = $bindable(false),
		weekdayFormat = 'short',
		...restProps
	}: DatePickerPrimitive.RootProps = $props();

	// bits-ui lays the portaled calendar out left to right unless told
	// otherwise, so it takes the direction its field reads in as it opens.
	// Closing keeps the last direction, so the exit never flips.
	let last = false;
	const rtl = $derived.by(() => {
		if (open && direction.field) last = getComputedStyle(direction.field).direction === 'rtl';
		return last;
	});
	const direction: PickerDirection = {
		field: null,
		get rtl() {
			return rtl;
		}
	};
	setContext(key, direction);
</script>

<DatePickerPrimitive.Root bind:value bind:placeholder bind:open {weekdayFormat} {...restProps} />
