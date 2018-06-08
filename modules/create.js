
import assignAttributes from './assign.js';

const assign = Object.assign;

var testDiv = document.createElement('div');

var constructors = {
	text: function(text) {
		return document.createTextNode(text || '');
	},

	comment: function(text) {
		return document.createComment(text || '');
	},

	fragment: function(html) {
		var fragment = document.createDocumentFragment();

		if (html) {
			testDiv.innerHTML = html;
			append(fragment, testDiv.childNodes);
			testDiv.innerHTML = '';
		}

		return fragment;
	}
};

var svgs = [
	'circle',
	'ellipse',
	'g',
	'line',
	'rect',
	//'text',
	'use',
	'path',
	'polygon',
	'polyline',
	'svg'
];

svgs.forEach(function(tag) {
	constructors[tag] = function(attributes) {
		var node = document.createElementNS(svgNamespace, tag);
		if (attributes) { setSVGAttributes(node, attributes); }
		return node;
	};
});

function setSVGAttributes(node, attributes) {
	var names = Object.keys(attributes);
	var n = names.length;

	while (n--) {
		node.setAttributeNS(null, names[n], attributes[names[n]]);
	}
}

export default function create(tag, attributes) {
	// create(type)
	// create(type, text)
	// create(type, attributes)

	let object;

	if (typeof tag === 'string') {
		if (constructors[tag]) {
			return constructors[tag](attributes);
		}
	}
	else {
		object = tag;
		tag = object.tagName;
		delete object.tagName;
	}

	const node = document.createElement(tag);

	if (!object) { return node; }

	assignAttributes(node, object);

	if (!attributes) { return node; }

	if (typeof attributes === 'string') {
		node.innerHTML = attributes;
	}
	else {
		assignAttributes(node, attributes);
	}

	return node;
}
