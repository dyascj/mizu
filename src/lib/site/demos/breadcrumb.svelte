<script lang="ts">
	import FileText from '@lucide/svelte/icons/file-text';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { Slider } from '$lib/components/ui/slider';

	const path: Breadcrumb.BreadcrumbCrumb[] = [
		{ label: 'Workspace', href: '#workspace' },
		{ label: 'Support agent', href: '#support-agent' },
		{ label: 'Knowledge', href: '#knowledge' },
		{ label: 'Policies', href: '#policies' },
		{ label: 'Billing', href: '#billing' },
		{ label: 'Refunds for annual plans' }
	];

	let width = $state(100);
	let opened = $state('');
</script>

<div class="flex w-full max-w-lg flex-col gap-5">
	<div class="bg-card rounded-2xl p-2 shadow-sm" style:width="{width}%">
		<Breadcrumb.Root aria-label="Document path" class="px-1">
			<Breadcrumb.Trail items={path} onNavigate={(item) => (opened = `Opened ${item.label}`)} />
		</Breadcrumb.Root>
		<div class="flex items-start gap-3 px-3 pt-2 pb-2">
			<FileText class="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
			<p class="text-muted-foreground min-w-0 text-sm">
				{opened || 'The agent cites this page when a customer asks about refunds.'}
			</p>
		</div>
	</div>
	<div class="flex flex-col gap-3">
		<div class="flex items-center justify-between text-sm">
			<span class="text-muted-foreground" id="breadcrumb-width">Panel width</span>
			<span class="font-semibold tabular-nums">{width}%</span>
		</div>
		<Slider
			aria-labelledby="breadcrumb-width"
			type="single"
			bind:value={width}
			min={40}
			max={100}
		/>
	</div>
</div>
