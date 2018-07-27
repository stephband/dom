var types = {
	1:  'element',
	3:  'text',
	8:  'comment',
	9:  'document',
	10: 'doctype',
	11: 'fragment'
};

export function type(node) {
	return types[node.nodeType];
}

export function isElementNode(node) {
	return node.nodeType === 1;
}

export function isTextNode(node) {
	return node.nodeType === 3;
}

export function isCommentNode(node) {
	return node.nodeType === 8;
}

export function isFragmentNode(node) {
	return node.nodeType === 11;
}
