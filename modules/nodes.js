// Types

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


// Links

function prefixSlash(str) {
	// Prefixes a slash when there is not an existing one
	return (/^\//.test(str) ? '' : '/') + str ;
}

export function isInternalLink(node) {
	var location = window.location;

		// IE does not give us a .hostname for links to
		// xxx.xxx.xxx.xxx URLs. file:// URLs don't have a hostname
		// anywhere. This logic is not foolproof, it will let through
		// links to different protocols for example
	return (!node.hostname ||
		// IE gives us the port on node.host, even where it is not
		// specified. Use node.hostname
		location.hostname === node.hostname) &&
		// IE gives us node.pathname without a leading slash, so
		// add one before comparing
		location.pathname === prefixSlash(node.pathname);
}
