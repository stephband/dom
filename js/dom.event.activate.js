(function(window) {
	"use strict";

	var debug     = false;

	var Fn        = window.Fn;
	var dom       = window.dom;
	var on        = dom.events.on;
	var off       = dom.events.off;
	var trigger   = dom.events.trigger;
	var isDefined = Fn.isDefined;

	var activeClass = "active";
	var onClass   = "on";
	var location  = window.location;
	var id        = location.hash;
	var settings  = { cache: true };

	var store     = new WeakMap();

	function findButtons(id) {
		return dom
		.query('a[href$="#' + id + '"]', document)
		.filter(dom.isInternalLink);
	}

	function getData(node) {
		var data = store.get(node);
		if (!data) {
			data = {};
			store.set(node, data);
		}
		return data;
	}

	function cacheData(target) {
		var data = getData(target);
		var id   = target.id;

		if (!data.node) { data.node = target; }
		if (!data.buttons) { data.buttons = settings.cache && id && findButtons(id); }

		return data;
	}

	function getButtons(data) {
		return (settings.cache && data.buttons) || (data.node.id && findButtons(data.node.id));
	}

	function addTransitionClass(node, classes, callback) {
		transition(node, function() {
			dom.classes(node).add(classes);
		}, callback);
	}

	function removeTransitionClass(node, classes, callback) {
		transition(node, function() {
			dom.classes(node).remove(classes);
		}, callback);
	}

	function transition(node, fn, callback) {
		if (callback && dom.features.transition) {
			on(node, dom.features.transitionEnd, function transitionend(e) {
				off(node, dom.features.transitionEnd, transitionend);
				callback.apply(node);
			});
		}

		fn.apply(this);

		if (callback && !dom.features.transition) {
			callback.apply(node);
		}
	}


	// Listen to activate events

	function defaultActivate() {
		var data = this.data || cacheData(this.target);
		var node = data.node;
		var buttons;

		// Don't do anything if elem is already active
		if (data.active) { return; }
		data.active = true;
		this.preventDefault();

		if (debug) { console.log('[activate] default | target:', this.target.id, 'data:', data); }

		addTransitionClass(node, activeClass, function() {
			dom.trigger('dom-activateend', node);
		});

		buttons = getButtons(data);

		if (buttons) {
			buttons.forEach(function(node) {
				dom.classes(node).add(onClass);
			});
		}
	}

	function defaultDeactivate() {
		var data = this.data || cacheData(this.target);
		var node = data.node;
		var buttons;

		// Don't do anything if elem is already inactive
		if (!data.active) { return; }
		data.active = false;
		this.preventDefault();

		if (debug) { console.log('[deactivate] default | target:', this.target.id, 'data:', data); }

		removeTransitionClass(node, activeClass, function() {
			dom.trigger('dom-deactivateend', node);
		});

		buttons = getButtons(data);

		if (buttons) {
			buttons.forEach(function(node) {
				dom.classes(node).remove(onClass);
			});
		}
	}

	on(document, 'dom-activate', function(e) {
		if (e.defaultPrevented) { return; }

		var data = cacheData(e.target);

		// Don't do anything if elem is already active
		if (data.active) {
			e.preventDefault();
			return;
		}

		e.data    = data;
		e.default = defaultActivate;
	});

	on(document, 'dom-deactivate', function(e) {
		if (e.defaultPrevented) { return; }

		var data = cacheData(e.target);

		// Don't do anything if elem is already inactive
		if (!data.active) {
			e.preventDefault();
			return;
		}

		e.data    = data;
		e.default = defaultDeactivate;
	});


	// Listen to clicks

	var nodeCache = {};

	var dialogs = {};

	var targets = {
		dialog: function(e) {
			var href = e.delegateTarget.getAttribute('data-href') || e.delegateTarget.hash || e.delegateTarget.href;

			//Todo: more reliable way of getting id from a hash ref
			var id = href.substring(1);
			var fragment;

//			if (!id) { return loadResource(e, href); }

//			if (parts = /([\w-]+)\/([\w-]+)/.exec(id)) {
//				id = parts[1];
//			}

			var node = nodeCache[id] || (nodeCache[id] = document.getElementById(id));

//			if (!node) { return loadResource(e, href); }

			e.preventDefault();

			// If the node is html hidden inside a text/html script tag,
			// extract the html.
			if (node.getAttribute && node.getAttribute('type') === 'text/html') {
				// Todo: trim whitespace from html?
				fragment = dom.create('fragment', node.innerHTML);
			}

			// If it's a template...
			if (node.tagName && node.tagName.toLowerCase() === 'template') {
				// If it is not inert (like in IE), remove it from the DOM to
				// stop ids in it clashing with ids in the rendered result.
				if (!node.content) { dom.remove(node); }
				fragment = dom.fragmentFromContent(node);
			}

			var dialog = dialogs[id] || (dialogs[id] = createDialog(fragment));
			trigger(dialog, 'dom-activate');
		}
	};

//	var rImage   = /\.(?:png|jpeg|jpg|gif|PNG|JPEG|JPG|GIF)$/;
//	var rYouTube = /youtube\.com/;

	function createDialog(content) {
		var layer = dom.create('div', { class: 'dialog-layer layer' });
		var dialog = dom.create('div', { class: 'dialog popable' });
		var button = dom.create('button', { class: 'close-thumb thumb' });

		dom.append(dialog, content);
		dom.append(layer, dialog);
		dom.append(layer, button);
		dom.append(document.body, layer);

		return dialog;
	}

//	function loadResource(e, href) {
//		var link = e.currentTarget;
//		var path = link.pathname;
//		var node, elem, dialog;
//
//		if (rImage.test(link.pathname)) {
//			e.preventDefault();
//			img = new Image();
//			dialog = createDialog();
//			var classes = dom.classes(dialog);
//			classes.add('loading');
//			dom.append(dialog, img);
//			on(img, 'load', function() {
//				classes.remove('loading');
//			});
//			img.src = href;
//			return;
//		}
//
//		if (rYouTube.test(link.hostname)) {
//			e.preventDefault();
//
//			// We don't need a loading indicator because youtube comes with
//			// it's own.
//			elem = dom.create('iframe', {
//				src:             href,
//				class:           "youtube_iframe",
//				width:           "560",
//				height:          "315",
//				frameborder:     "0",
//				allowfullscreen: true
//			});
//
//			node = elem[0];
//			elem.dialog('lightbox');
//			return;
//		}
//	}

	function preventClick(e) {
		// Prevent the click that follows the mousedown. The preventDefault
		// handler unbinds itself as soon as the click is heard.
		if (e.type === 'mousedown') {
			on(e.currentTarget, 'click', function prevent(e) {
				off(e.currentTarget, 'click', prevent);
				e.preventDefault();
			});
		}
	}

	function isIgnorable(e) {
		// Default is prevented indicates that this link has already
		// been handled. Save ourselves the overhead of further handling.
		if (e.defaultPrevented) { return true; }

		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		if (!dom.isPrimaryButton(e)) { return true; }

		// Ignore key presses other than the enter key
		if ((e.type === 'keydown' || e.type === 'keyup') && e.keyCode !== 13) { return true; }
	}

	function activate(e, node) {
		e.preventDefault();

		if (e.type === 'mousedown') {
			preventClick(e);
		}

		//if (data.active === undefined ?
		//		data.bolt.elem.hasClass('active') :
		//		data.active ) {
		//	return;
		//}

		trigger(node, 'dom-activate', { relatedTarget: e.currentTarget });
	}

	function getHash(node) {
		return (isDefined(node.hash) ?
			node.hash :
			node.getAttribute('href')
		).substring(1);
	}

	function activateHash(e) {
		if (isIgnorable(e)) { return; }
		if (e.delegateTarget.hostname && !dom.isInternalLink(e.delegateTarget)) { return; }

		// Does it point to an id?
		var id = getHash(e.delegateTarget);
		if (!id) { return; }

		// Does it point to a node?
		var node = document.getElementById(id);
		if (!node) { return; }

		// Is the node popable, switchable or toggleable?
		var classes = dom.classes(node);
		if (!classes.contains('popable') &&
			!classes.contains('switchable') &&
			!classes.contains('toggleable')) { return; }

		activate(e, node);
	}

	function activateTarget(e) {
		var target = e.delegateTarget.target;

		if (isIgnorable(e)) { return; }

		// If the target is not listed, ignore
		if (!targets[target]) { return; }
		return targets[target](e);
	}

	// Clicks on buttons toggle activate on their hash
	on(document, 'click', dom.delegate('[href], [data-href]', activateHash));

	// Clicks on buttons toggle activate on their targets
	on(document, 'click', dom.delegate('a[target]', activateTarget));


	// Document setup

	dom.ready(function() {
		// Setup all things that should start out active.
		dom('.' + activeClass)
		.each(dom.trigger('dom-activate'));

		// Activate the node that corresponds to the hashref in
		// location.hash, checking if it's an alphanumeric id selector
		// (not a hash bang).
		if (!id || !(/^#\S+$/.test(id))) { return; }

		// The id may be perfectly valid, yet not be supported by jQuery,
		// such as ids with a ':' character, so try...catch it.
		try {
			dom(id).each(dom.trigger('dom-activate'));
		}
		catch (e) {
			if (debug) console.log('Error caught: id hash ' + id + ' is throwing an error in jQuery');
		}
	});
})(this);
