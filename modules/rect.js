
/**
rect(node)

Returns a `DOMRect` object describing the draw rectangle of `node`.
(If `node` is `window` a preudo-DOMRect object is returned).
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

export default function rect(node) {
	return node === window ?
		windowBox() :
		node.getClientRects()[0] ;
}
