
/*
attribute(name, node)

Returns the string contents of attribute `name`. If the attribute is not set,
returns `undefined`.
*/

import { curry } from '../../fn/module.js';

export function attribute(name, node) {
	return node.getAttribute && node.getAttribute(name) || undefined ;
}

export default curry(attribute, true);