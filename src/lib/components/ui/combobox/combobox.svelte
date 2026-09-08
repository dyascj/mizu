<script lang="ts">
	import { Combobox as ComboboxPrimitive } from 'bits-ui';
	import { setComboboxContext } from './context.js';

	let {
		value = $bindable(),
		open = $bindable(false),
		...restProps
	}: ComboboxPrimitive.RootProps = $props();
	let contentId = $state<string | undefined>();
	setComboboxContext({
		get open() {
			return open;
		},
		get contentId() {
			return contentId;
		},
		set contentId(id) {
			contentId = id;
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
