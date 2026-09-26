<script lang="ts">
	import CodeBlock from '$lib/site/code-block.svelte';
	import { siteConfig } from '$lib/site/config';
	import Seo from '$lib/site/seo.svelte';

	const head = `<!-- src/app.html -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`;

	const manifest = `// static/manifest.webmanifest
{
  "name": "Mizu Assistant",
  "short_name": "Assistant",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}`;

	const shell = `<script lang="ts">
  import House from '@lucide/svelte/icons/house';
  import MessageCircle from '@lucide/svelte/icons/message-circle';
  import CircleUser from '@lucide/svelte/icons/circle-user';
  import { page } from '$app/state';
  import * as TabBar from '$lib/components/ui/tab-bar';
  import { NetworkStatus } from '$lib/components/ui/network-status';

  let { children } = $props();
  const tabs = [
    { href: '/', label: 'Home', icon: House },
    { href: '/chats', label: 'Chats', icon: MessageCircle },
    { href: '/profile', label: 'Profile', icon: CircleUser }
  ];
<\/script>

<NetworkStatus fixed />
<main class="pt-safe px-safe pb-28">
  {@render children()}
</main>
<TabBar.Root fixed>
  {#each tabs as tab (tab.href)}
    <TabBar.Item {...tab} active={page.url.pathname === tab.href} />
  {/each}
</TabBar.Root>`;

	const install = `<InstallPrompt
  storageKey="assistant-install"
  title="Install Mizu Assistant"
  description="Open a chat or a voice session from your home screen."
  onInstall={(outcome) => analytics.track('install', { outcome })}
/>`;

	const worker = `// src/service-worker.ts
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, prerendered, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = \`app-\${version}\`;
// Scripts, styles, static files, and prerendered pages make up the shell.
const SHELL = [...build, ...files, ...prerendered];

sw.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
});

sw.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Shell files never change within a version, so the cache answers first.
  if (SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(url.pathname).then((hit) => hit ?? fetch(request)));
    return;
  }

  // Pages try the network, then fall back to the cached start page offline.
  // Never cache model responses or personal data here.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match('/')) ?? Response.error())
    );
  }
});`;

	const checklist = [
		'The viewport uses viewport-fit=cover, and fixed bars use the safe-area utilities.',
		'Scrolling content reserves space for the tab bar so the last item is reachable.',
		'Navigation and primary actions are at least 44 pixels in both directions, and nothing tappable is smaller than 24.',
		'Hover-only effects, such as magnetic buttons, stay off for touch and coarse pointers.',
		'The manifest has a maskable icon and theme colors that match both themes.',
		'Queued work survives a lost connection, and NetworkStatus tells people it will sync.',
		'The service worker caches the shell only, and a new version replaces the old cache.',
		'Reduced motion leaves every screen usable and every change visible.'
	];
</script>

<Seo
	title="Apps and PWAs · {siteConfig.name}"
	description="Build installable web apps with Mizu: viewport and safe areas, a web manifest, tab bar navigation, install prompts, offline status, a service worker, and touch-friendly motion."
/>

<article class="max-w-3xl">
	<h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">Apps and PWAs</h1>
	<p class="text-muted-foreground mt-4 text-lg leading-relaxed">
		The same components that power a chat window can carry an app someone installs on their phone.
		This guide covers the pieces that make a web app feel native.
	</p>

	<h2 class="mt-12 mb-3 text-xl font-semibold">Edge to edge</h2>
	<p class="text-muted-foreground mb-4 leading-relaxed">
		Let the page draw under the status bar and home indicator, then pad fixed chrome with
		<code>pt-safe</code>, <code>pb-safe</code>, <code>px-safe</code>, and their siblings. Each
		utility uses the device inset or 12 pixels, whichever is larger.
	</p>
	<CodeBlock code={head} />

	<h2 class="mt-12 mb-3 text-xl font-semibold">Make it installable</h2>
	<p class="text-muted-foreground mb-4 leading-relaxed">
		A web manifest names the app and supplies its icons. Include a maskable icon with the artwork
		inside the central 80 percent so launchers can crop it to any shape.
	</p>
	<CodeBlock code={manifest} />

	<h2 class="mt-12 mb-3 text-xl font-semibold">Navigation</h2>
	<p class="text-muted-foreground mb-4 leading-relaxed">
		<a href="/docs/components/tab-bar" class="text-foreground underline underline-offset-4"
			>Tab Bar</a
		>
		pins to the bottom with <code>fixed</code> and clears the home indicator on its own. Use the floating
		variant for a lighter, content-first app and the docked variant for dense productivity tools. Reserve
		bottom padding in the scrolling content so nothing hides behind the bar.
	</p>
	<CodeBlock code={shell} />

	<h2 class="mt-12 mb-3 text-xl font-semibold">Offer to install</h2>
	<p class="text-muted-foreground mb-4 leading-relaxed">
		<a href="/docs/components/install-prompt" class="text-foreground underline underline-offset-4"
			>Install Prompt</a
		>
		appears only when the browser can install the app, shows Add to Home Screen steps on iOS, and stays
		hidden once installed. Ask after someone has found value, not on the first visit, and pass a
		<code>storageKey</code> so a dismissal is remembered. Import the component in your root layout, even
		if you render it later: Chromium offers installation once, early in the visit, and the import is what
		listens for it.
	</p>
	<CodeBlock code={install} />

	<h2 class="mt-12 mb-3 text-xl font-semibold">Work offline</h2>
	<p class="text-muted-foreground mb-4 leading-relaxed">
		<a href="/docs/components/network-status" class="text-foreground underline underline-offset-4"
			>Network Status</a
		>
		tells people when they lose their connection and when it returns. Pair it with a service worker that
		caches the app shell and prerendered pages, and falls back to the start page for anything else. SvelteKit
		registers
		<code>src/service-worker.ts</code> automatically.
	</p>
	<CodeBlock code={worker} />

	<h2 class="mt-12 mb-3 text-xl font-semibold">Motion on touch</h2>
	<div class="text-muted-foreground space-y-4 leading-relaxed">
		<p>
			Press feedback matters more than hover on a phone. Controls scale slightly on press using
			<code>--duration-instant</code>, and springs carry tab indicators and toggles. Pointer effects
			from the Motion item switch off automatically for touch.
		</p>
		<p>
			Keep ambient loops for moments when the assistant is working, and let everything else hold
			still. Reduced motion is respected everywhere.
		</p>
	</div>

	<h2 class="mt-12 mb-4 text-xl font-semibold">Before you ship</h2>
	<ul class="flex flex-col gap-2">
		{#each checklist as item (item)}
			<li class="bg-card text-muted-foreground rounded-2xl px-5 py-3.5 text-sm shadow-xs">
				{item}
			</li>
		{/each}
	</ul>
</article>
