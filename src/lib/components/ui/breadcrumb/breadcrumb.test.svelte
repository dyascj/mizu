<script lang="ts">
	import * as Breadcrumb from './index.js';

	let {
		items,
		onNavigate
	}: {
		items: Breadcrumb.BreadcrumbCrumb[];
		onNavigate?: (item: Breadcrumb.BreadcrumbCrumb, index: number) => void;
	} = $props();
</script>

<Breadcrumb.Root aria-label="Document path">
	<Breadcrumb.Trail {items} {onNavigate} />
</Breadcrumb.Root>
