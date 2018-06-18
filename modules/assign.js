export default function assignAttributes(node, attributes) {
	var names = Object.keys(attributes);
	var n = names.length;

	while (n--) {
		if (names[n] in node) {
			node[names[n]] = attributes[names[n]];
		}
		else {
			node.setAttribute(names[n], attributes[names[n]]);
		}
	}
}
