// dom.popable
//
// Extends the default behaviour of events for the .tip class.

(function(windw) {

	var name    = "popable";

	var noop    = Fn.noop;
	var on      = dom.events.on;
	var off     = dom.events.off;
	var trigger = dom.events.trigger;

	var keymap = {
		27: function escape(e) {
			trigger(e.data, 'deactivate');
		}
	};

	function click(e, data) {
		if (data.contains(e.target) || e.data === e.target) { return; }
		trigger(data, 'deactivate');
	}

	function keydown(e) {
		var fn = keymap[e.keyCode];
		if (!fn) { return; }
		fn(e);
		e.preventDefault();
	}

	function activate(e) {
		// Use method detection - e.defaultPrevented is not set in time for
		// subsequent listeners on the same node
		if (!e.default) { return; }

		var node    = e.target;
		var classes = dom.classes(node);
		if (!classes.contains(name)) { return; }

		//var relatedTarget = e.relatedTarget;
		//var relatedOffset = jQuery(relatedTarget).offset();

		// TEMP
		var elem = jQuery(node);
		classes.add('notransition');

		//node.style.marginTop = 0;
		//node.style.marginLeft = 0;

		var offset   = elem.offset();
		var position = elem.position();

		//node.style.marginTop = '';
		//node.style.marginLeft = '';
		// Round the number to get round a sub-pixel rendering error in Chrome
		//node.style.left = Math.floor(relatedOffset.left + position.left - offset.left);
		//node.style.top  = Math.floor(relatedOffset.top  + position.top  - offset.top);

		// Bump render
		elem.width();
		classes.remove('notransition');

		requestAnimationFrame(function() {
			on(document, 'click', click, e.target);
			on(document, 'keydown', keydown, e.target);
		});

		e.default();
	}

	function deactivate(e) {
		if (!e.default) { return; }

		var target = e.target;
		if (!dom.classes(target).contains(name)) { return; }

		off(document, 'click', click);
		off(document, 'keydown', keydown);

		e.default();
	}

	on(document, 'activate', activate);
	on(document, 'deactivate', deactivate);

})(this);
