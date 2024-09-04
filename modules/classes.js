
/**
classes(node)
Returns the classList of `node`.
*/

import curry from 'fn/curry.js';
import get   from 'fn/get.js';

const classes = get('classList');

export default classes;

/**
addClass(class, node)
Adds `'class'` to the classList of `node`.
*/

function _addClass(string, node) {
	classes(node).add(string);
}

/**
removeClass(class, node)
Removes `'class'` from the classList of `node`.
*/

function _removeClass(string, node) {
	classes(node).remove(string);
}

function requestFrame(n, fn) {
	// Requst frames until n is 0, then call fn
	(function frame(t) {
		return n-- ?
			requestAnimationFrame(frame) :
			fn(t);
	})();
}

function _frameClass(string, node) {
	var list = classes(node);
	list.add(string);

	// Chrome (at least) requires 2 frames - I guess in the first, the
	// change is painted so we have to wait for the second to undo
	requestFrame(2, () => list.remove(string));
}

export const addClass    = curry(_addClass, true);
export const removeClass = curry(_removeClass, true);
export const frameClass  = curry(_frameClass, true);
