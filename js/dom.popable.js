// dom.popable
//
// Extends the default behaviour of events for the .tip class.

(function(window) {

	var dom     = window.dom;
	var name    = "popable";
	var trigger = dom.events.trigger;

	function activate(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		if (!e.default) { return; }

		var node    = e.target;
		var classes = dom.classes(node);
		if (!classes.contains(name)) { return; }

		requestAnimationFrame(function() {
			function click(e) {
				if (node.contains(e.target) || node === e.target) { return; }
				trigger(node, 'dom-deactivate');
			}

			function keydown(e) {
				if (e.keyCode !== 27) { return; }
				trigger(node, 'dom-deactivate');
				e.preventDefault();
			}

			function deactivate(e) {
				if (node !== e.target) { return; }
				if (e.defaultPrevented) { return; }
				document.removeEventListener('click', click);
				document.removeEventListener('keydown', keydown);
				document.removeEventListener('dom-deactivate', deactivate);
			}

			document.addEventListener('click', click);
			document.addEventListener('keydown', keydown);
			document.addEventListener('dom-deactivate', deactivate);
		});

		e.default();
	}

	function deactivate(e) {
		if (!e.default) { return; }

		var target = e.target;
		if (!dom.classes(target).contains(name)) { return; }
		e.default();
	}

	document.addEventListener('dom-activate', activate);
	document.addEventListener('dom-deactivate', deactivate);
})(this);
