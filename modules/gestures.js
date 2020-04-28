
/**
gestures(options, node)

Returns a stream of streams of events. Each stream of events represents the
motion of a single finger. The types of events the stream contains is either
`'mousedown'` followed by any number of `'mousemove'`s and a `'mouseup'`,
or the touch objects that go with `'touchstart'`, any number of `'touchmove'`s
and a `'touchend'`.

```js
gestures({ selector: '.thing', threshold: '0.5rem' }, document)
.each(function(events) {
	// First event is a mousedown or touchstart event
	const e0 = events.shift();

	events.each(function(e1) {
		// Mousemove or touchmove events
		const distance = Math.pow(
			Math.pow(e1.clientX - e0.clientX, 2),
			Math.pow(e1.clientY - e0.clientY, 2),
		0.5);
		...
	});
});
```
*/

import { Stream } from '../../fn/module.js';
import { parseValue } from './parse-value.js';
import { isPrimaryButton, on, off } from './events.js';

export const config = {
	// Number of pixels, or string CSS length, that a pressed pointer travels
	// before gesture is started.
	threshold: 4,

	ignoreTags: {
		textarea: true,
		input: true,
		select: true,
		button: true
	}
};

var mouseevents = {
	move:   'mousemove',
	cancel: 'mouseup dragstart',
	end:    'mouseup'
};

var touchevents = {
	// Todo: why do we need passive: false? On iOS scrolling can be blocked with
	// touch-action: none... do we want to block on any arbitrary thing that we
	// gesture on or leave it to be explicitly set in CSS?
	move:   { type: 'touchmove', passive: false },
	cancel: 'touchend',
	end:    'touchend'
};

const assign = Object.assign;

function isIgnoreTag(e) {
	var tag = e.target.tagName;
	return tag && !!config.ignoreTags[tag.toLowerCase()];
}

function identifiedTouch(touchList, id) {
	var i, l;

	if (touchList.identifiedTouch) {
		return touchList.identifiedTouch(id);
	}

	// touchList.identifiedTouch() does not exist in
	// webkit yet… we must do the search ourselves...

	i = -1;
	l = touchList.length;

	while (++i < l) {
		if (touchList[i].identifier === id) {
			return touchList[i];
		}
	}
}

function changedTouch(e, data) {
	var touch = identifiedTouch(e.changedTouches, data.identifier);

	// This isn't the touch you're looking for.
	if (!touch) { return; }

	// Chrome Android (at least) includes touches that have not
	// changed in e.changedTouches. That's a bit annoying. Check
	// that this touch has changed.
	if (touch.clientX === data.clientX && touch.clientY === data.clientY) { return; }

	return touch;
}

function preventOne(e) {
	e.preventDefault();
	e.currentTarget.removeEventListener(e.type, preventOne);
}

function preventOneClick(e) {
	e.currentTarget.addEventListener('click', preventOne);
}


// Handlers that decide when the first movestart is triggered

function mousedown(e, push, options) {
	// Ignore non-primary buttons
	if (!isPrimaryButton(e)) { return; }

	// Ignore form and interactive elements
	if (isIgnoreTag(e)) { return; }

	// Check target matches selector
	if (options.selector && !e.target.closest(options.selector)) { return; }

	on(document, mouseevents.move, mousemove, [e], push, options);
	on(document, mouseevents.cancel, mouseend, [e]);
}

function mousemove(e, events, push, options){
	events.push(e);
	checkThreshold(e, events, e, removeMouse, push, options);
}

function mouseend(e, data) {
	removeMouse();
}

function removeMouse() {
	off(document, mouseevents.move, mousemove);
	off(document, mouseevents.cancel, mouseend);
}

function touchstart(e, push, options) {
	// Ignore form and interactive elements
	if (isIgnoreTag(e)) { return; }

	// Check target matches selector
	if (options.selector && !e.target.closest(options.selector)) { return; }

	var touch = e.changedTouches[0];

	// iOS live updates the touch objects whereas Android gives us copies.
	// That means we can't trust the touchstart object to stay the same,
	// so we must copy the data. This object acts as a template for
	// movestart, move and moveend event objects.
	var event = {
		target:     touch.target,
		clientX:      touch.clientX,
		clientY:      touch.clientY,
		identifier: touch.identifier,

		// The only way to make handlers individually unbindable is by
		// making them unique. This is a crap place to put them, but it
		// will work.
		touchmove:  function() { touchmove.apply(this, arguments); },
		touchend:   function() { touchend.apply(this, arguments); }
	};

	on(document, touchevents.move, event.touchmove, [event], push, options);
	on(document, touchevents.cancel, event.touchend, [event]);
}

