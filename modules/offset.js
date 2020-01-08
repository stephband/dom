
/*
offset(node1, node2)

Returns array `[x, y]` representing the vector from `node1` to `node2`.
*/

import box from './box.js';

export default function offset(node1, node2) {
	var box1 = box(node1);
	var box2 = box(node2);
	return [box2.left - box1.left, box2.top - box1.top];
};
