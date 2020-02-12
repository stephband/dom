import features from './features.js';
import { select } from './select.js';

/*
clone(node)`

Returns a deep copy of `node`.
*/

export default features.textareaPlaceholderSet ?

	function clone(node) {
		return node.cloneNode(true);
	} :

	function cloneWithHTML(node) {
		// IE sets textarea innerHTML to the placeholder when cloning.
		// Reset the resulting value.

		var clone     = node.cloneNode(true);
		var textareas = select('textarea', node);
		var n         = textareas.length;
		var clones;

		if (n) {
			clones = select('textarea', clone);

			while (n--) {
				clones[n].value = textareas[n].value;
			}
		}

		return clone;
	} ;
