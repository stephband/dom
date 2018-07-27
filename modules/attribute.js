
export default function attribute(name, node) {
	return node.getAttribute && node.getAttribute(name) || undefined ;
}
