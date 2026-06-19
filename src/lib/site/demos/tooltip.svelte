<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { buttonVariants } from '$lib/components/ui/button';
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger class={buttonVariants({ variant: 'outline' })}>Hover me</Tooltip.Trigger>
		<Tooltip.Content>Crystal clear, even up close.</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
