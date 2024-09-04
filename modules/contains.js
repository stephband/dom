/**
contains(element, root)
Returns `true` where `root` contains `element`.
**/

import curry from 'fn/curry.js';

export function contains(child, node) {
	return node.contains ?
		node.contains(child) :
	child.parentNode ?
		child.parentNode === node || contains(child.parentNode, node) :
	false ;
}

export default curry(contains, true);