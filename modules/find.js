
import { curry } from '../../fn/module.js';

export function find(selector, node) {
	return node.querySelector(selector);
}

export default curry(find, true);
