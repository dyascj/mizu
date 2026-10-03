<script lang="ts">
	import { Combobox as ComboboxPrimitive } from 'bits-ui';
	import { setComboboxContext } from './context.js';

	let {
		value = $bindable(),
		open = $bindable(false),
		...restProps
	}: ComboboxPrimitive.RootProps = $props();
	let contentId = $state<string | undefined>();
	let input: HTMLElement | null = null;
	// bits-ui lays the portaled list out left to right unless told otherwise,
	// so it takes the direction its field reads in as it opens. Closing keeps
	// the last direction, so the exit never flips.
	let last = false;
	const rtl = $derived.by(() => {
		if (open && input) last = getComputedStyle(input).direction === 'rtl';
		return last;
	});
	setComboboxContext({
		get open() {
			return open;
		},
		get value() {
			return value;
		},
		get contentId() {
			return contentId;
		},
		set contentId(id) {
			contentId = id;
		},
		get input() {
			return input;
		},
		set input(node) {
			input = node;
		},
		get rtl() {
			return rtl;
		}
	});
</script>

{#if restProps.type === 'multiple'}
	<ComboboxPrimitive.Root
		{...restProps}
		bind:value={() => (Array.isArray(value) ? value : []), (next) => (value = next)}
		bind:open
	/>
{:else}
	<ComboboxPrimitive.Root
		{...restProps}
		bind:value={() => (typeof value === 'string' ? value : ''), (next) => (value = next)}
		bind:open
	/>
{/if}
