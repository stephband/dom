import { toArray } from '../../fn/fn.js';

export default function children(node) {
	// In IE and Safari, document fragments do not have .children, fall back to
	// querySelectorAll.
	return toArray(node.children || node.querySelectorAll('*'));
}
