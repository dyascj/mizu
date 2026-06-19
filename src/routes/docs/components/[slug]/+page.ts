import { error } from '@sveltejs/kit';
import { getComponent } from '$lib/site/catalog';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const component = getComponent(params.slug);
	if (!component) error(404, `Unknown component: ${params.slug}`);
	return { component };
};
