
import { toArray } from '../../fn/module.js';

export default function query(selector, node) {
	return toArray(node.querySelectorAll(selector));
}
