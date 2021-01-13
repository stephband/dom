
export default function delegate(object) {
	if (typeof object !== 'object' || arguments.length > 1) {
		throw new Error('delegate() now takes an object of selector:fn pairs.');
	}

	// Create an event handler that looks up the ancestor tree
	// to find selector.
	const selectors = Object.keys(object);

	return function handle(e) {
		const target = e.target;
		let n = -1;
		while (selectors[++n]) {
			const node = target.closest(selectors[n]);
			if (node) {
				// Todo: remove the need for delegateTarget in Bolt dom-activate
				e.delegateTarget = node;
				object[selectors[n]](e, node);
				e.delegateTarget = undefined;
			}
		}
	};
}
