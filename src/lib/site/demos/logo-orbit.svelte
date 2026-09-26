<script lang="ts">
	import Calendar from '@lucide/svelte/icons/calendar';
	import ChartLine from '@lucide/svelte/icons/chart-line';
	import CodeXml from '@lucide/svelte/icons/code-xml';
	import Contact from '@lucide/svelte/icons/contact';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import Database from '@lucide/svelte/icons/database';
	import FileText from '@lucide/svelte/icons/file-text';
	import Folder from '@lucide/svelte/icons/folder';
	import Globe from '@lucide/svelte/icons/globe';
	import Kanban from '@lucide/svelte/icons/kanban';
	import Mail from '@lucide/svelte/icons/mail';
	import MessagesSquare from '@lucide/svelte/icons/messages-square';
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import Sheet from '@lucide/svelte/icons/sheet';
	import SquareTerminal from '@lucide/svelte/icons/square-terminal';
	import Ticket from '@lucide/svelte/icons/ticket';
	import { Button } from '$lib/components/ui/button';
	import { LogoOrbit, type OrbitRing } from '$lib/components/ui/logo-orbit';

	const rings: OrbitRing[] = [
		{
			logos: [
				{ name: 'Mail', icon: Mail },
				{ name: 'Calendar', icon: Calendar },
				{ name: 'Docs', icon: FileText },
				{ name: 'Chat', icon: MessagesSquare },
				{ name: 'Sheets', icon: Sheet },
				{ name: 'Drive', icon: Folder },
				{ name: 'Notes', icon: NotebookPen }
			],
			radius: 0.72,
			lap: 42
		},
		{
			logos: [
				{ name: 'Tickets', icon: Ticket },
				{ name: 'Repositories', icon: CodeXml },
				{ name: 'Warehouse', icon: Database },
				{ name: 'Analytics', icon: ChartLine },
				{ name: 'CRM', icon: Contact },
				{ name: 'Billing', icon: CreditCard },
				{ name: 'Web search', icon: Globe },
				{ name: 'Projects', icon: Kanban },
				{ name: 'Terminal', icon: SquareTerminal }
			],
			radius: 1,
			lap: -64
		}
	];

	let paused = $state(false);
</script>

<div class="flex w-full max-w-xl min-w-0 flex-col items-center gap-2">
	<LogoOrbit {rings} {paused} class="aspect-square sm:aspect-[16/10]">
		<div class="flex flex-col items-center gap-2">
			<p class="text-muted-foreground text-sm font-medium">Integrations</p>
			<h2 class="text-lg leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
				Your agent works where you work
			</h2>
		</div>
	</LogoOrbit>
	<Button
		variant="ghost"
		size="sm"
		onclick={() => (paused = !paused)}
		class="text-muted-foreground"
	>
		{#if paused}<Play class="size-3.5" /> Resume{:else}<Pause class="size-3.5" /> Pause{/if}
	</Button>
</div>
