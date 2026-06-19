<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
</script>

<Popover.Root>
	<Popover.Trigger class={buttonVariants({ variant: 'secondary' })}>Set ripple</Popover.Trigger>
	<Popover.Content class="w-72">
		<div class="flex flex-col gap-3">
			<div class="flex flex-col gap-1">
				<h4 class="text-sm font-medium leading-none">Ripple strength</h4>
				<p class="text-sm text-muted-foreground">Tune how far the waves spread.</p>
			</div>
			<div class="flex flex-col gap-2">
				<Label for="ripple">Spread (px)</Label>
				<Input id="ripple" type="number" value="24" />
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
