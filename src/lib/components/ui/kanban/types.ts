/** One column of a Kanban board. */
export type KanbanColumn<T> = {
	/** Stable identifier. */
	id: string;
	/** Heading shown above the cards, and the list's accessible name. */
	title: string;
	/** The cards in order, top first. */
	cards: T[];
};
