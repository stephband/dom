/* DOM Mutation */

/*
empty(node)

Removes content of `node`.
*/

export function empty(node) {
	while (node.lastChild) { node.removeChild(node.lastChild); }
	return node;
}

/*
remove(node)

Removes `node` from the DOM.
*/

export function remove(node) {
	if (node.remove) {
		node.remove();
	}
	else {
		console.warn('deprecated: remove() no longer removes lists of nodes.');
		node.parentNode && node.parentNode.removeChild(node);
	}

	return node;
}

/*
before(target, node)

Inserts `node` before target.
*/

export function before(target, node) {
	target.parentNode && target.parentNode.insertBefore(node, target);
	return node;
}

/*
after(target, node)

Inserts `node` after `target`.
*/

export function after(target, node) {
	target.parentNode && target.parentNode.insertBefore(node, target.nextSibling);
	return node;
}

/*
replace(target, node)

Swaps `target` for `node`.
*/

export function replace(target, node) {
	before(target, node);
	remove(target);
	return node;
}
