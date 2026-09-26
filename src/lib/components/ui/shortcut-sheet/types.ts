export type Shortcut = {
	/** Stable id, unique within the sheet. */
	id: string;
	/** What the shortcut does, such as "New chat". */
	label: string;
	/** The heading it is listed under, such as "Navigation". */
	group: string;
	/**
	 * Modifiers first, then the key, such as `['Mod', 'Shift', 'P']`. `Mod` is
	 * Command on Apple platforms and Control elsewhere. Shifted symbols such as
	 * `?` are written without `Shift`.
	 */
	keys: string[];
};
