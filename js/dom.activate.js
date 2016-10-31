(function(window) {
	"use strict";

	var Fn        = window.Fn;
	var dom       = window.dom;
	var on        = dom.events.on;
	var off       = dom.events.off;
	var trigger   = dom.events.trigger;

	var isDefined = Fn.isDefined;

	var debug     = false;//true;
	var activeClass = "active";
	var onClass   = "on";
	var location  = window.location;
	var id        = location.hash;
	var settings  = {
	    	cache: true
	    };

	var store     = new WeakMap();


	function prefixSlash(str) {
		return (/^\//.test(str) ? '' : '/') + str ;
	}

	function sameOrigin() {
		var node = this;
		
		//     IE gives us the port on node.host, even where it is not
		//     specified. Use node.hostname.
		return location.hostname === node.hostname &&
		//     IE gives us node.pathname without a leading slash, so
		//     add one before comparing.
		       location.pathname === prefixSlash(node.pathname);
	}

	function findButtons(id) {
		return jQuery('a[href$="#' + id + '"]')
			.filter(sameOrigin)
			.add('[data-href="#' + id + '"]');
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
		if (debug) { console.log('jquery.addTransitionClass', classes, !!callback); }
		
		transition(node, function() {
			dom.classes(node).add(classes);
		}, callback);
	};
	
	function removeTransitionClass(node, classes, callback) {
		if (debug) { console.log('jquery.removeTransitionClass', classes, !!callback); }
		
		transition(node, function() {
			dom.classes(node).remove(classes);
		}, callback);
	}
	
	function transition(node, fn, callback) {
		if (debug) { console.log('jquery.transition', !!fn, !!callback); }
		
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
		var data = this.data || cacheData(e.target);
		var node = data.node;
		var buttons;

		// Don't do anything if elem is already active
		if (data.active) { return; }
		data.active = true;
		this.preventDefault();

		if (debug) { console.log('[activate] default | target:', e.target.id, 'data:', data); }

		addTransitionClass(node, activeClass, function() {
			dom.trigger('activateend', node);
		});

		buttons = getButtons(data);

		if (buttons) {
			buttons.addClass(onClass);
		}
	}

	function defaultDeactivate() {
		var data = this.data || cacheData(e.target);
		var node = data.node;
		var buttons;

		// Don't do anything if elem is already inactive
		if (!data.active) { return; }
		data.active = false;
		this.preventDefault();
		
		if (debug) { console.log('[deactivate] default | target:', e.target.id, 'data:', data); }
		
		removeTransitionClass(node, activeClass, function() {
			dom.trigger('deactivateend', node);
		});

		buttons = getButtons(data);
		
		if (buttons) {
			buttons.removeClass(onClass);
		}
	}

	on(document, 'activate', function(e) {
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

	on(document, 'deactivate', function(e) {
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

	var targets = {
		dialog: function(e) {
			var href = e.currentTarget.getAttribute('data-href') || e.currentTarget.hash || e.currentTarget.href;
			var id = href.substring(1);
			var node, parts, item;

			if (!id) { return loadResource(e, href); }
		
			if (parts = /([\w-]+)\/([\w-]+)/.exec(id)) {
				id = parts[1];
			}

			node = nodeCache[id] || document.getElementById(id);

			if (!node) { return loadResource(e, href); }

			e.preventDefault();
		
			// If the node is html hidden inside a text/html script tag,
			// extract the html.
			if (node.getAttribute && node.getAttribute('type') === 'text/html') {
				// TODO: jQuery 1.9.1 and 2.0.0b2 are failing because html
				// needs to be whitespace trimmed.
				node = jQuery(node).html();
			}

			// If it's a template...
			if (node.tagName && node.tagName.toLowerCase() === 'template') {
				// If it is not inert (like in IE), remove it from the DOM to
				// stop ids in it clashing with ids in the rendered result.
				if (!node.content) { jQuery(node).remove(); }
				node = nodeCache[id] = jQuery(node).html();
			}

			jQuery(node).dialog('lightbox');
		
			if (parts) {
				item = jQuery('#' + parts[2]);

				item
				.addClass('notransition')
				.trigger('activate')
				.width();
		
				item
				.removeClass('notransition');
			}
		}
	};

	var rImage = /\.(?:png|jpeg|jpg|gif|PNG|JPEG|JPG|GIF)$/;
	var rYouTube = /youtube\.com/;

	var nodeCache = {};

	function preventClick(e) {
		// Prevent the click that follows the mousedown. The preventDefault
		// handler unbinds itself as soon as the click is heard.
		if (e.type === 'mousedown') {
			on(e.currentTarget, 'click', function prevent(e) {
				remove(e.currentTarget, 'click', prevent);
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
		if (e.type === 'mousedown' && !dom.isPrimaryButton(e)) { return true; }

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

		trigger(node, 'activate', { relatedTarget: e.currentTarget });
	}

	function getHash(node) {
		return (isDefined(node.hash) ?
			node.hash :
			node.getAttribute('href')
		).substring(1);
	}

	function activateHash(e) {
		var id, node, data;

		if (isIgnorable(e)) { return; }
		if (dom.isExternalLink(e.currentTarget)) { return; }

		// Does it point to an id?
		id = getHash(e.delegateTarget);
		if (!id) { return; }

		// Does it point to a node?
		node = document.getElementById(id);
		if (!node) { return; }

		//data = boltData(node);
		//if (!data) { return; }

		activate(e, node);
	}

	function activateTarget(e) {
		var target = e.currentTarget.target;

		if (isIgnorable(e)) { return; }

		// If the target is not listed, ignore
		if (!targets[target]) { return; }

		if (e.type === 'mousedown') { preventClick(e); }

		return targets[target](e);
	}

	// Clicks on buttons toggle activate on their hash
	on(document, 'click', dom.delegate('[href]', activateHash));

	// Clicks on buttons toggle activate on their targets
	on(document, 'click', dom.delegate('a[target]', activateTarget));


	// Document setup

	dom.ready(function() {
		// Setup all things that should start out active.
		dom('.' + activeClass)
		.each(dom.trigger('activate'));
		
		// Activate the node that corresponds to the hashref in
		// location.hash, checking if it's an alphanumeric id selector
		// (not a hash bang).
		if (!id || !(/^#\S+$/.test(id))) { return; }
		
		// The id may be perfectly valid, yet not be supported by jQuery,
		// such as ids with a ':' character, so try...catch it.
		try {
			dom(id).each(dom.trigger('activate'));
		}
		catch (e) {
			if (debug) console.log('Error caught: id hash ' + id + ' is throwing an error in jQuery');
		}
	});

})(this);
