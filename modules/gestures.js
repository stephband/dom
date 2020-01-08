
/*
gestures
*/

import { requestTick, Stream } from '../../fn/module.js';
import closest from './closest.js';
import events, { isPrimaryButton, preventDefault, on, off, trigger } from './events.js';

// Number of pixels a pressed pointer travels before gesture is started.
var threshold = 8;

var ignoreTags = {
		textarea: true,
		input: true,
		select: true,
		button: true
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


function isIgnoreTag(e) {
	var tag = e.target.tagName;
	return tag && !!ignoreTags[tag.toLowerCase()];
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
	if (touch.pageX === data.pageX && touch.pageY === data.pageY) { return; }

	return touch;
}


// Handlers that decide when the first movestart is triggered

function mousedown(e, push) {
	// Ignore non-primary buttons
	if (!isPrimaryButton(e)) { return; }

	// Ignore form and interactive elements
	if (isIgnoreTag(e)) { return; }

	// If we preventDefault we need to recreate focus... but we shouldnt
	// preventDefault here anyway (this is a note that inherited from a
	// refactor of dom-gesture event, which no longer exists).
	//e.preventDefault();
	//const focusable = e.target.closest('[tabindex]');
	//focusable && focusable.focus();

	on(document, mouseevents.move, mousemove, [e], push);
	on(document, mouseevents.cancel, mouseend, [e]);
}

function mousemove(e, events, push){
	events.push(e);
	checkThreshold(e, events, e, removeMouse, push);
}

function mouseend(e, data) {
	removeMouse();
}

function removeMouse() {
	off(document, mouseevents.move, mousemove);
	off(document, mouseevents.cancel, mouseend);
}

function touchstart(e, push) {
	// Don't get in the way of interaction with form elements
	if (ignoreTags[e.target.tagName.toLowerCase()]) { return; }

	var touch = e.changedTouches[0];

	// iOS live updates the touch objects whereas Android gives us copies.
	// That means we can't trust the touchstart object to stay the same,
	// so we must copy the data. This object acts as a template for
	// movestart, move and moveend event objects.
	var event = {
		target:     touch.target,
		pageX:      touch.pageX,
		pageY:      touch.pageY,
		identifier: touch.identifier,

		// The only way to make handlers individually unbindable is by
		// making them unique. This is a crap place to put them, but it
		// will work.
		touchmove:  function() { touchmove.apply(this, arguments); },
		touchend:   function() { touchend.apply(this, arguments); }
	};

	on(document, touchevents.move, event.touchmove, [event], push);
	on(document, touchevents.cancel, event.touchend, [event]);
}

function touchmove(e, events, push) {
	var touch = changedTouch(e, events[0]);
	if (!touch) { return; }
	checkThreshold(e, events, touch, removeTouch, push);
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

function checkThreshold(e, events, touch, removeHandlers, push) {
	var distX = touch.pageX - events[0].pageX;
	var distY = touch.pageY - events[0].pageY;

	// Do nothing if the threshold has not been crossed.
	if ((distX * distX) + (distY * distY) < (threshold * threshold)) { return; }

	var e0   = events[0];
	var node = events[0].target;

	// Unbind handlers that tracked the touch or mouse up till now.
	removeHandlers(events);
	push(TouchStream(node, events));

	// Trigger the gesture event
	//trigger(events[0].target, 'dom-gesture', {
	//	pageX:  e0.pageX,
	//	pageY:  e0.pageY,
	//	detail: function() {
    //        return TouchStream(node, events);
	//	}
	//});
}


// Handlers that control what happens following a movestart

function activeMousemove(e, data) {
	data.touch = e;
	data.timeStamp = e.timeStamp;
	data.stream.push(e);
}

function activeMouseend(e, data) {
	var target = data.target;

	removeActiveMouse();
	data.stream.stop();
}

function removeActiveMouse() {
	off(document, mouseevents.move, activeMousemove);
	off(document, mouseevents.end, activeMouseend);
}

function activeTouchmove(e, data) {
	var touch = changedTouch(e, data);

	if (!touch) { return; }

	// Stop the interface from scrolling
	e.preventDefault();

	data.touch = touch;
	data.timeStamp = e.timeStamp;
	data.stream.push(touch);
}

function activeTouchend(e, data) {
	var touch  = identifiedTouch(e.changedTouches, data.identifier);

	// This isn't the touch you're looking for.
	if (!touch) { return; }

	removeActiveTouch(data);
	data.stream.stop();
}

function removeActiveTouch(data) {
	off(document, touchevents.move, data.activeTouchmove);
	off(document, touchevents.end, data.activeTouchend);
}

function TouchStream(node, events) {
	var stream = Stream.from(events);

	var data = {
		stream:     stream,
		target:     node,
		touch:      undefined,
		identifier: events[0].identifier
	};

	if (data.identifier === undefined) {
		// We're dealing with a mouse event.
		// Stop clicks from propagating during a move
		on(node, 'click', preventDefault);
		on(document, mouseevents.move, activeMousemove, data);
		on(document, mouseevents.cancel, activeMouseend, data);
	}
	else {
		// In order to unbind correct handlers they have to be unique
		data.activeTouchmove = function(e) { activeTouchmove(e, data); };
		data.activeTouchend  = function(e) { activeTouchend(e, data); };

		// We're dealing with a touch.
		on(document, touchevents.move, data.activeTouchmove);
		on(document, touchevents.end, data.activeTouchend);
	}

	stream.done(function() {
		// Unbind the click suppressor, waiting until after mouseup
		// has been handled. I don't know why it has to be any longer than
		// a tick, but it does, in Chrome at least.
		setTimeout(function() {
			off(node, 'click', preventDefault);
		}, 200);
	});

	return stream;
}

export default function gestures(node) {
	return new Stream(function(push, stop) {
		on(node, 'mousedown', mousedown, push);
		on(node, 'touchstart', touchstart, push);

		return {
			stop: function() {
				off(node, 'mousedown', mousedown);
				off(node, 'touchstart', touchstart);
			}
		};
	});
};
