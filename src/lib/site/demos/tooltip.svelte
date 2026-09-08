<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { buttonVariants } from '$lib/components/ui/button';
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger class={buttonVariants({ variant: 'outline' })}
			>Keyboard shortcut</Tooltip.Trigger
		>
		<Tooltip.Content>Press Escape to close this panel.</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
