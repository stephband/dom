
import { toArray } from '../../fn/fn.js';

export default function query(selector, node) {
	return toArray(node.querySelectorAll(selector));
}
