import { id, overload } from '../../fn/module.js';
import append from './append.js';

const setAttribute = overload(id, {
	html: function(name, node, content) {
		node.innerHTML = content;
	},

	children: function(name, node, content) {
		content.forEach((child) => { node.appendChild(child) });
	},

	default: function(name, node, content) {
		if (name in node) {
			node[name] = content;
		}
		else {
			node.setAttribute(name, content);
		}
	}
});

export default function assignAttributes(node, attributes) {
	var names = Object.keys(attributes);
	var n = names.length;

	while (n--) {
		setAttribute(names[n], node, attributes[names[n]]);
	}
}
