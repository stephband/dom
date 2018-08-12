
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

import { get } from '../../fn/fn.js';

export const classes = get('classList');

export function addClass(string, node) {
	classes(node).add(string);
}

export function removeClass(string, node) {
	classes(node).remove(string);
}

export function frameClass(string, node) {
	var list = classes(node);
	list.add(string);
	requestAnimationFrame(function() {
		list.remove(string);
	});
}
