<script lang="ts">
	import * as Resizable from '$lib/components/ui/resizable';
</script>

<div
	class="glass-strong gloss relative h-48 w-full max-w-md overflow-hidden rounded-2xl border border-[color:var(--glass-border)] shadow-glass"
>
	<Resizable.PaneGroup direction="horizontal" class="relative z-10">
		<Resizable.Pane defaultSize={30} minSize={20}>
			<div class="flex h-full flex-col gap-1 p-4">
				<span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Sources
				</span>
				<span class="text-sm">Rainfall</span>
				<span class="text-sm">Spring</span>
				<span class="text-sm">Reservoir</span>
			</div>
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane defaultSize={70}>
			<div class="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
				<span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Preview
				</span>
				<span class="text-sm text-foreground">Drag the grip to resize the panes.</span>
			</div>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
