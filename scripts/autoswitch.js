
import '../js/dom.switchable.js';
import '../js/dom.swipeable.js';
import { get, weakCache } from '../../fn/fn.js';
import { after, append, attribute, before, children, classes, clone, closest, events, matches, query, trigger } from '../dom.js';

const duration = 6000;
const jitter   = 0;
const getData  = weakCache(() => {});

var data = (function(store) {
	return function data(node) {
		var object = store.get(node);
		if (object) { return object; }
		object = {};
		store.set(node, object);
		return object;
	};
})(new WeakMap());

function triggerNext(block) {
	var timer = data(block).timer;
	var next  = data(block).nextSlide;

	clearTimeout(timer);
	data(block).timer = true;
	trigger('dom-activate', next);
}

function reposition(block, pane) {
	var width = block.clientWidth;
	var x     = pane.offsetLeft;
	var xMarg = 0;//dom.style('margin-left', pane);
	block.style.transform = "translate(calc(" + (-100 * x / width) + "% + " + xMarg + "px), 0)";
}

function rearrange(block, panes, n) {
	var pane0    = panes[0];
	var paneLast = panes[panes.length - 1];
	var classy  = classes(block);

	classy.add('notransition');

	if (n < 3) {
		before(pane0, paneLast);
	}
	else {
		after(paneLast, pane0);
	}

	reposition(block, panes[n]);

	// FF requires 2 frames before it calms down enough to respect
	// the notransition class
	requestAnimationFrame(function() {
		requestAnimationFrame(function() {
			classy.remove('notransition');
		});
	});
}

function touch(e) {
	if (e.defaultPrevented) { return; }

	// Pause auto activate during touch
	var block = closest('.swipe-block', e.target);
	var timer = data(block).timer;
	if (timer) {
		clearTimeout(timer);
		data(block).timer = true;
	}
}

function isSwitchable(node) {
	return classes(node).contains('switchable');
}

function cloneAttr(name, node, suffix) {
	var value = attribute(name, node);
	if (!value) { return; }
	node.setAttribute(name, value + suffix);
}

function duplicateSlides(slides, layers, texts, n, suffix) {
	var cloneSlides = slides
	.map(clone)
	.map(function(node) {
		node.id = node.id + suffix;
		classes(node).remove('active');
		return node;
	});

	append(slides[0].parentNode, cloneSlides);

	if (layers.length) {
		var cloneLayers = layers
		.map(clone)
		.map(function(node) {
			cloneAttr('href', node, suffix);
			cloneAttr('data-href', node, suffix);
			classes(node).remove('on');
			return node;
		});

		append(layers[0].parentNode, cloneLayers);
	}

	if (texts.length) {
		var cloneTexts = texts
		.map(clone)
		.map(function(node) {
			cloneAttr('href', node, suffix);
			cloneAttr('data-href', node, suffix);
			classes(node).remove('on');
			return node;
		});

		append(texts[0].parentNode, cloneTexts);
	}

	n = n + cloneSlides.length;

	if (n < 6) {
		duplicateSlides(slides, layers, texts, n, suffix + '-clone');
	}
}

function activate(e) {
	// Ignore activate events from inside slides
	if (e.target !== e.delegateTarget) { return; }

	var block  = e.delegateTarget.parentNode;
	var slides = children(block).filter(isSwitchable);
	var index  = slides.indexOf(e.target);
	var prev   = query('.prev_thumb[data-target="#' + block.id + '"]', document);
	var next   = query('.next_thumb[data-target="#' + block.id + '"]', document);

	// Replace hrefs of previous and next buttons
	if (index === 0) {
		prev.forEach(function(node) {
			node.setAttribute('href', '#' + slides[slides.length - 1].id);
		});
	}
	else {
		prev.forEach(function(node) {
			node.setAttribute('href', '#' + slides[index - 1].id);
		});
	}

	if (index === slides.length - 1) {
		next.forEach(function(node) {
			node.setAttribute('href', '#' + slides[0].id);
		});
		data(block).nextSlide = slides[0];
	}
	else {
		next.forEach(function(node) {
			node.setAttribute('href', '#' + slides[index + 1].id);
		});
		data(block).nextSlide = slides[index + 1];
	}

	function transitionend(e) {
		clearTimeout(endTimer);
		rearrange(block, slides, index);

		var selector = attribute('data-slide-slave', block);
		if (!selector) { return; }

		var slaves = query(selector, document);
		slaves.forEach(function(slave) {
			var slides = children(slave);
			if (!slides.length) { return; }
			rearrange(slave, slides, index);
		});
	}

	// Transitionend appears to fire to early for the end of the transition
	var endTimer = setTimeout(transitionend, 333);
}

function activateTimer(switchable) {
	const block = switchable.parentNode;
    const data  = getData(block);

	clearTimeout(getData(block).timer);

	if (data(block).timer !== false) {
		data(block).timer = setTimeout(triggerNext, interval + (Math.random() + Math.random() - 1) * jitter, block);
	}
}

function clickPlay(e) {
	var block = query(attribute('data-target', e.delegateTarget), document)[0];
	triggerNext(block);
	var classy = classes(e.delegateTarget.parentNode);
	classy.remove('paused');
}

function clickPause(e) {
	var block = query(attribute('data-target', e.delegateTarget), document)[0];
	var timer = data(block).timer;
	clearTimeout(timer);
	data(block).timer = false;
	var classy = classes(e.delegateTarget.parentNode);
	classy.add('paused');
}









const getTarget = get('target');

events('dom-activate', document)
.map(getTarget)
.filter(matches('.autoswitch > .switchable'))
.each(activateTimer);


//on(document, 'click',        dom.delegate('.play_thumb[data-target]',  clickPlay));
//on(document, 'click',        dom.delegate('.pause_thumb[data-target]', clickPause));

/*
dom('.swipe-wrap-block').forEach(function(node) {
	var slides = query('.switchable', node);
	var layers = query('.fg-layer > .swipe-block > .block', node);
	var texts  = query('.text-layer', node);

	if (slides.length < 6) {
		duplicateSlides(slides, layers, texts, slides.length, '-clone');
	}
});
*/
