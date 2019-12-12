
import assignAttributes from './assign.js';

const assign       = Object.assign;
const svgNamespace = 'http://www.w3.org/2000/svg';
const testDiv      = document.createElement('div');

const constructors = {
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

/*
create(tag, text)`

Returns a new DOM node.

- If `tag` is `"text"` returns a text node with the content `text`.
- If `tag` is `"fragment"` returns a document fragment.
- If `tag` is `"comment"` returns a comment `<!-- text -->`.
- Anything else returns an element `<tag>text</tag>`, where `text` is inserted
  as inner html.
*/

export default function create(tag, attributes) {
	// create(type)
	// create(type, text)
	// create(type, attributes)

	let node;

	if (typeof tag === 'string') {
		if (constructors[tag]) {
			return constructors[tag](attributes);
		}

		node = document.createElement(tag);
	}
	else {
		node = document.createElement(tag.tagName);
		delete tag.tagName;
		assignAttributes(node, tag);
	}

	if (attributes) {
		if (typeof attributes === 'string') {
			node.innerHTML = attributes;
		}
		else {
			assignAttributes(node, attributes);
		}
	}

	return node;
}
