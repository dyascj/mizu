<script lang="ts">
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { AlignLeft, AlignCenter, AlignRight } from '@lucide/svelte';

	let value = $state('center');
</script>

<ToggleGroup.Root type="single" bind:value>
	<ToggleGroup.Item value="left" aria-label="Align left">
		<AlignLeft class="size-5" />
	</ToggleGroup.Item>
	<ToggleGroup.Item value="center" aria-label="Align center">
		<AlignCenter class="size-5" />
	</ToggleGroup.Item>
	<ToggleGroup.Item value="right" aria-label="Align right">
		<AlignRight class="size-5" />
	</ToggleGroup.Item>
</ToggleGroup.Root>
