import data from './components.json';

export const categories = [
	'AI',
	'Actions',
	'Forms',
	'Surfaces',
	'Overlays',
	'Menus',
	'Navigation',
	'Feedback'
] as const;

export type Category = (typeof categories)[number];

export type ComponentMeta = {
	slug: string;
	name: string;
	category: Category;
	description: string;
	/** Built on a bits-ui primitive (so installing it pulls in `bits-ui`). */
	bits?: boolean;
	/** Extra npm dependencies required by an upstream bundle but not imported directly. */
	npmDependencies?: string[];
	/** Non-component project files installed with this registry item. */
	registryFiles?: {
		import: string;
		source: string;
		target: string;
		type: 'registry:hook' | 'registry:lib';
	}[];
};

export const components: ComponentMeta[] = data as ComponentMeta[];

export function getComponent(slug: string): ComponentMeta | undefined {
	return components.find((c) => c.slug === slug);
}

export function componentsByCategory(): { category: Category; items: ComponentMeta[] }[] {
	return categories
		.map((category) => ({
			category,
			items: components.filter((c) => c.category === category)
		}))
		.filter((group) => group.items.length > 0);
}
