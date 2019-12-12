
/*
query(selector, node)

Returns an array of all descendants of `node` that match `selector`.
*/

import { toArray } from '../../fn/module.js';

export default function query(selector, node) {
	return toArray(node.querySelectorAll(selector));
}
