
/*
box(node)

Returns a `DOMRect` object describing the draw box of `node`.
(If `node` is `window` a plain object is returned).
*/

function windowBox() {
	return {
		left:   0,
		top:    0,
		right:  window.innerWidth,
		bottom: window.innerHeight,
		width:  window.innerWidth,
		height: window.innerHeight
	};
}

export default function box(node) {
	return node === window ?
		windowBox() :
		node.getClientRects()[0] ;
}
