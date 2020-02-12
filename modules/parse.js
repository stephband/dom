
/*
parse(type, string)

Returns a document parsed from `string`, where `type` is one of `'xml'`,
`'html'` or `'svg'`.
*/

import { curry } from '../../fn/module.js';

var mimetypes = {
	xml: 'application/xml',
	html: 'text/html',
	svg: 'image/svg+xml'
};

export function parse(type, string) {
	if (!string) { return; }

	var mimetype = mimetypes[type];
	var xml;

	// From jQuery source...
	try {
		xml = (new window.DOMParser()).parseFromString(string, mimetype);
	} catch (e) {
		xml = undefined;
	}

	if (!xml || xml.getElementsByTagName("parsererror").length) {
		throw new Error("dom: Invalid XML: " + string);
	}

	return xml;
}

export default curry(parse, true);