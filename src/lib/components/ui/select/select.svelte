<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { setSelectContext } from './context.js';

	let {
		value = $bindable(),
		open = $bindable(false),
		...restProps
	}: SelectPrimitive.RootProps = $props();
	let contentId = $state<string | undefined>();
	setSelectContext({
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
	<SelectPrimitive.Root
		{...restProps}
		bind:value={() => (Array.isArray(value) ? value : []), (next) => (value = next)}
		bind:open
	/>
{:else}
	<SelectPrimitive.Root
		{...restProps}
		bind:value={() => (typeof value === 'string' ? value : ''), (next) => (value = next)}
		bind:open
	/>
{/if}
