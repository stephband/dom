import { curry, isDefined, overload, requestTick } from '../../fn/module.js';
import { append, classes, create, delegate, Event, events, fragmentFromChildren, isInternalLink, isPrimaryButton, tag, query, ready, remove, trigger } from '../module.js';

var DEBUG     = false;

var on        = events.on;
var off       = events.off;

var location  = window.location;
var id        = location.hash;

var store     = new WeakMap();

var apply = curry(function apply(node, fn) {
	return fn(node);
});

export const config = {
	activeClass: 'active',
	onClass:     'on',
	cache:       true
};

export const matchers = [];


function findButtons(id) {
	return query('[href$="#' + id + '"]', document.body)
	.filter(overload(tag, {
		a:       isInternalLink,
		default: function() { return true; }
	}))
	.concat(query('[data-href="#' + id + '"]', document));
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
	if (!data.buttons) { data.buttons = config.cache && id && findButtons(id); }

	return data;
}

function getButtons(data) {
	return (config.cache && data.buttons) || (data.node.id && findButtons(data.node.id));
}

// Listen to activate events

function defaultActivate() {
	var data = this.data || cacheData(this.target);
	var buttons;

	// Don't do anything if elem is already active
	if (data.active) { return; }
	data.active = true;
	this.preventDefault();

	if (DEBUG) { console.log('[activate] default | target:', this.target.id, 'data:', data); }

	classes(data.node).add(config.activeClass);
	buttons = getButtons(data);

	if (buttons) {
		buttons.forEach(function(node) {
			classes(node).add(config.onClass);
		});
	}
}

function defaultDeactivate() {
	var data = this.data || cacheData(this.target);
	var buttons;

	// Don't do anything if elem is already inactive
	if (!data.active) { return; }
	data.active = false;
	this.preventDefault();

	if (DEBUG) { console.log('[deactivate] default | target:', this.target.id, 'data:', data); }

	classes(data.node).remove(config.activeClass);
	buttons = getButtons(data);

	if (buttons) {
		buttons.forEach(function(node) {
			classes(node).remove(config.onClass);
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

var triggerActivate = trigger('dom-activate');

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
			fragment = create('fragment', node.innerHTML);
		}

		// If it's a template...
		if (node.tagName && node.tagName.toLowerCase() === 'template') {
			// If it is not inert (like in IE), remove it from the DOM to
			// stop ids in it clashing with ids in the rendered result.
			if (!node.content) { remove(node); }
			fragment = fragmentFromContent(node);
		}

		var dialog = dialogs[id] || (dialogs[id] = createDialog(fragment));
		events.trigger(dialog, 'dom-activate');
	}
};

//	var rImage   = /\.(?:png|jpeg|jpg|gif|PNG|JPEG|JPG|GIF)$/;
//	var rYouTube = /youtube\.com/;

function createDialog(content) {
	var layer = create('div', { class: 'dialog-layer layer' });
	var dialog = create('div', { class: 'dialog popable' });
	var button = create('button', { class: 'close-thumb thumb' });

	append(dialog, content);
	append(layer, dialog);
	append(layer, button);
	append(document.body, layer);

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
	if (!isPrimaryButton(e)) { return true; }

	// Ignore key presses other than the enter key
	if ((e.type === 'keydown' || e.type === 'keyup') && e.keyCode !== 13) { return true; }
}

function getHash(node) {
	return (isDefined(node.hash) ?
		node.hash :
		node.getAttribute('href')
	).substring(1);
}

function activateHref(e) {
	if (isIgnorable(e)) { return; }

	// Check whether the link points to something on this page
	if (e.delegateTarget.hostname && !isInternalLink(e.delegateTarget)) { return; }

	// Does it point to an id?
	var id = getHash(e.delegateTarget);
	if (!id) { return; }

	// Does it point to a node?
	var node = document.getElementById(id);
	if (!node) { return; }

	// Is the node activateable?
	if (!matchers.find(apply(node))) { return; }

	e.preventDefault();

	if (e.type === 'mousedown') {
		preventClick(e);
	}

	// TODO: This doesnt seem to set relatedTarget
	// trigger(node, 'dom-activate', { relatedTarget: e.delegateTarget });
	var a = Event('dom-activate', { relatedTarget: e.delegateTarget });
	node.dispatchEvent(a);
}

function activateTarget(e) {
	var target = e.delegateTarget.target;

	if (isIgnorable(e)) { return; }

	// If the target is not listed, ignore
	if (!targets[target]) { return; }
	return targets[target](e);
}

// Clicks on buttons toggle activate on their hash
on(document, 'click', delegate('a[href]', activateHref));

// Clicks on buttons toggle activate on their targets
on(document, 'click', delegate('a[target]', activateTarget));

// Document setup
ready(function() {
	// Setup all things that should start out active
	query('.' + config.activeClass, document).forEach(triggerActivate);
});

on(window, 'load', function() {
	// Activate the node that corresponds to the hashref in
	// location.hash, checking if it's an alphanumeric id selector
	// (not a hash bang, which google abuses for paths in old apps)
	if (!id || !(/^#\S+$/.test(id))) { return; }

	// Catch errors, as id may nonetheless be an invalid selector
	try {
		query(id, document).forEach(triggerActivate);
	}
	catch(e) {
		console.warn('dom: Cannot activate ' + id, e.message);
	}
});
