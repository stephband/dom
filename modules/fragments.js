import append from './append.js';
import create from './create.js';
import attribute from './attribute.js';
import features from './features.js';
import tag from './tag.js';

if (!NodeList.prototype.forEach) {
    console.warn('A polyfill for NodeList.forEach() is needed (https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach)');
}

// DOM Fragments and Templates

export function fragmentFromChildren(node) {
	var fragment = create('fragment');

	while (node.firstChild) {
		append(fragment, node.firstChild);
	}

	return fragment;
}


/**
fragmentFromHTML(string)
Returns a DOM fragment of the parsed html `string`.
*/

export function fragmentFromHTML(html, contextTag) {
    if (contextTag) {
        const node = document.createElement(contextTag);
        node.innerHTML = html;
        return fragmentFromChildren(node);
    }

    return document
    .createRange()
    .createContextualFragment(html);
}

/**
fragmentFromTemplate(node)
Returns a DOM fragment containing the content of the template `node`.
*/

export function fragmentFromTemplate(node) {
	// A template tag has a content property that gives us a document
	// fragment. If that doesn't exist we must make a document fragment.
	return node.content || fragmentFromChildren(node);
}

export function fragmentFromId(id) {
	var node = document.getElementById(id);

	if (!node) { throw new Error('DOM: element id="' + id + '" is not in the DOM.') }

	var t = tag(node);

	// In browsers where templates are not inert their content can clash
	// with content in the DOM - ids, for example. Remove the template as
	// a precaution.
	if (t === 'template' && !features.template) {
		node.remove();
	}

	return t === 'template' ? fragmentFromTemplate(node) :
		t === 'script' ? fragmentFromHTML(node.innerHTML, attribute('data-parent-tag', node)) :
		fragmentFromChildren(node) ;
}
