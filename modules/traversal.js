
export function get(id) {
    return document.getElementById(id) || undefined;
}

/*
next(node)
Returns the next sibling element node, or `undefined`.
*/

export function next(node) {
	return node.nextElementSibling || undefined;
}

/*
previous(node)
Returns the previous sibling element node, or `undefined`.
*/

export function previous(node) {
	return node.previousElementSibling || undefined;
}
