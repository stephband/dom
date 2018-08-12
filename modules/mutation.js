// DOM Mutation

export function empty(node) {
	while (node.lastChild) { node.removeChild(node.lastChild); }
	return node;
}

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

export function before(target, node) {
	target.parentNode && target.parentNode.insertBefore(node, target);
	return node;
}

export function after(target, node) {
	target.parentNode && target.parentNode.insertBefore(node, target.nextSibling);
	return node;
}

export function replace(target, node) {
	before(target, node);
	remove(target);
	return node;
}
