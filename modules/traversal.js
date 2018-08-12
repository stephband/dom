
export function get(id) {
    return document.getElementById(id) || undefined;
}

export function next(node) {
	return node.nextElementSibling || undefined;
}

export function previous(node) {
	return node.previousElementSibling || undefined;
}
