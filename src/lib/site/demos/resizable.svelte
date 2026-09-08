<script lang="ts">
	import * as Resizable from '$lib/components/ui/resizable';
</script>

<div class="bg-popover relative h-48 w-full max-w-md overflow-hidden rounded-2xl shadow-lg">
	<Resizable.PaneGroup direction="horizontal" class="relative z-10">
		<Resizable.Pane defaultSize={30} minSize={20}>
			<div class="flex h-full flex-col gap-1 p-4">
				<span class="text-muted-foreground truncate text-xs font-semibold"> Sources </span>
				<span class="truncate text-sm">Rainfall</span>
				<span class="truncate text-sm">Spring</span>
				<span class="truncate text-sm">Reservoir</span>
			</div>
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane defaultSize={70}>
			<div class="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
				<span class="text-muted-foreground truncate text-xs font-semibold"> Preview </span>
				<span class="text-foreground text-sm">Drag the grip to resize the panes.</span>
			</div>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
