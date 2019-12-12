
/*
attribute(name, node)`

Returns the string contents of attribute `name`. If the attribute is not set,
returns `undefined`.
*/

export default function attribute(name, node) {
	return node.getAttribute && node.getAttribute(name) || undefined ;
}
