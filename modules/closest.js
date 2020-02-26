
/**
closest(selector, node)

Returns the node itself or the closest ancestor that matches `selector`.
If no match is found, returns `undefined`.
*/

import { curry } from '../../fn/module.js';
import matches from './matches.js';

export function closest(selector, node) {
	var root = arguments[2];

	if (!node || node === document || node === root || node.nodeType === 11) { return; }

	// SVG <use> elements store their DOM reference in
	// .correspondingUseElement.
	node = node.correspondingUseElement || node ;

	return matches(selector, node) ?
		 node :
		 closest(selector, node.parentNode, root) ;
}

export default curry(closest, true);
