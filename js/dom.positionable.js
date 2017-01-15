// dom.positionable.js
// This script must be included BEFORE popable, togglable etc, as it positions
// the element before e.default() is called and the class `active` is added.

(function(window) {

	var dom     = window.dom;
	var name    = "positionable";

	function alignPosition(target, node, classes) {
		var targetOffset = dom.offset(target);

		classes = classes || dom.classes(node);
		classes.add('notransition');

		node.style.marginTop = '0px';
		node.style.marginLeft = '0px';

		var offset   = dom.offset(node);
		var position = dom.position(node);

		node.style.marginTop = '';
		node.style.marginLeft = '';

		// Round the number to get round a sub-pixel rendering error in Chrome
		node.style.left = Math.floor(targetOffset[0] + position[0] - offset[0]) + 'px';
		node.style.top  = Math.floor(targetOffset[1] + position[1] - offset[1]) + 'px';

		// Bump render
		node.clientWidth;
		classes.remove('notransition');
	}

	function activate(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		//if (!e.default) { return; }
		if (e.isDefaultPrevented) { return; }

		var node    = e.target;
		var classes = dom.classes(node);

		if (!classes.contains(name)) { return; }
		alignPosition(e.relatedTarget, node, classes);
	}

	document.addEventListener('dom-activate', activate);

	dom.alignPosition = alignPosition;
})(this);
