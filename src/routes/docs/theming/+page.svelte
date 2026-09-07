<script lang="ts">
	import SurfacePreview from '$lib/site/surface-preview.svelte';
	import CodeBlock from '$lib/site/code-block.svelte';
	import { siteConfig } from '$lib/site/config';
	import Seo from '$lib/site/seo.svelte';
	const tokens = [
		{ name: 'Page', token: '--background' },
		{ name: 'Card', token: '--card' },
		{ name: 'Popover', token: '--popover' },
		{ name: 'Secondary', token: '--secondary' },
		{ name: 'Muted text', token: '--muted-foreground' },
		{ name: 'Primary', token: '--primary' }
	];
	const theme = `:root {
  --background: #ffffff;
  --foreground: #202020;
  --card: #ffffff;
  --popover: #ffffff;
  --secondary: #f5f5f5;
  --muted: #f5f5f5;
  --muted-foreground: #626262;
  --primary: #171717;
  --primary-hover: #333333;
  --primary-foreground: #ffffff;
  --control: #e8e8e8;
  --input: #8a8a8a;
  --ring: var(--primary);
}

.dark {
  --background: #000000;
  --foreground: #f5f5f5;
  --card: #141414;
  --popover: #202020;
  --secondary: #202020;
  --muted: #202020;
  --muted-foreground: #a3a3a3;
  --primary: #f5f5f5;
  --primary-hover: #d9d9d9;
  --primary-foreground: #171717;
  --control: #363636;
  --input: #858585;
}`;
	const accent = `:root {
  --primary: #6d28d9;
  --primary-hover: #5b21b6;
  --primary-foreground: #ffffff;
}

.dark {
  --primary: #c4b5fd;
  --primary-hover: #ddd6fe;
  --primary-foreground: #221442;
}`;
</script>

<Seo
	title="Theming · {siteConfig.name}"
	description="Customize Mizu's neutral palette, semantic color tokens, light and dark themes, and reduced-motion behavior."
/>
<article class="max-w-3xl">
	<h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">Theming</h1>
	<p class="text-muted-foreground mt-4 text-lg leading-relaxed">
		Black, white, and neutral grays. Color where it has a job to do.
	</p>
	<h2 class="mt-12 mb-3 text-xl font-semibold">The palette</h2>
	<p class="text-muted-foreground mb-6 leading-relaxed">
		These swatches read the current theme. Use the theme button in the header to compare light and
		dark.
	</p>
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
		{#each tokens as item (item.token)}
			<div class="min-w-0">
				<div class="h-24 rounded-2xl shadow-sm" style:background-color={`var(${item.token})`}></div>
				<p class="mt-3 text-sm font-medium">{item.name}</p>
				<code class="text-muted-foreground mt-1 block text-xs break-all">{item.token}</code>
			</div>
		{/each}
	</div>
	<h2 class="mt-12 mb-3 text-xl font-semibold">Controls on every surface</h2>
	<p class="text-muted-foreground mb-6 leading-relaxed">
		Fields use a separate <code>--control</code> fill so they remain visible inside cards and floating
		panels. Visible text identifies the field; focus and error states add a ring. Small empty controls
		keep a semantic boundary. Try typing, tabbing, and switching themes below.
	</p>
	<SurfacePreview />
	<h2 class="mt-12 mb-3 text-xl font-semibold">Theme tokens</h2>
	<p class="text-muted-foreground mb-4 leading-relaxed">
		The installed <code>app.css</code> maps CSS variables through Tailwind's
		<code>@theme inline</code>. Update the variables to change every component that uses them.
	</p>
	<CodeBlock code={theme} />
	<h2 class="mt-12 mb-3 text-xl font-semibold">Add your brand color</h2>
	<p class="text-muted-foreground mb-4 leading-relaxed">
		Override the primary, hover, and foreground colors together. The selected-state fills derive
		from your primary color. Check text and focus contrast in both themes.
	</p>
	<CodeBlock code={accent} />
	<h2 class="mt-12 mb-3 text-xl font-semibold">Surfaces and status</h2>
	<div class="text-muted-foreground space-y-4 leading-relaxed">
		<p>
			Use <code>bg-background</code> for the page, <code>bg-card</code> for content, and
			<code>bg-popover</code> for floating controls. Gray fills and soft shadows establish depth. Keep
			borders for inputs, focus, dividers, and panel edges that need separation.
		</p>
		<p>
			Success, warning, destructive, and info colors communicate status. The voice orb and aurora
			utilities use color for AI activity. Navigation, labels, and routine actions stay neutral.
		</p>
	</div>
	<h2 class="mt-12 mb-3 text-xl font-semibold">Motion and dark mode</h2>
	<div class="text-muted-foreground space-y-4 leading-relaxed">
		<p>
			Add the <code>dark</code> class to the document to activate the dark theme. Save the preference
			in your app and apply it before the first paint to avoid a flash.
		</p>
		<p>
			Transitions take 200 to 320 milliseconds. Components respect <code
				>prefers-reduced-motion</code
			>. The cloud orb stops drawing animation frames when motion is reduced or the orb is
			offscreen.
		</p>
	</div>
</article>
