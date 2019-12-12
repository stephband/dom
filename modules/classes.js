
// TokenList
// TokenList constructor to emulate classList property. The get fn should
// take the arguments (node), and return a string of tokens. The set fn
// should take the arguments (node, string).

//var SVGElement  = window.SVGElement;
//
//function TokenList(node, get, set) {
//	this.node = node;
//	this.get = get;
//	this.set = set;
//}
//
//TokenList.prototype = {
//	add: function() {
//		var n = arguments.length;
//		var tokens = this.get(this.node);
//		var array = tokens ? tokens.trim().split(rspaces) : [] ;
//
//		while (n--) {
//			if (array.indexOf(arguments[n]) === -1) {
//				array.push(arguments[n]);
//			}
//		}
//
//		this.set(this.node, array.join(' '));
//	},
//
//	remove: function() {
//		var n = arguments.length;
//		var tokens = this.get(this.node);
//		var array = tokens ? tokens.trim().split(rspaces) : [] ;
//		var i;
//
//		while (n--) {
//			i = array.indexOf(arguments[n]);
//			if (i !== -1) { array.splice(i, 1); }
//		}
//
//		this.set(this.node, array.join(' '));
//	},
//
//	contains: function(string) {
//		var tokens = this.get(this.node);
//		var array = tokens ? tokens.trim().split(rspaces) : [] ;
//		return array.indexOf(string) !== -1;
//	}
//};
//
//function setClass(node, classes) {
//	if (node instanceof SVGElement) {
//		node.setAttribute('class', classes);
//	}
//	else {
//		node.className = classes;
//	}
//}
//
//export function classes(node) {
//	return node.classList || new TokenList(node, function(node) {
//		return node.getAttribute('class');
//	}, setClass);
//}

/*
classes(node)

Returns the classList of `node`.
*/

import { get } from '../../fn/module.js';

export const classes = get('classList');

/*
addClass(class, node)`

Adds `'class'` to the classList of `node`.
*/

export function addClass(string, node) {
	classes(node).add(string);
}

/*
removeClass(class, node)`

Removes `'class'` from the classList of `node`.
*/

export function removeClass(string, node) {
	classes(node).remove(string);
}

function requestFrame(n, fn) {
	// Requst frames until n is 0, then call fn
	(function frame(t) {
		return n-- ?
			requestAnimationFrame(frame) :
			fn(t);
	})();
}

export function frameClass(string, node) {
	var list = classes(node);
	list.add(string);

	// Chrome (at least) requires 2 frames - I guess in the first, the
	// change is painted so we have to wait for the second to undo
	requestFrame(2, () => list.remove(string));
}