function touchmove(e, events, push, options) {
	var touch = changedTouch(e, events[0]);
	if (!touch) { return; }
	checkThreshold(e, events, touch, removeTouch, push, options);
}

function touchend(e, events) {
	var touch = identifiedTouch(e.changedTouches, events[0].identifier);
	if (!touch) { return; }
	removeTouch(events);
}

function removeTouch(events) {
	off(document, touchevents.move, events[0].touchmove);
	off(document, touchevents.cancel, events[0].touchend);
}

function checkThreshold(e, events, touch, removeHandlers, push, options) {
	var distX = touch.clientX - events[0].clientX;
	var distY = touch.clientY - events[0].clientY;
	var threshold = parseValue(options.threshold);

	// Do nothing if the threshold has not been crossed.
	if ((distX * distX) + (distY * distY) < (threshold * threshold)) {
		return;
	}

	var node = events[0].target;

	// Unbind handlers that tracked the touch or mouse up till now.
	removeHandlers(events);
	push(touches(node, events));
}


// Handlers that control what happens following a movestart

function activeMousemove(e, data, push) {
	data.touch = e;
	data.timeStamp = e.timeStamp;
	push(e);
}

function activeMouseend(e, data, stop) {
	removeActiveMouse();
	stop();
}

function removeActiveMouse() {
	off(document, mouseevents.end, preventOneClick);
	off(document, mouseevents.move, activeMousemove);
	off(document, mouseevents.cancel, activeMouseend);
}

function activeTouchmove(e, data, push) {
	var touch = changedTouch(e, data);

	if (!touch) { return; }

	// Stop the interface from scrolling
	e.preventDefault();

	data.touch = touch;
	data.timeStamp = e.timeStamp;
	push(touch);
}

function activeTouchend(e, data, stop) {
	var touch  = identifiedTouch(e.changedTouches, data.identifier);

	// This isn't the touch you're looking for.
	if (!touch) { return; }
	removeActiveTouch(data);
	stop();
}

function removeActiveTouch(data) {
	off(document, touchevents.move, data.activeTouchmove);
	off(document, touchevents.end, data.activeTouchend);
}

function touches(node, events) {
	return events[0].identifier === undefined ?
		Stream(function MouseSource(push, stop) {
			var data = {
				target: node,
				touch: undefined
			};

			// Todo: Should Stream, perhaps, take { buffer } as a source
			// property, allowing us to return any old buffer (as long as
			// it has .shift())? Or are we happy pushing in, which causes
			// a bit of internal complexity in Stream?
			push.apply(null, events);

			// We're dealing with a mouse event.
			// Stop click from propagating at the end of a move
			on(document, mouseevents.end, preventOneClick);
			on(document, mouseevents.move, activeMousemove, data, push);
			on(document, mouseevents.cancel, activeMouseend, data, stop);

			return {
				stop: function() {
					removeActiveMouse();
					stop();
				}
			};
		}):

		Stream(function TouchSource(push, stop) {
			var data = {
				target: node,
				touch: undefined,
				identifier: events[0].identifier
			};

			push.apply(null, events);

			// Track a touch
			// In order to unbind correct handlers they have to be unique
			data.activeTouchmove = function (e) { activeTouchmove(e, data, push); };
			data.activeTouchend = function (e) { activeTouchend(e, data, stop); };

			// We're dealing with a touch.
			on(document, touchevents.move, data.activeTouchmove);
			on(document, touchevents.end, data.activeTouchend);

			return {
				stop: function () {
					removeActiveTouch(data);
					stop();
				}
			};
		});
}

export default function gestures(options, node) {
	// Support legacy signature gestures(node)
	if (!node) {
		console.trace('Deprecated gestures(node), now gestures(options, node)');
	}

	options = node ?
		options ? assign({}, config, options) : config :
		config ;
	node = node ?
		node :
		options ;

	return new Stream(function(push, stop) {
		function mouseHandler(e) {
			mousedown(e, push, options);
		}

		function touchHandler(e) {
			touchstart(e, push, options);
		}

		on(node, 'mousedown', mouseHandler);
		on(node, 'touchstart', touchHandler);

		return {
			stop: function() {
				off(node, 'mousedown', mouseHandler);
				off(node, 'touchstart', touchHandler);
				stop();
			}
		};
	});
}
