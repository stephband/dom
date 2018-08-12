
import matches from './matches.js';

export default function closest(selector, node) {
	var root = arguments[2];

	if (!node || node === document || node === root || node.nodeType === 11) { return; }

	// SVG <use> elements store their DOM reference in
	// .correspondingUseElement.
	node = node.correspondingUseElement || node ;

	return matches(selector, node) ?
		 node :
		 closest(selector, node.parentNode, root) ;
}