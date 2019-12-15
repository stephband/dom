/*
bounds(node)

Returns a `DOMRect` object describing the bounding box of `node` and its
descendants.
*/

export default function boundingBox(node) {
	return node.getBoundingClientRect();
};
