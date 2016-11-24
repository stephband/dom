// dom.popable
//
// Extends the default behaviour of events for the .tip class.

(function(windw) {

	var name    = "popable";
	var trigger = dom.events.trigger;

	function activate(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		if (!e.default) { return; }

		var node    = e.target;
		var classes = dom.classes(node);
		if (!classes.contains(name)) { return; }

		//var relatedTarget = e.relatedTarget;
		//var relatedOffset = jQuery(relatedTarget).offset();

		classes.add('notransition');

		//node.style.marginTop = 0;
		//node.style.marginLeft = 0;

		//var offset   = elem.offset();
		//var position = elem.position();

		//node.style.marginTop = '';
		//node.style.marginLeft = '';
		// Round the number to get round a sub-pixel rendering error in Chrome
		//node.style.left = Math.floor(relatedOffset.left + position.left - offset.left);
		//node.style.top  = Math.floor(relatedOffset.top  + position.top  - offset.top);

		// Bump render
		node.clientWidth;
		classes.remove('notransition');

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
			};

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
