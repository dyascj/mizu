<script lang="ts">
	import { Combobox as ComboboxPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ComboboxPrimitive.GroupProps & { class?: string } = $props();
</script>

<ComboboxPrimitive.Group bind:ref class={cn(className)} {...restProps} />
