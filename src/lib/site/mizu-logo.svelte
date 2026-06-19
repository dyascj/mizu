<script lang="ts">
	import { cn } from '$lib/utils.js';

	let { class: className }: { class?: string } = $props();
	// Unique gradient id so multiple logos on a page don't collide (SSR-stable).
	const uid = $props.id();
</script>

<!-- A glossy water droplet. The fill derives from --primary, so it recolors
     with the active accent. -->
<svg viewBox="0 0 32 32" fill="none" class={cn('size-8', className)} aria-hidden="true">
	<defs>
		<linearGradient
			id={`mizu-drop-${uid}`}
			x1="16"
			y1="2.5"
			x2="16"
			y2="30"
			gradientUnits="userSpaceOnUse"
		>
			<stop offset="0" style="stop-color: color-mix(in oklab, var(--primary) 50%, white)" />
			<stop offset="0.55" style="stop-color: var(--primary)" />
			<stop offset="1" style="stop-color: color-mix(in oklab, var(--primary) 74%, black)" />
		</linearGradient>
	</defs>
	<path
		d="M16 3C16 3 25 13.4 25 19.2A9 9 0 1 1 7 19.2C7 13.4 16 3 16 3Z"
		fill={`url(#mizu-drop-${uid})`}
	/>
	<path
		d="M12.6 13.6C10.9 15.7 10 18 10.4 19.8 11.8 19.3 13 17.5 13.2 15.6 13.3 14.5 13.2 13.7 12.6 13.6Z"
		fill="#ffffff"
		fill-opacity="0.5"
	/>
	<circle cx="11.9" cy="12.7" r="0.95" fill="#ffffff" fill-opacity="0.85" />
</svg>
