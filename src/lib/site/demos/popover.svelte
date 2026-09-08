<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
</script>

<Popover.Root>
	<Popover.Trigger class={buttonVariants({ variant: 'secondary' })}>Layout settings</Popover.Trigger
	>
	<Popover.Content class="w-72">
		<div class="flex flex-col gap-3">
			<div class="flex flex-col gap-1">
				<h4 class="text-sm leading-none font-medium">Grid spacing</h4>
				<p class="text-muted-foreground text-sm">Choose the space between items in the grid.</p>
			</div>
			<div class="flex flex-col gap-2">
				<Label for="ripple">Gap in pixels</Label>
				<Input id="ripple" type="number" value="24" />
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
