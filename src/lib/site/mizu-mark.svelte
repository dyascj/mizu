<script lang="ts">
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		tone = 'mono',
		flow = 'hover'
	}: {
		class?: string;
		/** mono follows the text color; water uses the brand gradient. */
		tone?: 'mono' | 'water';
		/** When the surface drifts: on hover of the nearest `group`, always, or never. */
		flow?: 'hover' | 'always' | 'never';
	} = $props();

	const id = $props.id();
</script>

<!-- The Mizu mark: a round vessel holding one wave. The wave path spans two
     periods so translating it by one period loops seamlessly. -->
<svg
	viewBox="0 0 100 100"
	class={cn('mizu-mark size-8 shrink-0 select-none', className)}
	data-flow={flow}
	aria-hidden="true"
>
	<defs>
		<clipPath id="{id}-vessel"><circle cx="50" cy="50" r="48" /></clipPath>
		<linearGradient id="{id}-water" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#9aa6fc" />
			<stop offset="1" stop-color="#5b61f5" />
		</linearGradient>
	</defs>
	<circle
		cx="50"
		cy="50"
		r="48"
		fill={tone === 'water' ? '#626afb' : 'currentColor'}
		fill-opacity={tone === 'water' ? 0.18 : 0.14}
	/>
	<g clip-path="url(#{id}-vessel)">
		<path
			class="mizu-mark-wave"
			d="M-100 50C-84 41.33-66 41.33-50 50S-16 58.67 0 50 34 41.33 50 50 84 58.67 100 50V100H-100Z"
			fill={tone === 'water' ? `url(#${id}-water)` : 'currentColor'}
		/>
	</g>
</svg>

<style>
	.mizu-mark-wave {
		transition: translate var(--duration-slow) var(--ease-out);
	}

	.mizu-mark[data-flow='always'] .mizu-mark-wave,
	:global(.group:hover) .mizu-mark[data-flow='hover'] .mizu-mark-wave {
		animation: mizu-flow 3.2s linear infinite;
	}

	@keyframes mizu-flow {
		to {
			translate: 100px 0;
		}
	}
</style>
