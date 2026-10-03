<script lang="ts">
	import { TextScramble } from '$lib/components/ui/text-scramble';

	const items = [
		{ label: 'Chats', detail: '128 threads' },
		{ label: 'Agents', detail: '6 running' },
		{ label: 'Runs', detail: '2 need review' },
		{ label: 'Usage', detail: '64% of plan' }
	];

	let active = $state('Agents');
</script>

<nav aria-label="Workspace" class="w-full max-w-xs">
	<ul class="flex flex-col gap-1">
		{#each items as item, i (item.label)}
			<li>
				<button
					type="button"
					aria-current={active === item.label ? 'page' : undefined}
					onclick={() => (active = item.label)}
					class={[
						'focus-visible:ring-ring flex w-full items-baseline gap-4 rounded-2xl px-4 py-2 text-start transition-[color,background-color] duration-(--duration-fast) ease-out outline-none focus-visible:ring-2',
						active === item.label
							? 'bg-primary-muted text-primary'
							: 'text-muted-foreground hover:bg-secondary hover:text-foreground'
					]}
				>
					<span class="font-mono text-xs tabular-nums">0{i + 1}</span>
					<TextScramble text={item.label} class="font-mono text-2xl tracking-tight" />
					<span class={['ms-auto text-xs', active !== item.label && 'text-muted-foreground']}
						>{item.detail}</span
					>
				</button>
			</li>
		{/each}
	</ul>
</nav>
