
type ListLike<T> = T[] | Set<T>;

function createIntersectionHandler<T>(intersection: Set<T>, items: ListLike<T>) {
	return Array.isArray(items) ? (item: T) => {

		if (items.includes(item)) {
			intersection.add(item);
		}
	} : (item: T) => {

		if (items.has(item)) {
			intersection.add(item);
		}
	};
}

export function intersect<T>(itemsA: ListLike<T>, itemsB: ListLike<T>) {

	const intersection = new Set<T>();

	itemsA.forEach(
		createIntersectionHandler(intersection, itemsB)
	);

	itemsB.forEach(
		createIntersectionHandler(intersection, itemsA)
	);

	return intersection;
}

export function intersects<T>(allItems: ListLike<T>[]) {

	const [
		itemsA,
		...otherItems
	] = allItems;

	return otherItems.reduce((intersections, items) => (
		intersect<T>(intersections, items)
	), itemsA);
}

export function createStringPropComparator(prop: string) {
	return (a: {}, b: {}) => {

		const aProp = a[prop].toLowerCase();
		const bProp = b[prop].toLowerCase();

		if (aProp > bProp) {
			return 1;
		}

		if (aProp < bProp) {
			return -1;
		}

		return 0;
	};
}
